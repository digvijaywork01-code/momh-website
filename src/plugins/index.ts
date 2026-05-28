import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { Plugin } from 'payload'
import disposableDomains from 'disposable-email-domains'
import crypto from 'node:crypto'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { Page, Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

// ── Spam-protection helpers (used by formSubmissionOverrides hook) ─────
// Same approach as the SS site: layered cheap checks at the
// /api/form-submissions endpoint so the simplest bot traffic never
// reaches the DB or the email pipeline.

// Built once at module load — Set lookup is O(1) vs array .includes()
// over ~121k domains.
const DISPOSABLE_DOMAINS = new Set<string>(disposableDomains as string[])

// Origin allowlist — kept in sync with the same constants in
// app/(payload)/api/email-forwarding/route.ts.
const ALLOWED_ORIGINS = [
  'https://momhindia.org',
  'https://www.momhindia.org',
] as const
const VERCEL_PREVIEW_RE = /^https:\/\/[a-z0-9-]+\.vercel\.app$/
const LOCALHOST_RE = /^http:\/\/localhost(:\d+)?$/

const safeUrlOrigin = (input: string): string => {
  try {
    return input ? new URL(input).origin : ''
  } catch {
    return ''
  }
}

const isAllowedOrigin = (origin: string, referer: string): boolean => {
  const refererOrigin = safeUrlOrigin(referer)
  for (const candidate of [origin, refererOrigin]) {
    if (!candidate) continue
    if ((ALLOWED_ORIGINS as readonly string[]).includes(candidate)) return true
    if (VERCEL_PREVIEW_RE.test(candidate)) return true
    if (LOCALHOST_RE.test(candidate)) return true
  }
  return false
}

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
      hooks: {
        beforeChange: [
          ({ data, req }) => {
            const submissionData: Array<{ field: string; value: unknown }> =
              Array.isArray(data?.submissionData) ? data.submissionData : []
            const hp = submissionData.find((f) => f.field === '_hp')?.value
            const t = submissionData.find((f) => f.field === '_t')?.value

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

            // (2) Honeypot — any non-empty value means a bot filled the trap.
            if (hp && String(hp).length > 0) {
              req.payload.logger.warn({ msg: 'Form spam blocked: honeypot', ip })
              throw new Error('Submission rejected.')
            }

            // (3) HMAC-signed timestamp token (issued by /api/form-token).
            // Token format: `<timestamp>.<base64url-hmac>`. Server verifies
            // the signature + that the elapsed time falls in [3s, 30 min].
            const SECRET = process.env.PAYLOAD_SECRET || ''
            const tokenStr = String(t ?? '')
            const dotIdx = tokenStr.indexOf('.')
            if (!SECRET || dotIdx < 0) {
              req.payload.logger.warn({ msg: 'Form spam blocked: token shape', ip })
              throw new Error('Submission rejected.')
            }
            const tsPart = tokenStr.slice(0, dotIdx)
            const sigPart = tokenStr.slice(dotIdx + 1)
            const expectedSig = crypto
              .createHmac('sha256', SECRET)
              .update(tsPart)
              .digest('base64url')
            const sigBuf = Buffer.from(sigPart)
            const expectedBuf = Buffer.from(expectedSig)
            if (
              sigBuf.length !== expectedBuf.length ||
              !crypto.timingSafeEqual(sigBuf, expectedBuf)
            ) {
              req.payload.logger.warn({
                msg: 'Form spam blocked: token signature',
                ip,
              })
              throw new Error('Submission rejected.')
            }
            const renderedAt = Number(tsPart)
            const elapsed = Date.now() - renderedAt
            const TOKEN_MIN_MS = 3_000
            const TOKEN_MAX_MS = 30 * 60 * 1000
            if (
              !Number.isFinite(renderedAt) ||
              renderedAt <= 0 ||
              elapsed < TOKEN_MIN_MS ||
              elapsed > TOKEN_MAX_MS
            ) {
              req.payload.logger.warn({
                msg: 'Form spam blocked: token age',
                elapsed: Number.isFinite(elapsed) ? elapsed : null,
                ip,
              })
              throw new Error('Submission rejected.')
            }

            // (4) Disposable / abused-email-domain blocklist.
            const emailEntry = submissionData.find(
              (f) =>
                typeof f.field === 'string' &&
                f.field.toLowerCase().includes('email'),
            )
            if (
              emailEntry?.value &&
              typeof emailEntry.value === 'string'
            ) {
              const domain = emailEntry.value
                .split('@')[1]
                ?.toLowerCase()
                .trim()
              if (domain && DISPOSABLE_DOMAINS.has(domain)) {
                req.payload.logger.warn({
                  msg: 'Form spam blocked: disposable email',
                  domain,
                  ip,
                })
                throw new Error('Submission rejected.')
              }
            }

            // (5) Name fields containing digits — real names don't have digits.
            const nameEntries = submissionData.filter((f) => {
              if (typeof f.field !== 'string') return false
              const n = f.field.toLowerCase()
              return (
                n.includes('first') ||
                n.includes('last') ||
                (n.includes('name') && !n.includes('user'))
              )
            })
            for (const entry of nameEntries) {
              if (
                typeof entry.value === 'string' &&
                /\d/.test(entry.value)
              ) {
                req.payload.logger.warn({
                  msg: 'Form spam blocked: digits in name',
                  field: entry.field,
                  ip,
                })
                throw new Error('Submission rejected.')
              }
            }

            // (6) Message field — reject if longer than 25 chars with zero
            // whitespace. Random-string spam payloads always fail this;
            // real customer enquiries always have spaces.
            const messageEntry = submissionData.find((f) => {
              if (typeof f.field !== 'string') return false
              const n = f.field.toLowerCase()
              return n.includes('message') || n.includes('details') || n.includes('queries') || n.includes('comments')
            })
            if (
              messageEntry?.value &&
              typeof messageEntry.value === 'string' &&
              messageEntry.value.length > 25 &&
              !/\s/.test(messageEntry.value)
            ) {
              req.payload.logger.warn({
                msg: 'Form spam blocked: message no-whitespace',
                ip,
              })
              throw new Error('Submission rejected.')
            }

            // Strip spam-protection markers from the stored submission
            // so they don't pollute the admin's submission view.
            data.submissionData = submissionData.filter(
              (f) => f.field !== '_hp' && f.field !== '_t',
            )
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
