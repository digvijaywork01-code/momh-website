/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import { headers } from 'next/headers'
import React from 'react'

import { hasNoLogin } from '@/access/stopgapGate'

import { importMap } from './admin/importMap.js'
import './custom.scss'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  // STOP-GAP until the Payload 3.93 upgrade (see src/access/stopgapGate.ts):
  // a caller without a login may run only 'form-state'. The create-first-user
  // page needs that one, and it refuses by itself once a user exists.
  // To undo: remove this if-block and the two imports added above.
  if (args?.name !== 'form-state' && (await hasNoLogin(config, await headers()))) {
    throw new Error('Unauthorized')
  }
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
