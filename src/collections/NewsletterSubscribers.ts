import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

/**
 * Newsletter Subscribers — captures email signups from the home-page
 * "Our Newsletter" widget (and any future newsletter blocks).
 *
 * The public site posts to `/api/newsletter` (a thin route that wraps
 * Payload's local API). That route is what actually creates docs here,
 * so the only "public" access this collection needs is `create`
 * (admin/list/update/delete remain authenticated-only).
 *
 * Drafts are intentionally off — every signup is a finalised record;
 * there's no editor workflow to gate.
 *
 * Email uniqueness is enforced at the DB level. The route catches the
 * resulting duplicate-key error and returns success anyway, so a
 * returning subscriber gets the same friendly UX without exposing
 * whether their address is already in the list.
 */
export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletter-subscribers',
  access: {
    create: anyone,
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
  },
}
