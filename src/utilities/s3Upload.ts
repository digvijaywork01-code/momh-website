/**
 * S3 storage for the Personal Consultation reference upload. SERVER ONLY.
 *
 * The browser never holds AWS keys. /api/consultation-upload asks this file
 * for a short-lived presigned POST (a URL plus form fields) that lets the
 * browser upload ONE file of an accepted type and at most MAX_UPLOAD_BYTES
 * straight to S3, under a random key this server chose. The bucket stays
 * private and keeps the file. The team gets it in the enquiry email: the
 * email step reads it back (readUpload) and attaches it, plus a presigned
 * GET link that works for 7 days.
 *
 * Env (set on Vercel by the site owner). With any of the first four
 * missing, uploads are switched off and the form saves enquiries without
 * the file:
 *   S3_UPLOAD_BUCKET             the bucket name
 *   S3_UPLOAD_REGION             e.g. ap-south-1
 *   S3_UPLOAD_ACCESS_KEY_ID      an IAM key allowed s3:PutObject and
 *   S3_UPLOAD_SECRET_ACCESS_KEY  s3:GetObject on <bucket>/consultation-uploads/*
 *   S3_UPLOAD_ENDPOINT           optional, only for an S3-compatible test
 *                                server on a developer machine
 * (Not AWS_*: Vercel reserves those names.)
 *
 * The bucket also needs a CORS rule, because the visitor's browser posts
 * the file to S3 directly: AllowedOrigins https://momhindia.org and
 * https://www.momhindia.org, AllowedMethods POST, AllowedHeaders *.
 * Without it S3 still stores the file but the browser cannot read S3's
 * answer; the email step then checks the file itself (readUpload), so
 * the team is told correctly either way. Preview sites (*.vercel.app) are
 * not in that rule, so uploads made from a preview are not confirmed.
 */

import crypto from 'node:crypto'
import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_KEY_RE,
  UPLOAD_PREFIX,
  UPLOAD_TYPES,
  isUploadType,
} from './uploadRules'

/** How long an upload link works: long enough for a slow phone upload. */
const UPLOAD_LINK_SECONDS = 5 * 60
/** How long the view link in the team's email works (SigV4's maximum). */
export const VIEW_LINK_SECONDS = 7 * 24 * 60 * 60

const config = () => {
  const bucket = process.env.S3_UPLOAD_BUCKET || ''
  const region = process.env.S3_UPLOAD_REGION || ''
  const accessKeyId = process.env.S3_UPLOAD_ACCESS_KEY_ID || ''
  const secretAccessKey = process.env.S3_UPLOAD_SECRET_ACCESS_KEY || ''
  const endpoint = process.env.S3_UPLOAD_ENDPOINT || ''
  return { bucket, region, accessKeyId, secretAccessKey, endpoint }
}

export const isUploadConfigured = (): boolean => {
  const c = config()
  return Boolean(c.bucket && c.region && c.accessKeyId && c.secretAccessKey)
}

let _client: S3Client | null = null
let _clientFor = ''
const client = (): S3Client => {
  const c = config()
  const signature = `${c.region}|${c.accessKeyId}|${c.endpoint}`
  if (!_client || _clientFor !== signature) {
    _client = new S3Client({
      region: c.region,
      credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey },
      ...(c.endpoint ? { endpoint: c.endpoint, forcePathStyle: true } : {}),
    })
    _clientFor = signature
  }
  return _client
}

/** A fresh random key for an accepted content type. */
export const newUploadKey = (contentType: string): string => {
  if (!isUploadType(contentType)) throw new Error('unsupported content type')
  const now = new Date()
  const yyyy = String(now.getUTCFullYear())
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const key = `${UPLOAD_PREFIX}/${yyyy}/${mm}/${crypto.randomUUID()}.${UPLOAD_TYPES[contentType]}`
  // Never sign a key the enquiry check and the view link would refuse.
  if (!UPLOAD_KEY_RE.test(key)) throw new Error('bad upload key')
  return key
}

/**
 * Presigned POST for one upload: S3 itself refuses a different key, a
 * different Content-Type, an empty file or one over MAX_UPLOAD_BYTES.
 */
export const createUploadLink = async (
  key: string,
  contentType: string,
): Promise<{ url: string; fields: Record<string, string> }> => {
  const { bucket } = config()
  return createPresignedPost(client(), {
    Bucket: bucket,
    Key: key,
    Fields: { 'Content-Type': contentType },
    Conditions: [
      ['content-length-range', 1, MAX_UPLOAD_BYTES],
      ['eq', '$Content-Type', contentType],
    ],
    Expires: UPLOAD_LINK_SECONDS,
  })
}

/**
 * A link to view a stored file, or null for a key that is not ours (or
 * when S3 is not set up). 7 days by default (the team email); the admin's
 * Open file link asks for a few minutes. With `fileName`, the browser
 * shows / saves the file under that name instead of the random key.
 */
export const createViewLink = async (
  key: string,
  { expiresIn = VIEW_LINK_SECONDS, fileName }: { expiresIn?: number; fileName?: string } = {},
): Promise<string | null> => {
  if (!UPLOAD_KEY_RE.test(key) || !isUploadConfigured()) return null
  const { bucket } = config()
  // RFC 6266: a plain-ASCII fallback plus the exact UTF-8 name.
  const disposition = fileName
    ? `inline; filename="${fileName.replace(/[^\x20-\x7e]|["\\]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
    : undefined
  return getSignedUrl(
    client(),
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      // Every link is new, so a saved copy is never reused; this keeps the
      // visitor's file out of the browser's disk cache (and so off a shared
      // computer once the link has expired).
      ResponseCacheControl: 'private, no-store',
      ...(disposition ? { ResponseContentDisposition: disposition } : {}),
    }),
    { expiresIn },
  )
}

/**
 * Whether a stored file is in the bucket (HeadObject, covered by
 * s3:GetObject). false for 404 and 403 (what S3 answers for a missing key
 * when the IAM key has no s3:ListBucket; logged, since a 403 can also be a
 * missing permission). Throws on anything else.
 */
export const uploadExists = async (key: string): Promise<boolean> => {
  if (!UPLOAD_KEY_RE.test(key) || !isUploadConfigured()) return false
  const { bucket } = config()
  try {
    await client().send(new HeadObjectCommand({ Bucket: bucket, Key: key }), {
      abortSignal: AbortSignal.timeout(10_000),
    })
    return true
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode
    if (status === 404 || status === 403) {
      console.warn('momh s3: stored file not found', {
        key,
        status,
        name: (err as { name?: string })?.name,
      })
      return false
    }
    throw err
  }
}

/** Longest wait for reading a stored file back for the team email. */
const READ_TIMEOUT_MS = 20_000

/**
 * A stored file's bytes and type, read back to attach it to the team
 * email (s3:GetObject). null when S3 says it is not there: 404, or 403,
 * which is what S3 answers for a missing key when the IAM key has no
 * s3:ListBucket. A 403 cannot tell that apart from a key that lacks
 * s3:GetObject (or kms:Decrypt), so every null is logged: a settings
 * mistake then shows in the Vercel logs. Throws on anything else
 * (network, the time limit, a file larger than MAX_UPLOAD_BYTES).
 */
export const readUpload = async (
  key: string,
): Promise<{ bytes: Buffer; contentType: string } | null> => {
  if (!UPLOAD_KEY_RE.test(key) || !isUploadConfigured()) return null
  const { bucket } = config()
  const abortSignal = AbortSignal.timeout(READ_TIMEOUT_MS)
  let res
  try {
    res = await client().send(new GetObjectCommand({ Bucket: bucket, Key: key }), { abortSignal })
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode
    if (status === 404 || status === 403) {
      console.warn('momh s3: stored file not readable', {
        key,
        status,
        name: (err as { name?: string })?.name,
      })
      return null
    }
    throw err
  }
  const body = res.Body
  if (!body) throw new Error('stored file has no body')
  if (typeof res.ContentLength === 'number' && res.ContentLength > MAX_UPLOAD_BYTES) {
    ;(body as { destroy?: () => void }).destroy?.()
    throw new Error('stored file is larger than the upload limit')
  }
  const bytes = Buffer.from(await body.transformToByteArray())
  if (bytes.length > MAX_UPLOAD_BYTES)
    throw new Error('stored file is larger than the upload limit')
  return { bytes, contentType: res.ContentType ?? '' }
}
