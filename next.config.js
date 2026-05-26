import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined || process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
      // Allow Next/Image to optimise images requested from Cloudflare
      // Quick Tunnel + ngrok hostnames when the site is being shared
      // publicly via tunnel. Without this, `<Media fill>` throws
      // "hostname is not configured under images" because the
      // generated `/api/media/file/...` URL uses the tunnel host
      // rather than localhost.
      { hostname: '*.trycloudflare.com', protocol: 'https' },
      { hostname: '*.ngrok-free.app', protocol: 'https' },
      { hostname: '*.ngrok.app', protocol: 'https' },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  // Allow cross-origin requests from Cloudflare Quick Tunnel hosts
  // (e.g. `*.trycloudflare.com`) and ngrok-style tunnels during dev.
  // Without this, Next.js 15+ blocks dev-time HMR + RSC requests from
  // non-localhost origins as a CSRF guard.
  allowedDevOrigins: ['*.trycloudflare.com', '*.ngrok-free.app', '*.ngrok.app'],
  redirects,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
