import path from 'path'

/**
 * Files that the home-page seed (`seed-momh`) uploads. These live in
 * `public/momh-assets/` and are referenced by Media records the home
 * page expects to find on disk.
 *
 * Sub-page seeds (plan-your-visit, craft-your-jewellery, museum-
 * guidelines, personal-consultation, book-an-appointment, thank-you)
 * frequently reuse one or more of these images (e.g. `artboard-15.jpg`
 * — the shared haveli top — or one of the brown/white icons). When
 * those seeds run their per-page cleanup via `wipeSeedFilesOnDisk`,
 * they MUST NOT delete the home page's files from `public/media/` —
 * otherwise Payload's existing home-page Media records become broken
 * references and the icons / hero images 500 on next load.
 *
 * Pass this set to a sub-page seed's wipe helper:
 *
 *   const stems = SEED_SOURCE_FILES
 *     .map((f) => path.parse(f).name)
 *     .filter((stem) => !HOME_SEED_STEMS.has(stem))
 *
 * Per-upload renaming (Payload appends `-1`, `-2`, etc. when a
 * filename collides) prevents DB-level conflicts when the sub-page
 * needs its own copy of one of these images.
 */
export const HOME_SEED_SOURCE_FILES = [
  'momh-assets/artboard-15.jpg',
  'momh-assets/artboard-16.jpg',
  'momh-assets/artboard-17.jpg',
  'momh-assets/artboard-18.jpg',
  'momh-assets/artboard-19.jpg',
  'momh-assets/artboard-20.jpg',
  'momh-assets/artboard-21.jpg',
  'momh-assets/artboard-22.jpg',
  'momh-assets/artboard-23.jpg',
  'momh-assets/artboard-24.jpg',
  'momh-assets/artboard-25.jpg',
  'momh-assets/artboard-26.jpg',
  'momh-assets/artboard-27.jpg',
  'momh-assets/artboard-28.jpg',
  'momh-assets/artboard-29.png',
  'momh-assets/artboard-30.png',
  'momh-assets/artboard-31.png',
  'momh-assets/artboard-32.png',
  'momh-assets/artboard-33.png',
  'momh-assets/artboard-34.png',
]

/** Filename stems (without extension) for `HOME_SEED_SOURCE_FILES`,
 *  for use with `startsWith` checks against Payload's resize variants
 *  (`artboard-15-1920x945.jpg`, `artboard-32-300x300.png`, etc.). */
export const HOME_SEED_STEMS = new Set(
  HOME_SEED_SOURCE_FILES.map((f) => path.parse(f).name),
)

/** Files shared by EVERY inner-page seed (Plan Your Visit, Craft
 *  Your Jewellery, Museum Guidelines, Personal Consultation, Book
 *  An Appointment, Thank You). Each seed uploads its own copy of
 *  these via Payload (which renames collisions to `-1`, `-2`, etc.).
 *  Without this allowlist, the LAST sub-page to run would wipe the
 *  earlier sub-pages' derivatives off disk via `wipeSeedFilesOnDisk`
 *  — breaking every previously-seeded inner page's banner image.
 *  Add stems here whenever a file is referenced from more than one
 *  sub-page seed. */
export const SHARED_INNER_STEMS = new Set<string>([
  'inner-banner-cropped',
])

/** Combined stem allowlist passed to every sub-page seed's wipe
 *  helper — protects both the home page's files AND any cross-
 *  sub-page shared files from accidental deletion. */
export const PROTECTED_STEMS = new Set<string>([
  ...HOME_SEED_STEMS,
  ...SHARED_INNER_STEMS,
])
