'use client'
import type { FormFieldBlock, Form as FormType } from '@payloadcms/plugin-form-builder/types'

import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { fields } from './fields'
import { getClientSideURL } from '@/utilities/getURL'

export type FormBlockType = {
  blockName?: string
  blockType?: 'formBlock'
  enableIntro: boolean
  form: FormType
  introContent?: SerializedEditorState
}

export const FormBlock: React.FC<
  {
    id?: string
  } & FormBlockType
> = (props) => {
  const {
    enableIntro,
    form: formFromProps,
    form: { id: formID, confirmationMessage, confirmationType, redirect, submitButtonLabel } = {},
    introContent,
  } = props

  const formMethods = useForm({
    defaultValues: formFromProps.fields,
  })
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = formMethods

  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>()
  const [error, setError] = useState<{ message: string; status?: string } | undefined>()
  // Honeypot — paired with the formSubmissionOverrides hook in src/plugins/index.ts.
  // Real visitors never see this field; bots fill in every field they
  // can find, so a non-empty value is a strong spam signal.
  const [honeypot, setHoneypot] = useState('')
  // Server-signed HMAC token — fetched on mount from /api/form-token.
  // The submission-overrides hook verifies the signature + the elapsed
  // time (must be between 3 s and 30 min). A bot that pre-fetches a
  // token can't reuse it indefinitely, and one that pre-generates without
  // calling the endpoint can't sign correctly without PAYLOAD_SECRET.
  const [token, setToken] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    fetch('/api/form-token')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { token?: string }) => {
        if (!cancelled && typeof d?.token === 'string') setToken(d.token)
        else if (!cancelled) setTokenError(true)
      })
      .catch(() => {
        if (!cancelled) setTokenError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const onSubmit = useCallback(
    (data: FormFieldBlock[]) => {
      let loadingTimerID: ReturnType<typeof setTimeout>
      const submitForm = async () => {
        setError(undefined)

        if (!token) {
          setError({ message: 'Form is still initialising. Please wait a moment and try again.' })
          return
        }

        // Submission payload — user fields + the two spam-protection
        // markers (honeypot + signed token). Both are stripped by the
        // formSubmissionOverrides hook before the submission is stored,
        // so the admin's Form Submissions view stays clean.
        const submissionData = [
          ...Object.entries(data).map(([name, value]) => ({
            field: name,
            value,
          })),
          { field: '_hp', value: honeypot },
          { field: '_t', value: token },
        ]
        // Cleaned data sent to email-forwarding so the owner email
        // doesn't show the internal markers.
        const cleanSubmissionData = submissionData.filter(
          (f) => f.field !== '_hp' && f.field !== '_t',
        )

        // delay loading indicator by 1s
        loadingTimerID = setTimeout(() => {
          setIsLoading(true)
        }, 1000)

        try {
          const req = await fetch(`${getClientSideURL()}/api/form-submissions`, {
            body: JSON.stringify({
              form: formID,
              submissionData,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          })

          const res = await req.json()

          clearTimeout(loadingTimerID)

          if (req.status >= 400) {
            setIsLoading(false)

            setError({
              message: res.errors?.[0]?.message || 'Internal Server Error',
              status: res.status,
            })

            return
          }

          // Persistence succeeded — fire off the customer + owner
          // notification emails. Failures here are logged but don't
          // bubble up to the user; the submission is already safe in
          // the database, and the team can recover via the admin.
          try {
            await fetch('/api/email-forwarding', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                form: formID,
                submissionData: cleanSubmissionData,
              }),
            })
          } catch (emailErr) {
            console.error('email-forwarding failed:', emailErr)
          }

          setIsLoading(false)
          setHasSubmitted(true)

          if (confirmationType === 'redirect' && redirect) {
            const { url } = redirect

            const redirectUrl = url

            if (redirectUrl) router.push(redirectUrl)
          }
        } catch (err) {
          console.warn(err)
          setIsLoading(false)
          setError({
            message: 'Something went wrong.',
          })
        }
      }

      void submitForm()
    },
    [router, formID, redirect, confirmationType, honeypot, token],
  )

  return (
    <div className="container lg:max-w-[48rem]">
      {enableIntro && introContent && !hasSubmitted && (
        <RichText className="mb-8 lg:mb-12" data={introContent} enableGutter={false} />
      )}
      <div className="p-4 lg:p-6 border border-border rounded-[0.8rem]">
        <FormProvider {...formMethods}>
          {!isLoading && hasSubmitted && confirmationType === 'message' && (
            <RichText data={confirmationMessage} />
          )}
          {isLoading && !hasSubmitted && <p>Loading, please wait...</p>}
          {error && <div>{`${error.status || '500'}: ${error.message || ''}`}</div>}
          {tokenError && !hasSubmitted && (
            <div className="text-red-600 text-sm mb-3">
              Form failed to initialise. Please refresh the page and try again.
            </div>
          )}
          {!hasSubmitted && (
            <form id={formID} onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4 last:mb-0">
                {formFromProps &&
                  formFromProps.fields &&
                  formFromProps.fields?.map((field, index) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const Field: React.FC<any> = fields?.[field.blockType as keyof typeof fields]
                    if (Field) {
                      return (
                        <div className="mb-6 last:mb-0" key={index}>
                          <Field
                            form={formFromProps}
                            {...field}
                            {...formMethods}
                            control={control}
                            errors={errors}
                            register={register}
                          />
                        </div>
                      )
                    }
                    return null
                  })}
              </div>

              {/* Spam-protection honeypot — visually hidden, accessibly
                  hidden (aria-hidden + tabIndex -1), but reachable to
                  scrapers that walk the DOM. Real visitors will never
                  see or fill this field; bots fill anything they find. */}
              <input
                type="text"
                name="website_url"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '-9999px',
                  width: 1,
                  height: 1,
                  opacity: 0,
                }}
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />

              <Button
                form={formID}
                type="submit"
                variant="default"
                disabled={isLoading || !token}
              >
                {isLoading
                  ? 'Submitting…'
                  : !token && !tokenError
                    ? 'Loading…'
                    : submitButtonLabel}
              </Button>
            </form>
          )}
        </FormProvider>
      </div>
    </div>
  )
}
