/**
 * The two emails a NEW newsletter subscriber triggers, as on the SS site:
 *   1. the team: "New subscription · Newsletter" to info@momhindia.org;
 *   2. the visitor: "Thank you for subscribing".
 *
 * /api/newsletter calls this inside next/server after(), so the visitor's
 * answer never waits for the emails. Only a new subscriber gets them (one
 * row per address): signing the same address up again sends nothing, so
 * nobody can fill someone else's inbox by repeating their address. Team
 * first, as for enquiries: near Resend's daily limit the last send goes to
 * the team rather than to the visitor's thank-you. With no RESEND_API_KEY
 * nothing is sent. Never throws.
 */

import {
  BRAND,
  FROM_ADDRESS,
  OWNER_EMAILS,
  TYPE,
  escapeHtml,
  getResend,
  renderFooter,
  renderHeader,
  sendOnce,
} from '@/utilities/momhEmail'

/** Same document shell as the enquiry emails. */
const emailPage = (
  title: string,
  eyebrow: string,
  inner: string,
) => `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0; padding:0; background:${BRAND.bg}; -webkit-font-smoothing:antialiased; -webkit-text-size-adjust:none;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${BRAND.bg}" style="background:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px; width:100%; background:${BRAND.card};">
          ${renderHeader(eyebrow)}
          ${inner}
          ${renderFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

/**
 * The visitor's thank-you. Kept general, so it fits both sign-up boxes: the
 * home page promises events, exhibitions and artists, Craft Your Jewellery
 * promises collections, news and launches.
 */
const visitorEmailHTML = () =>
  emailPage(
    'Thank you for subscribing',
    'Subscription Confirmed',
    `<tr>
            <td style="padding:0 48px 40px; font-family:${TYPE.sans}; font-size:16px; line-height:1.7; color:${BRAND.ink};">
              <p style="margin:0 0 18px;">Dear Guest,</p>
              <p style="margin:0 0 18px;">Thank you for joining the Museum of Meenakari Heritage newsletter. We look forward to keeping you up to date with news from the museum.</p>
              <p style="margin:0;">Should you wish to reach us in the meantime, our details are below.</p>
              <p style="margin:30px 0 0; font-family:${TYPE.serif}; font-style:italic; color:${BRAND.ink}; font-size:18px;">With warm regards,</p>
              <p style="margin:4px 0 0; font-family:${TYPE.serif}; color:${BRAND.ink}; font-size:18px;">The Museum of Meenakari Heritage</p>
            </td>
          </tr>`,
  )

/** The team notice: the address and when it signed up, in the enquiry email's table style. */
const teamEmailHTML = (email: string, savedAt?: string) => {
  const saved = savedAt ? Date.parse(savedAt) : NaN
  const when = new Date(Number.isFinite(saved) ? saved : Date.now()).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  return emailPage(
    'Newsletter Subscription',
    'New Subscription',
    `<tr>
            <td align="center" style="padding:0 48px 6px;">
              <div style="font-family:${TYPE.serif}; font-size:22px; line-height:1.3; letter-spacing:1px; color:${BRAND.ink};">Newsletter Subscription</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 48px 28px; font-family:${TYPE.sans}; font-size:12px; color:${BRAND.muted};">
              ${escapeHtml(when)} &nbsp;·&nbsp; IST
            </td>
          </tr>
          <tr>
            <td style="padding:0 48px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid ${BRAND.rule};">
                <tr>
                  <td valign="top" style="padding:14px 16px 14px 0; font-family:${TYPE.sans}; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${BRAND.red}; width:38%; vertical-align:top;">Email</td>
                  <td valign="top" style="padding:14px 0; font-family:${TYPE.sans}; font-size:15px; line-height:1.6; color:${BRAND.ink};">${escapeHtml(email)}</td>
                </tr>
              </table>
            </td>
          </tr>`,
  )
}

export const sendNewsletterEmails = async ({
  id,
  email,
  createdAt,
}: {
  /** The new newsletter-subscribers row; keys the emails so a retry never sends twice. */
  id: number | string
  email: string
  createdAt?: string
}): Promise<void> => {
  try {
    const resend = getResend()
    if (!resend) return

    for (const [i, ownerEmail] of OWNER_EMAILS.entries()) {
      const problem = await sendOnce(
        resend,
        {
          from: FROM_ADDRESS,
          to: ownerEmail,
          subject: 'New subscription · Newsletter',
          html: teamEmailHTML(email, createdAt),
        },
        `momh-newsletter-owner-${id}-${i}`,
      )
      if (problem) console.error(`momh newsletter: team email to ${ownerEmail} failed`, problem)
    }

    const problem = await sendOnce(
      resend,
      {
        from: FROM_ADDRESS,
        to: email,
        subject: 'Thank you for subscribing · Museum of Meenakari Heritage',
        html: visitorEmailHTML(),
      },
      `momh-newsletter-customer-${id}`,
    )
    if (problem) console.error('momh newsletter: thank-you email failed', problem)
  } catch (err) {
    console.error('momh newsletter: unexpected error while sending', err)
  }
}
