import type { CollectionConfig } from 'payload'

/**
 * Form Attempts: one row per send to the public forms, used only to limit
 * how often one connection can send (src/utilities/rateLimit.ts).
 *
 * `key` is a keyed hash of the form kind and the sender's IP address, so
 * no IP address is stored. Rows older than two days are deleted as new
 * ones arrive. Nobody reads or edits these through the API or the admin:
 * every access rule is false and the collection is hidden; the server uses
 * the Local API with overrideAccess.
 */
export const FormAttempts: CollectionConfig = {
  slug: 'form-attempts',
  access: {
    create: () => false,
    read: () => false,
    update: () => false,
    delete: () => false,
  },
  admin: {
    hidden: true,
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      required: true,
      index: true,
    },
  ],
  timestamps: true,
}
