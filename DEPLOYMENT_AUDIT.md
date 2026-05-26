# MOMH Pre-Deployment Hosting Audit

Created: 26 May 2026
Scope: Verify how SSJ and the current MOMH site are hosted, and what the new MOMH project needs to deploy.
Method: Read-only. DNS lookups, HTTP header inspection, SSL cert checks, IP→ASN reverse lookup, and project-file reads. No deploys, DNS changes, or commits.

---

## 1. New MOMH project — `/Users/sachinkumar/momh`

| Item | Finding |
|---|---|
| Framework | **Next.js 15.3.3** (App Router) + **Payload CMS 3.48** |
| Database | **PostgreSQL** (`@payloadcms/db-postgres`) — `.env.example` shows both Mongo and Postgres options; `.env` uses Postgres |
| Image processing | `sharp 0.34.2` (native binary — needs Linux/Vercel runtime built with sharp) |
| Node engine | `^18.20.2 || >=20.9.0` (package.json) |
| Package manager | **pnpm 9 or 10** (pnpm-lock.yaml present) |
| Build script | `cross-env NODE_OPTIONS="--no-deprecation --no-experimental-webstorage" next build` |
| Post-build | `next-sitemap` |
| Build output | `.next/` directory present (1.8 GB locally, last built 25 May 23:17 — *observed existing artifact, did not run a fresh `pnpm build` for this audit*). **SSR** — not a static export. No `output: 'export'` and no `output: 'standalone'` in `next.config.js`. The 1.8 GB number includes `.next/cache/` (Webpack/turbopack cache); the actual deploy-relevant payload is much smaller — Vercel will compute this on build. |
| Deployment configs present | **None.** No `vercel.json`, no `netlify.toml`, no `wrangler.toml`, no `render.yaml`, no `amplify.yml`, no `.github/workflows/`, no `.vercel/` link. |
| Dockerfile | Present, but it's the boilerplate `with-docker` example that **requires `output: 'standalone'`** in `next.config.js` — currently NOT set, so this Dockerfile would not produce a usable image without that config change. |
| docker-compose.yml | Present but **stale** — references `node:18-alpine` + `mongo` for dev, conflicts with current `.env` (Postgres). Dev-only, ignore. |
| Vercel hint in code | `next.config.js` references `process.env.VERCEL_PROJECT_PRODUCTION_URL` → project is **coded to expect Vercel** at runtime |
| Env vars expected | `DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `CRON_SECRET`, `PREVIEW_SECRET` |
| Git remote | `git@github.com:mehmehsloth/momh.git` |
| Current branch | `feat/payload-blocks-landing-page` |

**Verdict:** SSR Next.js + Payload, currently unlinked to any host. Code-side hints (Vercel env var, Payload Cloud package in deps) point at Vercel as the intended target, matching SSJ's setup.

### 1a. Worktree at `/Users/sachinkumar/sunitashekhawat/.claude/worktrees/happy-blackwell-5cc37a`

The brief named this as "feat/momh-website-setup branch". Worth flagging: this worktree is on the **SSJ repo** (`github.com:ragzor/sunitashekhawat.git`), not the standalone MOMH repo. `package.json` name is `"ss"` (SSJ), `next.config.ts` (not `.js`). No `vercel.json`, no `.vercel/`, no `.github/workflows/` of its own — it inherits from the SSJ repo. So we actually have **two parallel MOMH efforts**:
- `/Users/sachinkumar/momh` → standalone repo `mehmehsloth/momh`, branch `feat/payload-blocks-landing-page`. This is the standalone new MOMH site this audit assumes is being deployed.
- `/Users/sachinkumar/sunitashekhawat/.claude/worktrees/happy-blackwell-5cc37a` → SSJ repo, branch `feat/momh-website-setup`. Possibly MOMH-related work happening inside SSJ (sub-route? shared components?).

Worth confirming with Digvijay which of the two is the intended production path before proceeding.

---

## 2. SSJ project — `/Users/sachinkumar/sunitashekhawat`

| Item | Finding |
|---|---|
| Framework | **Next.js 15.3.6** + **Payload CMS 3.43** |
| Database | PostgreSQL |
| Storage | `@payloadcms/storage-vercel-blob` AND `@payloadcms/storage-s3` |
| Linked to Vercel | **Yes.** `.vercel/project.json`: `projectName: "sunitashekhawat"`, `projectId: prj_7oq3tdLFNQF8FYt4eY9k6DjvLqWW`, `orgId: team_GvRYNjlufb0TJL9OcRCGIpDw` |
| CI/CD | `.github/workflows/deploy.yml` — on push to `main`, GitHub Actions runs `vercel pull/build/deploy --prod` via Vercel CLI. Bypasses Vercel's per-commit-author gate. |
| Git remote | `git@github.com:ragzor/sunitashekhawat.git` |

---

## 3. SSJ — live hosting verification (sunitashekhawat.com)

| Aspect | Evidence |
|---|---|
| **DNS provider** | **Vercel DNS.** `dig NS sunitashekhawat.com` → `ns1.vercel-dns.com.`, `ns2.vercel-dns.com.` |
| **A records (apex)** | `216.150.1.1`, `216.150.16.193` |
| **A records (www)** | `216.150.1.193`, `216.150.16.193` |
| **IP ASN** | **AS16509 Amazon.com, Inc.** (Walnut, CA) — this is Vercel's edge running on AWS, anycast |
| **Server header** | `server: Vercel` (both `https://sunitashekhawat.com` and `https://www.sunitashekhawat.com`) |
| **Other Vercel headers** | `x-vercel-id: bom1::iad1::...`, `x-vercel-cache: MISS`, `x-matched-path: /[slug]` |
| **Framework giveaway** | `x-powered-by: Next.js, Payload` |
| **SSL issuer** | Let's Encrypt R13 (wildcard `*.sunitashekhawat.com`), valid 17 Apr 2026 → 16 Jul 2026 — auto-managed by Vercel |
| **Domain registrar** | Network Solutions, LLC (expires 12 Nov 2028) |
| **Email (MX)** | Google Workspace (`aspmx.l.google.com` etc.) |
| **TXT signals** | Google site verification, `klaviyo-site-verification=RzpNkP` |
| **www → apex** | `www.sunitashekhawat.com` 301s to `sunitashekhawat.com` (canonical is apex) |

**Verdict (SSJ):** Fully on Vercel — DNS, hosting, SSL all managed by Vercel; deployed via GitHub Actions on push to `main`. Email is on Google Workspace.

---

## 4. Current MOMH — live hosting verification (momhindia.org)

| Aspect | Evidence |
|---|---|
| **DNS provider** | **Cloudflare DNS.** `dig NS momhindia.org` → `aurora.ns.cloudflare.com.`, `ridge.ns.cloudflare.com.` |
| **A records (apex & www)** | Single IP: `67.227.136.113` (same for apex and www) |
| **IP ASN** | **AS32244 Liquid Web, L.L.C** (Lansing, Michigan). PTR hostname: `host.redefineapp.io` — Liquid Web reseller, likely the agency that originally built the site |
| **Server header** | `Server: nginx` |
| **Other headers** | No Vercel/Netlify/Cloudflare proxy headers. No `cf-ray` → Cloudflare is acting as **DNS only**, not proxying traffic. |
| **Hosting type confirmation** | Port 2083 (`https://www.momhindia.org:2083`) returns a **cPanel login page** → standard cPanel shared/managed hosting on Liquid Web |
| **SSL issuer** | Let's Encrypt R13 (CN `momhindia.org`), valid 18 Apr 2026 → 17 Jul 2026 — auto-renewed by cPanel/AutoSSL |
| **Domain registrar** | **GoDaddy** (expires 17 Jun 2029). NS delegated to Cloudflare. |
| **Email (MX)** | Google Workspace |
| **TXT signals** | Google site verification, SPF via `_spfm.momhindia.org` (likely a mail vendor) |
| **Frontend stack** | Plain static HTML, Alpine.js (CDN), Vimeo embeds, hand-rolled `bundle.js` + `main.css`, EB Garamond + Lato Google fonts. `Last-Modified: Thu, 28 Nov 2024` → site has not been touched in ~6 months. |
| **No CMS** | No `wp-content`, no WordPress generator meta, no Shopify/Wix/Squarespace markers. `/wp-admin/` returns 404. Static files served by nginx. |
| **robots/sitemap** | `robots.txt` allows all, points to `/sitemap.xml`; sitemap is a static XML file. |

**Verdict (current MOMH):** Static HTML site sitting on Liquid Web cPanel shared hosting (via a reseller, `host.redefineapp.io`). GoDaddy is **only the registrar** — actual hosting is Liquid Web, DNS is Cloudflare.

---

## 5. Side-by-side summary

| Aspect | SSJ (sunitashekhawat.com) | MOMH current (momhindia.org) | MOMH new (local project) |
|---|---|---|---|
| Framework / stack | Next.js 15.3.6 + Payload CMS 3.43 | Plain static HTML + Alpine.js (CDN) + Vimeo | Next.js 15.3.3 + Payload CMS 3.48 |
| Database | Postgres | None (static) | Postgres |
| Hosting provider | **Vercel** (edge on AWS) | **Liquid Web cPanel** (via `host.redefineapp.io` reseller) | **Not yet linked** — code expects Vercel |
| DNS provider | Vercel DNS | Cloudflare DNS (DNS-only, no proxy) | TBD |
| Domain registrar | Network Solutions | **GoDaddy** (registrar only) | (new domain or reuse momhindia.org — TBD) |
| SSL issuer | Let's Encrypt (Vercel-managed, wildcard) | Let's Encrypt (cPanel AutoSSL) | TBD (Vercel will auto-issue) |
| Build output type | SSR (Next.js on Vercel runtime) | Pre-built static files | SSR — `.next` directory, no `output: 'standalone'` or `output: 'export'` |
| CI/CD | GitHub Actions → Vercel CLI on push to `main` | None — files uploaded manually via cPanel/SFTP | None configured yet |
| Deployment config in repo | `.github/workflows/deploy.yml`, `.vercel/project.json` | n/a | **None** — no vercel.json/netlify.toml/.vercel/.github |
| Email | Google Workspace | Google Workspace | (will inherit `info@momhindia.org` either way) |

---

## 6. What this means for the new MOMH deployment

The cleanest path is to mirror SSJ's setup exactly: Vercel project + Vercel DNS + GitHub Actions deploy on push. The new MOMH project is already coded for Vercel (env var reference, Payload Cloud package). Things that DON'T match SSJ and will need decisions:

1. **DNS cutover from Cloudflare → Vercel DNS.** SSJ uses Vercel-managed nameservers. The cleanest move is to change nameservers at GoDaddy from Cloudflare to `ns1.vercel-dns.com` / `ns2.vercel-dns.com`. Alternative: leave Cloudflare as DNS, point an `A` / `CNAME` at Vercel's edge — but you lose the easy MX/TXT migration we did for SSJ. (Email MX records will need to be re-added either way.)
2. **Postgres host for production.** SSJ uses a Postgres provider (not documented in the repo's `.env`). MOMH will need the same — Railway / Neon / Vercel Postgres. Not present in any project file.
3. **Media storage.** SSJ uses Vercel Blob + optionally S3. New MOMH has `@payloadcms/payload-cloud` in deps but no S3/Vercel Blob package. Will need a media backend configured before launch.
4. **The static `momhindia.org` site has to be taken down / replaced.** Switching NS away from Cloudflare to Vercel automatically orphans the Liquid Web hosting — but the cPanel files will still be there if there's any rollback need. Confirm with the agency (`redefineapp.io`) that we own the cPanel account or have access before cutover, otherwise we lose the original assets.
5. **GitHub Actions deploy workflow** like SSJ's — needs `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets on `mehmehsloth/momh`.
6. **`next.config.js`** — review `images.remotePatterns` to add the production hostname (currently only allows `*.trycloudflare.com` / `*.ngrok*` and the build-time origin).

---

## 7. Open questions for Digvijay

| # | Question | Why it matters | What unblocks it |
|---|---|---|---|
| 1 | Do we have/own the GoDaddy account for `momhindia.org`? | Needed to change NS records to Vercel | GoDaddy login |
| 2 | Do we have the Cloudflare account currently holding `momhindia.org` DNS? | Needed to capture existing MX/TXT before cutover (Google Workspace records, SPF) | Cloudflare login |
| 3 | Who owns the Liquid Web / `redefineapp.io` cPanel account? Do we have cPanel creds? | If we want to archive the current static site or pull any assets before cutover | cPanel login or contact at `redefineapp.io` |
| 4 | Which Vercel team should host MOMH — same `Sunita Shekhawat Projects` team (`team_GvRYNjlufb0TJL9OcRCGIpDw`) or a new one? | Determines billing + access control | Decision from Digvijay |
| 5 | Postgres provider choice for prod (Railway / Neon / Vercel Postgres)? | Required env var `DATABASE_URI` before first deploy | Decision + spin-up |
| 6 | Media storage for Payload (Vercel Blob vs S3-on-MinIO like Twenty CRM)? | Required to upload images via CMS | Decision + provider creds |
| 7 | Will the new site live at the same domain (`momhindia.org`) or a subdomain first (e.g. `new.momhindia.org`) for a staged cutover? | Affects DNS plan and whether email migration is in scope | Decision from Digvijay |
| 8 | Email: keep MX on Google Workspace, just re-add the records on Vercel DNS? | Standard, low risk, but needs the existing TXT/MX records dumped from Cloudflare first | Cloudflare DNS export |
| 9 | Did the agency at `redefineapp.io` register anything else (extra subdomains, redirects, mailboxes) we'd lose? | Sanity check before cutover | Conversation with agency |
| 10 | Is the Dockerfile in the new MOMH repo intended for prod, or leftover boilerplate? | If prod is Vercel, we should either delete the Dockerfile or set `output: 'standalone'` so it actually builds. Same applies to `docker-compose.yml` which still references `mongo` while the live `.env` uses Postgres — file is stale and misleading. | Decision from Digvijay |
| 11 | Which is the canonical MOMH codebase — standalone `mehmehsloth/momh` repo, or the `feat/momh-website-setup` branch on the SSJ repo? | Two parallel efforts exist; clarifying avoids divergent work | Decision from Digvijay |

---

## Executive summary

SSJ is fully on **Vercel** — Vercel-managed DNS (NS1/NS2.vercel-dns.com), Vercel edge hosting on AWS, Let's Encrypt SSL auto-issued by Vercel, deployed via GitHub Actions on push to `main`, with Network Solutions as registrar and Google Workspace for email. The current `momhindia.org` site is something completely different: a hand-coded static HTML site (Alpine.js + Vimeo, last touched Nov 2024) sitting on **Liquid Web cPanel shared hosting** at `host.redefineapp.io` (an agency reseller), with **Cloudflare as DNS-only** (not proxied) and **GoDaddy as registrar only** — GoDaddy is not the host. The new MOMH project in `/Users/sachinkumar/momh` is a Next.js 15 + Payload CMS 3.48 SSR app coded to expect Vercel but currently **not linked to any host** (no `vercel.json`, no `.vercel/`, no `.github/workflows/`, no Netlify/Render/Amplify configs). Recommended path is to mirror SSJ exactly: create a Vercel project, move NS from Cloudflare to Vercel DNS, re-add Google Workspace MX/TXT, wire a GitHub Actions deploy workflow, and pick a Postgres + media-storage backend before first deploy. Open questions above need answers from Digvijay before cutover — most pressing: who owns the GoDaddy + Cloudflare + Liquid Web accounts today.
