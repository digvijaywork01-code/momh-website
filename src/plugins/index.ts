import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { APIError, Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { Page, Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import {
  checkFormToken,
  emailDomain,
  isAllowedOrigin,
  isDisposableEmail,
  isHoneypotFilled,
} from '@/utilities/formGuards'
import { UPLOAD_KEY_RE } from '@/utilities/uploadRules'
import { isEmailTooLong } from '@/utilities/emailFormat'
import { FORM_FIELD_NAMES, FORM_IDS } from '@/utilities/formIds'
import { RANDOM_FIELDS_TO_REFUSE, randomLookingFields } from '@/utilities/randomText'
import { clientIp, withinRateLimit } from '@/utilities/rateLimit'
import { verifyRecaptcha } from '@/utilities/recaptcha'

// Free-text answers the random-letters check (step 6b) reads: names,
// places, occupation and the description boxes of both enquiry forms.
const RANDOM_CHECK_FIELDS: ReadonlySet<string> = new Set([
  'firstName',
  'lastName',
  'city',
  'country',
  'occupation',
  'hearAboutUs',
  'queriesComments',
  'designIdea',
  'additionalNotes',
])

// The consultation's upload fields, exactly as ConsultationForm sends them.
const UPLOAD_FIELDS = new Set(['referenceImage', 'referenceImageName', 'referenceImageNote'])

// The longest field name any form may send. The site's own are under 30
// characters; 200 leaves room for names typed into a CMS form.
const MAX_FIELD_NAME_LENGTH = 200

// Spam-protection checks (origin, honeypot, signed time pass, throwaway
// domains) live in src/utilities/formGuards.ts, shared with /api/newsletter
// and /api/email-forwarding. Same rules as the SS site.

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Website Template` : 'Payload Website Template'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    // The plugin's own email step runs BEFORE the spam hook below and would
    // send whatever emails a form record lists. MOMH's emails are sent by
    // /api/email-forwarding instead, after the submission has passed the
    // spam checks and been saved, so the plugin must never send any.
    beforeEmail: () => [],
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
    // Spam-protection hook — layered cheap checks before a submission
    // touches the DB. Mirrors the SS site's approach.
    formSubmissionOverrides: {
      // Admin only: an "Open file" button in the sidebar of a Personal
      // Consultation enquiry with an uploaded file. A 'ui' field stores
      // nothing, so it needs no database change.
      fields: ({ defaultFields }) => [
        ...defaultFields,
        {
          name: 'uploadedFile',
          type: 'ui',
          admin: {
            position: 'sidebar',
            // Not a list column: it stores nothing, so every row would read
            // "<No Uploaded File>" and the date column would be pushed out.
            disableListColumn: true,
            components: {
              Field: '@/components/admin/ConsultationFileLink#ConsultationFileLink',
            },
          },
        },
      ],
      hooks: {
        beforeChange: [
          async ({ data, req }) => {
            const submissionData: Array<{ field: string; value: unknown }> = Array.isArray(
              data?.submissionData,
            )
              ? data.submissionData
              : []
            // (0a) Every field name is text of at most MAX_FIELD_NAME_LENGTH
            // characters. Checked before anything else reads a name: step 0b
            // tidies each name (normalize), which slows down sharply on one
            // long run of accent marks, and one such name could hold up the
            // server for minutes.
            if (
              submissionData.some(
                (f) => typeof f.field !== 'string' || f.field.length > MAX_FIELD_NAME_LENGTH,
              )
            ) {
              req.payload.logger.warn({ msg: 'Form spam blocked: field name not text or too long' })
              throw new Error('Submission rejected.')
            }

            // (0) Every field name once. The site's forms never repeat one;
            // a repeat could slip a second value past the checks below,
            // which each read the first entry with that name.
            const names = submissionData.map((f) => String(f.field).trim().toLowerCase())
            if (new Set(names).size !== names.length) {
              req.payload.logger.warn({ msg: 'Form spam blocked: repeated field name' })
              throw new Error('Submission rejected.')
            }

            // (0b) Only the real upload fields may look like one (all forms;
            // the two hand-built forms are held to an exact list in 0c). The team
            // email trusts the 'Reference Image' label; a look-alike name
            // ('ReferenceImage', 'reference_image', 'Reference Image') could
            // put a sender's link under it.
            const squash = (n: string) =>
              n
                .normalize('NFKC')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '')
            if (
              submissionData.some(
                (f) =>
                  typeof f.field === 'string' &&
                  squash(f.field).startsWith('referenceimage') &&
                  !UPLOAD_FIELDS.has(f.field),
              )
            ) {
              req.payload.logger.warn({ msg: 'Form spam blocked: look-alike upload field' })
              throw new Error('Submission rejected.')
            }

            // (0c) The two hand-built forms save a fixed list of field names
            // (src/utilities/formIds.ts). Any other name is refused, so no
            // made-up or look-alike label (another alphabet, '1' for 'I')
            // can reach the team email, and the upload fields can only
            // come with a Personal Consultation enquiry.
            const formRef = data?.form as unknown
            const formId = Number(
              typeof formRef === 'object' && formRef !== null
                ? (formRef as { id?: unknown }).id
                : formRef,
            )
            const allowedNames = FORM_FIELD_NAMES[formId]
            if (allowedNames) {
              const allowed = new Set<string>([...allowedNames, '_hp', '_t', '_rc'])
              if (
                submissionData.some((f) => typeof f.field !== 'string' || !allowed.has(f.field))
              ) {
                req.payload.logger.warn({ msg: 'Form spam blocked: unexpected field name', formId })
                throw new Error('Submission rejected.')
              }
            }
            // The form sends the file's name as text of at most 200
            // characters. A list or object would slip past the length rule
            // and be saved as one long text.
            const fileName = submissionData.find((f) => f.field === 'referenceImageName')?.value
            if (
              fileName !== undefined &&
              fileName !== null &&
              (typeof fileName !== 'string' || fileName.length > 200)
            ) {
              req.payload.logger.warn({ msg: 'Form spam blocked: file name too long' })
              throw new Error('Submission rejected.')
            }

            const hp = submissionData.find((f) => f.field === '_hp')?.value
            const t = submissionData.find((f) => f.field === '_t')?.value
            const rc = submissionData.find((f) => f.field === '_rc')?.value

            const ip =
              req?.headers?.get?.('x-forwarded-for') ??
              (req as unknown as { ip?: string })?.ip ??
              'unknown'

            // (1) Origin / Referer header — reject anything not from our
            // own site. Forgeable, but catches direct-API bots that
            // don't bother spoofing.
            const origin = req?.headers?.get?.('origin') ?? ''
            const referer = req?.headers?.get?.('referer') ?? ''
            if (!isAllowedOrigin(origin, referer)) {
              req.payload.logger.warn({
                msg: 'Form spam blocked: origin',
                origin,
                referer,
                ip,
              })
              throw new Error('Submission rejected.')
            }

            // (1b) A cap per connection (src/utilities/rateLimit.ts) on
            // saved enquiries. It runs on this save's own database
            // connection, in a savepoint, so it never waits for a second
            // connection and a counter problem never spoils the save (it
            // fails open). A refused enquiry's count is rolled back with it.
            if (!(await withinRateLimit(req.payload, 'enquiry', req?.headers, req))) {
              req.payload.logger.warn({ msg: 'Form spam blocked: rate limit', ip })
              throw new APIError('Too many forms sent from this connection.', 429, null, true)
            }

            // (2) Honeypot — any non-empty value means a bot filled the trap.
            if (isHoneypotFilled(hp)) {
              req.payload.logger.warn({ msg: 'Form spam blocked: honeypot', ip })
              throw new Error('Submission rejected.')
            }

            // (3) HMAC-signed timestamp token (issued by /api/form-token).
            // Token format: `<timestamp>.<base64url-hmac>`. Valid when the
            // signature matches and the pass is 3 s to 30 min old.
            const token = checkFormToken(t)
            if (!token.ok) {
              req.payload.logger.warn({
                msg: `Form spam blocked: ${token.reason}`,
                ...(token.elapsed !== undefined ? { elapsed: token.elapsed } : {}),
                ip,
              })
              throw new Error('Submission rejected.')
            }

            // (3b) Google reCAPTCHA v3 (src/utilities/recaptcha.ts) on the two
            // enquiry forms: the token must be Google's, made for this form
            // on this site, with a score of at least RECAPTCHA_MIN_SCORE.
            // Skipped while the secret is not set; allowed (and logged) if
            // Google is down. (The generic CMS Form block, on no live page,
            // sends no token and is not held to it.)
            const captcha = allowedNames
              ? await verifyRecaptcha(
                  rc,
                  formId === FORM_IDS.consultation ? 'consultation' : 'appointment',
                  clientIp(req?.headers),
                )
              : ({ ok: true, outcome: 'skipped' } as const)
            if (!captcha.ok) {
              req.payload.logger.warn({
                msg: `Form spam blocked: recaptcha ${captcha.reason}`,
                ...(captcha.score !== undefined ? { score: captcha.score } : {}),
                formId,
                ip,
              })
              throw new Error('Submission rejected.')
            }
            if (captcha.outcome !== 'passed') {
              req.payload.logger.warn({ msg: `Form recaptcha ${captcha.outcome}`, formId })
            }

            // (4a) Every field whose name contains "email" (so only real
            // address boxes may use that word in their name), checked before
            // anything else reads it:
            //   - a list or object instead of text: a bot (the forms only
            //     send text), and it would slip past the length rule;
            //   - longer than any real address: over 254 characters, or over
            //     64 before the "@" (src/utilities/emailFormat.ts).
            const emailFields = submissionData.filter(
              (f) => typeof f.field === 'string' && f.field.toLowerCase().includes('email'),
            )
            if (emailFields.some((f) => typeof f.value === 'object' && f.value !== null)) {
              req.payload.logger.warn({ msg: 'Form spam blocked: email not text', ip })
              throw new Error('Submission rejected.')
            }
            if (emailFields.some((f) => typeof f.value === 'string' && isEmailTooLong(f.value))) {
              req.payload.logger.warn({ msg: 'Form spam blocked: email too long', ip })
              throw new Error('Submission rejected.')
            }

            // (4) Disposable / abused-email-domain blocklist.
            const emailEntry = submissionData.find(
              (f) => typeof f.field === 'string' && f.field.toLowerCase().includes('email'),
            )
            if (emailEntry?.value && typeof emailEntry.value === 'string') {
              if (isDisposableEmail(emailEntry.value)) {
                req.payload.logger.warn({
                  msg: 'Form spam blocked: disposable email',
                  domain: emailDomain(emailEntry.value),
                  ip,
                })
                throw new Error('Submission rejected.')
              }
            }

            // (5) Name fields containing digits — real names don't have digits.
            // Not the consultation's file name ('referenceImageName'): phone
            // photos are called IMG_4021.jpg and the like.
            const nameEntries = submissionData.filter((f) => {
              if (typeof f.field !== 'string') return false
              const n = f.field.toLowerCase()
              if (n.startsWith('referenceimage')) return false
              return (
                n.includes('first') ||
                n.includes('last') ||
                (n.includes('name') && !n.includes('user'))
              )
            })
            for (const entry of nameEntries) {
              if (typeof entry.value === 'string' && /\d/.test(entry.value)) {
                req.payload.logger.warn({
                  msg: 'Form spam blocked: digits in name',
                  field: entry.field,
                  ip,
                })
                throw new Error('Submission rejected.')
              }
            }

            // (6) Description boxes — reject if longer than 25 chars with
            // zero whitespace. Random-string spam payloads always fail this;
            // real customer enquiries always have spaces. Same rule as the
            // SS site, which covers every description box; here every
            // matching box is checked, not just the first:
            //   Book An Appointment: 'hearAboutUs', 'queriesComments'
            //   Personal Consultation: 'additionalNotes'
            // ('designIdea' is not matched: visitors paste a reference link
            // there, since the upload sends only the file name.)
            const descriptionEntries = submissionData.filter((f) => {
              if (typeof f.field !== 'string') return false
              const n = f.field.toLowerCase()
              return (
                n.includes('message') ||
                n.includes('details') ||
                n.includes('hear') ||
                n.includes('queries') ||
                n.includes('comments') ||
                n.includes('notes')
              )
            })
            for (const entry of descriptionEntries) {
              if (
                typeof entry.value === 'string' &&
                entry.value.length > 25 &&
                !/\s/.test(entry.value)
              ) {
                req.payload.logger.warn({
                  msg: 'Form spam blocked: message no-whitespace',
                  field: entry.field,
                  ip,
                })
                throw new Error('Submission rejected.')
              }
            }

            // (6b) Random letters: refused when RANDOM_FIELDS_TO_REFUSE (3) or
            // more answers look like random letters (src/utilities/randomText.ts),
            // as the Nov 2026 bots sent ("Zzdgamua Jaqkn", city "Pnpbxoo").
            // One odd-looking answer is never enough, so unusual real names
            // pass.
            const randomFields = randomLookingFields(submissionData, RANDOM_CHECK_FIELDS)
            if (randomFields.length >= RANDOM_FIELDS_TO_REFUSE) {
              req.payload.logger.warn({
                msg: 'Form spam blocked: random letters',
                fields: randomFields,
                ip,
              })
              throw new Error('Submission rejected.')
            }

            // (7) Consultation reference upload: a non-empty value must have
            // the shape of a key this site issues
            // (consultation-uploads/<yyyy>/<mm>/<uuid>.<ext>), never a link or
            // path chosen by the sender. Shape only: whether the file is
            // really there is checked by the email step (readUpload).
            const uploadEntry = submissionData.find((f) => f.field === 'referenceImage')
            if (
              uploadEntry?.value &&
              !(typeof uploadEntry.value === 'string' && UPLOAD_KEY_RE.test(uploadEntry.value))
            ) {
              req.payload.logger.warn({ msg: 'Form spam blocked: bad upload key', ip })
              throw new Error('Submission rejected.')
            }

            // Strip spam-protection markers (and any reCAPTCHA token) from
            // the stored submission so they never reach the admin view or
            // the emails.
            const STRIP = new Set(['_hp', '_t', '_rc', 'recaptchaToken', 'g-recaptcha-response'])
            data.submissionData = submissionData.filter((f) => !STRIP.has(f.field))
            return data
          },
        ],
      },
    },
  }),
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
  payloadCloudPlugin(),
]
