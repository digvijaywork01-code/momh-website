/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
/* STOP-GAP until the Payload 3.93 upgrade: Page() below first sends a
   visitor who arrives from another website WITH a query string to the same
   admin address without the query string (see comesFromAnotherSite in
   src/access/stopgapGate.ts). To undo: restore the two lines marked "was"
   and remove the three imports marked STOP-GAP. */
import type { Metadata } from 'next'

import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { headers } from 'next/headers' // STOP-GAP
import { redirect } from 'next/navigation' // STOP-GAP

import { comesFromAnotherSite } from '@/access/stopgapGate' // STOP-GAP

import { importMap } from '../importMap'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

// was: const Page = ({ params, searchParams }: Args) =>
// was:   RootPage({ config, params, searchParams, importMap })
const Page = async ({ params, searchParams }: Args) => {
  // The admin list pages build their database filter from the query string.
  // A link or redirect on another website must not be able to choose that
  // filter for a signed-in editor, so such an arrival keeps its path and
  // loses its query string. Normal use of the admin never matches this.
  if (comesFromAnotherSite(await headers()) && Object.keys(await searchParams).length > 0) {
    const { segments } = await params

    redirect(['/admin', ...(segments ?? []).map(encodeURIComponent)].join('/'))
  }

  return RootPage({ config, params, searchParams, importMap })
}

export default Page
