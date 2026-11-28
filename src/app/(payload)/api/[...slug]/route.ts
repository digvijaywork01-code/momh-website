/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
/* STOP-GAP until the Payload 3.93 upgrade: every handler except OPTIONS is
   wrapped by gateRest (see src/access/stopgapGate.ts). To undo: remove the
   import below and the gateRest(config, ...) wrappers. */
import config from '@payload-config'
import '@payloadcms/next/css'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'

import { gateRest } from '@/access/stopgapGate'

export const GET = gateRest(config, REST_GET(config))
export const POST = gateRest(config, REST_POST(config))
export const DELETE = gateRest(config, REST_DELETE(config))
export const PATCH = gateRest(config, REST_PATCH(config))

export const PUT = gateRest(config, REST_PUT(config))
export const OPTIONS = REST_OPTIONS(config)
