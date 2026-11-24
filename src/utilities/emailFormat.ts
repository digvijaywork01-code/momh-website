/**
 * Email shape check shared by the browser and the server.
 *
 * Safe to import from client components (no secrets, no big lists).
 *
 * An address passes only if it is no longer than the email standard allows
 * (isEmailTooLong, checked first, so a huge value never reaches the
 * patterns, which slow down on very long text) and matches BOTH:
 *   - SIMPLE_EMAIL_RE: something@something.something, no spaces
 *     (the rule /api/newsletter has always used);
 *   - PAYLOAD_EMAIL_RE: Payload 3.48's own `email` field rule
 *     (node_modules/payload/dist/fields/validations.js), so an address the
 *     form accepts is never refused later by the database layer. It rejects
 *     '..', a dot at either end of the name part, and endings shorter
 *     than 2 letters (name@gmail.c).
 */

const SIMPLE_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PAYLOAD_EMAIL_RE =
  /^(?!.*\.\.)[\w!#$%&'*+/=?^`{|}~-](?:[\w!#$%&'*+/=?^`{|}~.-]*[\w!#$%&'*+/=?^`{|}~-])?@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i

/**
 * The longest address the site accepts: 254 characters in all and 64 before
 * the "@" (the limits in the email standard, RFC 5321). No real mailbox is
 * longer. The browser's own email check sets no overall limit.
 *
 * Counted as given, spaces included: the browser already sends an email box
 * trimmed, and a caller that stores a trimmed address trims before asking.
 * So a bot cannot pad an address with spaces past the limit.
 */
export const MAX_EMAIL_LENGTH = 254
export const MAX_EMAIL_LOCAL_LENGTH = 64

export const isEmailTooLong = (email: string): boolean => {
  if (email.length > MAX_EMAIL_LENGTH) return true
  // The domain can never contain an "@", so the name part is everything
  // before the last one (the whole value if there is none).
  const at = email.lastIndexOf('@')
  const name = at < 0 ? email : email.slice(0, at)
  return name.length > MAX_EMAIL_LOCAL_LENGTH
}

export const isValidEmail = (email: string): boolean =>
  !isEmailTooLong(email) && SIMPLE_EMAIL_RE.test(email) && PAYLOAD_EMAIL_RE.test(email)
