import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { syncNewsletterSignupToCRM } from '../utilities/twentyCrm'

/**
 * Newsletter Subscribers — captures email signups from the home-page
 * "Our Newsletter" widget (and any future newsletter blocks).
 *
 * The public site posts to `/api/newsletter`, which runs the spam checks
 * (origin, hidden trap box, signed time pass, throwaway domains) and then
 * creates the doc here through Payload's local API with overrideAccess.
 * So the collection itself needs no public access at all: create is
 * staff-only, which stops anyone adding addresses through the raw
 * `/api/newsletter-subscribers` REST/GraphQL endpoints and skipping those
 * checks (same pattern as the SS site's Unsubscribes collection).
 *
 * Drafts are intentionally off — every signup is a finalised record;
 * there's no editor workflow to gate.
 *
 * Email uniqueness is enforced at the DB level. The route checks for an
 * existing address first (and again if a save races another one) and
 * answers a returning subscriber exactly like a new one, so the list
 * never reveals who is on it.
 */
export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletter-subscribers',
  access: {
    // Closed for good (not a stop-gap): public sign-ups go through
    // /api/newsletter, which runs the spam checks and saves through the
    // Local API. Nobody can post straight to /api/newsletter-subscribers.
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'source', 'subscribedAt'],
    description:
      'Email signups from the public site’s newsletter widget. Latest at the top.',
    group: 'Submissions',
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },
    {
      // Free-text label so we can later add other entry points
      // (footer widget, dedicated newsletter page, campaign-specific
      // forms) without a schema migration. The home-page widget posts
      // "home-newsletter"; the route sets this if missing.
      name: 'source',
      type: 'text',
      defaultValue: 'home-newsletter',
      admin: {
        description:
          'Which widget / page this signup came from. Useful for attribution later.',
      },
    },
    {
      // Stored explicitly (instead of relying on `createdAt`) so future
      // backfills / imports from another tool keep a stable signup date
      // independent of when the doc was inserted into Payload.
      name: 'subscribedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && !data.subscribedAt) {
          data.subscribedAt = new Date().toISOString()
        }
        // Lowercase the email so "ALICE@EX.com" and "alice@ex.com"
        // collide on the unique index — prevents two effectively
        // identical rows for the same person.
        if (typeof data.email === 'string') {
          data.email = data.email.trim().toLowerCase()
        }
        return data
      },
    ],
    afterChange: [
      // Mirror every new subscriber into the Twenty CRM (newsletterStatus =
      // SUBSCRIBED; person created email-only if missing), as the SS site
      // does for its newsletter. This collection stays the source of record.
      // Best-effort: a CRM outage never fails the saved sign-up.
      async ({ doc, req, operation }) => {
        if (operation !== 'create') return
        if (typeof doc?.email !== 'string' || !doc.email.includes('@')) return
        await syncNewsletterSignupToCRM(doc.email, req.payload.logger)
      },
    ],
  },
}
