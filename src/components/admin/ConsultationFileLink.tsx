'use client'

/**
 * Admin, Form Submissions: the uploaded reference file of a Personal
 * Consultation enquiry, in the sidebar, only when the enquiry stored one:
 *  - an "Open file" button (opens it in a new tab), and
 *  - a preview of the photo for JPG, PNG and WEBP. HEIC and PDF files have
 *    no preview (Chrome cannot show them inline); the button opens them.
 *
 * Both go to /api/consultation-upload/view, which checks the admin login
 * and sends the browser to the file through a fresh 5-minute link. So the
 * button and the preview always work, for as long as the file is kept in
 * the bucket. The photo is shown whole (fitted, never cropped).
 */

import React, { useEffect, useRef, useState } from 'react'
import { Button, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { FORM_IDS } from '@/utilities/formIds'
import { UPLOAD_KEY_RE, safeFileName } from '@/utilities/uploadRules'

const ROW_FIELD = /^submissionData\.(\d+)\.field$/

/** Stored types a browser can show as an image. */
const PREVIEW_EXTENSIONS = new Set(['jpg', 'png', 'webp'])

export const ConsultationFileLink: React.FC = () => {
  const { id } = useDocumentInfo()
  const [previewFailed, setPreviewFailed] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)
  // A string ('<ext>|<name>'), not an object, so this only re-renders when
  // it changes. safeFileName never keeps a '|'.
  const found = useFormFields(([fields]) => {
    // Same rules as the route: a Personal Consultation enquiry with a
    // stored key of the right shape.
    const form = fields.form?.value
    const formId = typeof form === 'object' && form !== null ? (form as { id?: unknown }).id : form
    if (Number(formId) !== FORM_IDS.consultation) return ''
    let key = ''
    let name = ''
    for (const [path, state] of Object.entries(fields)) {
      const match = ROW_FIELD.exec(path)
      if (!match) continue
      const value = fields[`submissionData.${match[1]}.value`]?.value
      if (typeof value !== 'string') continue
      if (state?.value === 'referenceImage') key = value
      if (state?.value === 'referenceImageName') name = value
    }
    if (!key || !UPLOAD_KEY_RE.test(key)) return ''
    const ext = key.slice(key.lastIndexOf('.') + 1)
    // The cleaned, length-capped name the opened file also gets.
    return `${ext}|${name ? safeFileName(name, key) : 'file'}`
  })

  // The photo can fail (file not in storage) before React has attached
  // onError, and that error is not replayed. Check once after mounting.
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth === 0) setPreviewFailed(true)
  }, [found])

  if (!id || !found) return null

  const split = found.indexOf('|')
  const ext = found.slice(0, split)
  const label = found.slice(split + 1)
  const href = `/api/consultation-upload/view?submission=${encodeURIComponent(String(id))}`

  return (
    <div className="field-type" style={{ marginBottom: 'calc(var(--base) * 1.5)' }}>
      <label className="field-label">Uploaded file</label>
      <Button el="anchor" url={href} newTab buttonStyle="secondary" size="small">
        <span style={{ overflowWrap: 'anywhere' }}>Open {label}</span>
      </Button>

      {PREVIEW_EXTENSIONS.has(ext) && !previewFailed ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', marginTop: 'var(--base)' }}
          aria-label={`Open ${label}`}
        >
          {/* A plain <img>: the address checks the admin login and redirects
              to a short-lived S3 link, which next/image cannot handle. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={href}
            alt={`Uploaded file: ${label}`}
            // Phones: the sidebar sits far down the page, so only fetch the
            // photo once it is scrolled near.
            loading="lazy"
            decoding="async"
            onError={() => setPreviewFailed(true)}
            style={{
              display: 'block',
              width: 'auto',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: '360px',
              objectFit: 'contain',
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: 'var(--style-radius-s)',
              background: 'var(--theme-elevation-50)',
            }}
          />
        </a>
      ) : (
        <div className="field-description" style={{ marginTop: 'calc(var(--base) / 2)' }}>
          {previewFailed
            ? 'The preview could not load. The button opens the file, or explains why it cannot.'
            : 'No preview for this file type (HEIC, HEIF or PDF). Use the button to open it.'}
        </div>
      )}

      <div className="field-description" style={{ marginTop: 'calc(var(--base) / 2)' }}>
        Each click makes a new private link to the file that lasts 5 minutes.
      </div>
    </div>
  )
}
