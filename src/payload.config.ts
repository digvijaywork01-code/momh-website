import { postgresAdapter, sql } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { resendAdapter } from '@payloadcms/email-resend'

import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { NewsletterSubscribers } from './collections/NewsletterSubscribers'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  collections: [Pages, Posts, Media, Categories, Users, NewsletterSubscribers],
  cors: [getServerSideURL()].filter(Boolean),
  // Boot-time bootstrap for the `newsletter_subscribers` collection.
  //
  // The collection ships without a Payload migration entry because the
  // migrations/index.ts on this project is intentionally minimal (the
  // earlier 20250728 migration is broken and re-applying the
  // 20260527 full-schema initial would fail against existing prod
  // tables). Instead, this `onInit` hook runs every cold boot and
  // CREATEs the new table + indexes + FK if they don't exist — an
  // idempotent, build-safe alternative to wiring `payload migrate`
  // into the deploy pipeline.
  //
  // Safe to run multiple times: every statement uses IF NOT EXISTS.
  // Costs are ~one cheap query per cold start; warm requests skip it.
  onInit: async (payload) => {
    try {
      await payload.db.drizzle.execute(sql`
        CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
          "id" serial PRIMARY KEY NOT NULL,
          "email" varchar NOT NULL,
          "source" varchar DEFAULT 'home-newsletter',
          "subscribed_at" timestamp(3) with time zone,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscribers_email_idx"
          ON "newsletter_subscribers" USING btree ("email");
        CREATE INDEX IF NOT EXISTS "newsletter_subscribers_updated_at_idx"
          ON "newsletter_subscribers" USING btree ("updated_at");
        CREATE INDEX IF NOT EXISTS "newsletter_subscribers_created_at_idx"
          ON "newsletter_subscribers" USING btree ("created_at");
        ALTER TABLE "payload_locked_documents_rels"
          ADD COLUMN IF NOT EXISTS "newsletter_subscribers_id" integer;
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'payload_locked_documents_rels_newsletter_subscribers_fk'
          ) THEN
            ALTER TABLE "payload_locked_documents_rels"
              ADD CONSTRAINT "payload_locked_documents_rels_newsletter_subscribers_fk"
              FOREIGN KEY ("newsletter_subscribers_id")
              REFERENCES "public"."newsletter_subscribers"("id")
              ON DELETE cascade ON UPDATE no action;
          END IF;
        END$$;
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_newsletter_subscribers_id_idx"
          ON "payload_locked_documents_rels" USING btree ("newsletter_subscribers_id");
      `)
      payload.logger.info('[newsletter] table bootstrap ok')
    } catch (err) {
      // Non-fatal: if the bootstrap can't run (e.g. read-only DB role,
      // permissions issue), the route will still return 500 cleanly on
      // signup and the rest of the admin keeps working.
      payload.logger.error({ err }, '[newsletter] onInit table bootstrap failed')
    }
  },
  email: resendAdapter({
    defaultFromAddress: 'no-reply@momhindia.org',
    defaultFromName: 'Museum of Meenakari Heritage',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  globals: [Header, Footer],
  plugins: [
    ...plugins,
    // Vercel Blob storage — production media uploads route here when
    // BLOB_READ_WRITE_TOKEN is present. In dev (token unset) the
    // adapter is `enabled: false` and Payload falls back to the Media
    // collection's `staticDir` (`public/media/`). Matches the SS
    // production config exactly so behaviour is identical across
    // both sites.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { media: { disablePayloadAccessControl: true } },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
      addRandomSuffix: false,
      cacheControlMaxAge: 365 * 24 * 60 * 60,
      // clientUploads: true would let the admin upload directly from
      // browser to Blob (bypassing Vercel function size limits), but
      // it requires UploadHandlersProvider in the admin React tree
      // which isn't wiring correctly in this Payload version —
      // throws "useUploadHandlers must be used within
      // UploadHandlersProvider" and blanks the admin. Falling back to
      // server-routed uploads (admin → /api/media → Blob) which works
      // for files under the 4.5 MB Vercel serverless body limit (more
      // than enough for our editorial JPEGs).
      clientUploads: false,
    }),
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})
