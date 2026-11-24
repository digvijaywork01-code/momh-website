import React from 'react'

import { cn } from '@/utilities/ui'
import { RECAPTCHA_SITE_KEY } from '@/utilities/recaptchaClient'

/**
 * The line Google asks for when its reCAPTCHA badge is hidden (the forms
 * hide it, see src/utilities/recaptchaClient.ts). Renders nothing until
 * reCAPTCHA is set up (NEXT_PUBLIC_RECAPTCHA_SITE_KEY). Size and colour
 * come from the form via className.
 */
export const RecaptchaNotice: React.FC<{ className?: string }> = ({ className }) => {
  if (!RECAPTCHA_SITE_KEY) return null
  return (
    <p className={cn('font-body text-xs', className)}>
      This site is protected by reCAPTCHA and the Google{' '}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Privacy Policy
      </a>{' '}
      and{' '}
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Terms of Service
      </a>{' '}
      apply.
    </p>
  )
}
