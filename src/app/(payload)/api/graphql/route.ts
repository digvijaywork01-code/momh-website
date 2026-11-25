/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
/* STOP-GAP until the Payload 3.93 upgrade: GraphQL is switched off here for
   everyone. Nothing on the site or in the admin uses it. In Payload 3.48.0
   the config flag graphQL.disable does not stop this POST handler, so it is
   done in this file. To undo: restore the two lines marked "was". */
import config from '@payload-config'
import { REST_OPTIONS } from '@payloadcms/next/routes' // was: { GRAPHQL_POST, REST_OPTIONS }

// was: export const POST = GRAPHQL_POST(config)
export const POST = (): Response => new Response('Route Not Found', { status: 404 })

export const OPTIONS = REST_OPTIONS(config)
