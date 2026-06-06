import React from 'react'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Museum / Organization structured data (JSON-LD).
 *
 * Rendered once on the home page so Google can build a rich result /
 * knowledge panel for the museum (name, address, founder, logo, socials).
 *
 * Server component — emits a plain <script type="application/ld+json">.
 *
 * Opening hours: Mon–Sat 11:00–18:00 — confirmed canonical by the owner.
 * The footer previously showed a stale "10am–4pm"; that was corrected to
 * match (see footer.tsx OPENING_HOURS), so the site and the schema now
 * agree.
 *
 * Data sources (all from the live site / footer — not fabricated):
 *  - Address: footer ADDRESS_LINES
 *  - Socials: footer SocialLinks (X points at the parent brand
 *    Sunita Shekhawat — there's no dedicated MoMH X profile yet)
 *  - Positioning: homepage InfoHero / About copy
 */
export const MuseumJsonLd: React.FC = () => {
  const url = getServerSideURL()

  const schema = {
    '@context': 'https://schema.org',
    // Multi-typed: Museum (a Place) makes `address` + `openingHoursSpecification`
    // valid, while Organization makes `founder` + `logo` + `sameAs` valid. A bare
    // "Museum" would flag those Org-only props as unknown in Google's Rich
    // Results Test (harmless, but it reads as a mistake). A museum legitimately
    // IS both an organization and a place, so this is the correct modelling.
    '@type': ['Museum', 'Organization'],
    name: 'Museum of Meenakari Heritage',
    alternateName: 'MOMH',
    description:
      "India's first museum devoted entirely to the centuries-old art of enamelling on gold. Housed within Shekhawat Haveli, the permanent gallery traces meenakari's journey from Renaissance Europe to the royal courts of Jaipur.",
    url,
    logo: `${url}/momh-logo.jpg`,
    image: `${url}/og-momh.jpg`,
    founder: {
      '@type': 'Organization',
      name: 'The House of Sunita Shekhawat',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Shekhawat Haveli, E141, Sardar Patel Marg, Durgadas Colony, C Scheme, Ashok Nagar',
      addressLocality: 'Jaipur',
      addressRegion: 'Rajasthan',
      postalCode: '302001',
      addressCountry: 'IN',
    },
    // Exact pin — confirmed canonical by the owner from the Google Maps
    // listing for the haveli (the "Sunita Shekhawat Jewellery" place, which
    // is where MOMH is housed). Lat/lng are the place marker (`!3d`/`!4d`),
    // NOT the map-view centre. `geo` is what Google actually uses to position
    // the museum in Maps / local results / the knowledge panel, so this is the
    // load-bearing location signal.
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 26.9053956,
      longitude: 75.7941591,
    },
    // Stable CID link to that exact Google place (derived from the listing's
    // feature id), so `hasMap` resolves to the verified pin rather than a
    // fuzzy address text-search.
    hasMap: 'https://maps.google.com/?cid=12916303950302817297',
    sameAs: [
      'https://www.instagram.com/momh_india/',
      'https://www.linkedin.com/company/museum-of-meenakari-heritage-momh/',
      'https://www.facebook.com/sunitashekhawatjaipur',
      'https://www.youtube.com/channel/UCVDcqrqm62CcaPe1O5iJiVg',
      'https://in.pinterest.com/shekhawatsunita/',
      // Parent brand X (Sunita Shekhawat Jaipur). Mirrors the footer
      // icon. Swap to a dedicated `@momh_india`-style handle when one
      // exists.
      'https://x.com/sshekhawatjpr',
    ],
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '11:00',
      closes: '18:00',
    },
  }

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inject; no user input is interpolated.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default MuseumJsonLd
