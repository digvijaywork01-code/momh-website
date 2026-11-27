import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Payload 3.48.0 -> 3.94.2 (Next 16.4.6). Trimmed by hand from `payload migrate:create upgrade_394`.
//
// The snapshot chain is complete: a restore of the production schema matches
// 20261021_131045_review_carousel_block.json exactly, and that file matches the 3.48.0 config, so
// migrate:create emitted the real delta (no stale-snapshot DROP TABLE list). Kept from its output:
//   - payload_kv table + unique index on "key": Payload's built-in key-value store (payload-kv).
//   - users.reset_password_requested_at: 3.94.2 selects it whenever it reads users. Without it the
//     admin and /api/users/init fail with 'column users.reset_password_requested_at does not exist'.
// Added by hand:
//   - media._objectkey: the hidden _objectKey field that @payloadcms/plugin-cloud-storage 3.94.2 adds
//     whenever the Vercel Blob adapter is on. Production runs with the Blob adapter on and local
//     runs do not, so migrate:create could not see it; in production every media read selects it.
// Left out on purpose (3.94.2 does not need them at runtime, and they are not additive):
//   - drop + re-create of 6 foreign keys and 6 indexes on pages_blocks_two_column_feature and
//     _pages_v_blocks_two_column_feature. 3.94.2 generates shorter names for them (the FKs get a hash
//     suffix); only the names differ (same columns, targets and ON DELETE).
//   - drop of payload_locked_documents_rels.payload_jobs_id with its FK and index. 3.94.2 no longer
//     uses it, 3.48.0 still selects it (a code rollback needs it), and it is nullable.
// The .json next to this file is migrate:create's snapshot of the 3.94.2 config, unedited. It does not
// know the left-out differences or media._objectkey, so check by hand any later generated migration
// that touches those 12 objects or adds the Blob storage fields.
//
// Additive and idempotent (IF NOT EXISTS): 3.48.0 keeps working on the migrated database and a re-run
// is harmless. The two ALTERs take a brief ACCESS EXCLUSIVE lock on users and media; lock_timeout makes
// the migration (and so the build) fail with nothing changed if live queries hold those tables for more
// than 10 s, instead of queueing every request behind it.
//
// Once a build has recorded this migration in payload_migrations, never edit this file: later edits
// never run there. Put further schema changes in a new migration file.
//
// A code rollback to 3.48.0 does not need down(). DANGER: if client uploads are ever turned on,
// media._objectkey records where uploaded files live in the Blob store; never run down() after that.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    SET LOCAL lock_timeout = '10s';
    CREATE TABLE IF NOT EXISTS "payload_kv" (
      "id" serial PRIMARY KEY NOT NULL,
      "key" varchar NOT NULL,
      "data" jsonb NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_requested_at" timestamp(3) with time zone;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;
  `)
}

// See the DANGER note above before ever running this.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    SET LOCAL lock_timeout = '10s';
    ALTER TABLE "media" DROP COLUMN IF EXISTS "_objectkey";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_requested_at";
    DROP TABLE IF EXISTS "payload_kv";
  `)
}
