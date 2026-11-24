/**
 * Twenty CRM sync for the newsletter (server-side only).
 *
 * Same as the SS site (utils/twentyCrm.ts there): every newsletter sign-up
 * marks the person's `newsletterStatus` SELECT field as SUBSCRIBED in the
 * self-hosted Twenty CRM, creating the person with their email only if they
 * are not in the CRM yet.
 *
 * Best-effort by design: a CRM outage must never break a sign-up, so nothing
 * here throws. Callers get a result object for logging. The whole sync (the
 * lookup plus the update or create) gives up after SYNC_TIMEOUT_MS, so a slow
 * CRM delays a visitor's sign-up by at most that long.
 *
 * No retry, as on SS: a sign-up made while the CRM is down or refusing the
 * key is logged ('Twenty CRM newsletter sync failed') and stays only in
 * Newsletter Subscribers, which remains the full record. It reaches the CRM
 * the next time that person signs up.
 *
 * Required env (set on Vercel by the site owner; with either missing, every
 * call is skipped and logged, which is the case on developer machines):
 *   TWENTY_BASE_URL – the CRM's address, e.g. "https://crm.example.com"
 *   TWENTY_API_KEY  – Twenty API key (Bearer)
 */

export type NewsletterCrmStatus = 'SUBSCRIBED' | 'UNSUBSCRIBED'

export type CrmSyncResult =
  | { ok: true; action: 'updated' | 'created' | 'skipped_internal' | 'not_found' }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped: false; status: number; detail: string }

const SYNC_TIMEOUT_MS = 5_000

const getConfig = () => {
  const baseUrl = process.env.TWENTY_BASE_URL?.replace(/\/$/, '')
  const apiKey = process.env.TWENTY_API_KEY
  return { baseUrl, apiKey }
}

/** Staff/test addresses that should never become CRM people via the website form. */
const INTERNAL_DOMAINS = ['@momhindia.org', '@sunitashekhawat.com']
const isInternal = (email: string) => INTERNAL_DOMAINS.some((d) => email.endsWith(d))

export async function setNewsletterStatusInCRM(
  email: string,
  status: NewsletterCrmStatus,
  options: { createIfMissing?: boolean } = {},
): Promise<CrmSyncResult> {
  const { baseUrl, apiKey } = getConfig()
  if (!baseUrl || !apiKey) {
    return { ok: false, skipped: true, reason: 'Twenty CRM env not configured' }
  }

  const normalized = email.trim().toLowerCase()
  if (!normalized || !normalized.includes('@')) {
    return { ok: false, skipped: true, reason: 'invalid email' }
  }
  if (isInternal(normalized)) {
    return { ok: true, action: 'skipped_internal' }
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
  // One deadline for the whole sync, shared by every request (and by reading
  // their replies), so the steps cannot add up to more than SYNC_TIMEOUT_MS.
  const signal = AbortSignal.timeout(SYNC_TIMEOUT_MS)
  const request = (url: string, init: RequestInit = {}) => fetch(url, { ...init, headers, signal })

  try {
    // Find the person by primary email. The whole filter expression must be
    // URL-encoded (encodeURIComponent): partially-encoded filters return 400.
    const filter = encodeURIComponent(`emails.primaryEmail[eq]:${normalized}`)
    const findRes = await request(`${baseUrl}/rest/people?filter=${filter}&limit=1`)
    if (!findRes.ok) {
      return { ok: false, skipped: false, status: findRes.status, detail: 'person lookup failed' }
    }
    const found = (await findRes.json()) as {
      data?: { people?: Array<{ id: string }> }
    }
    const personId = found.data?.people?.[0]?.id

    if (personId) {
      const patch = await request(`${baseUrl}/rest/people/${encodeURIComponent(personId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ newsletterStatus: status }),
      })
      if (!patch.ok) {
        return { ok: false, skipped: false, status: patch.status, detail: 'person update failed' }
      }
      return { ok: true, action: 'updated' }
    }

    if (!options.createIfMissing) {
      return { ok: true, action: 'not_found' }
    }

    // Create with email only: all other fields stay empty by policy.
    const create = await request(`${baseUrl}/rest/people`, {
      method: 'POST',
      body: JSON.stringify({
        emails: { primaryEmail: normalized },
        newsletterStatus: status,
      }),
    })
    if (!create.ok) {
      return { ok: false, skipped: false, status: create.status, detail: 'person create failed' }
    }
    return { ok: true, action: 'created' }
  } catch (err) {
    // Network failure, timeout or an unreadable reply: report, never throw.
    return {
      ok: false,
      skipped: false,
      status: 0,
      detail: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    }
  }
}

type Logger = {
  info: (obj: Record<string, unknown>) => void
  warn: (obj: Record<string, unknown>) => void
  error: (obj: Record<string, unknown>) => void
}

/**
 * Mirror one newsletter sign-up into the CRM (SUBSCRIBED; the person is
 * created email-only if missing) and log the outcome, exactly as the SS
 * site's form-submissions afterChange hook does. Never throws.
 */
export async function syncNewsletterSignupToCRM(email: string, logger: Logger): Promise<void> {
  try {
    const crm = await setNewsletterStatusInCRM(email, 'SUBSCRIBED', { createIfMissing: true })
    if (crm.ok) {
      logger.info({ msg: 'Twenty CRM newsletter sync ok', action: crm.action })
    } else if (crm.skipped) {
      logger.warn({ msg: 'Twenty CRM newsletter sync skipped', reason: crm.reason })
    } else {
      logger.error({
        msg: 'Twenty CRM newsletter sync failed',
        status: crm.status,
        detail: crm.detail,
      })
    }
  } catch (err) {
    logger.error({
      msg: 'Twenty CRM newsletter sync threw',
      err: err instanceof Error ? err.message : String(err),
    })
  }
}
