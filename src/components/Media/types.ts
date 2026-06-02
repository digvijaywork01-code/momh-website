import type { StaticImageData } from 'next/image'
import type { ElementType, Ref } from 'react'

import type { Media as MediaType } from '@/payload-types'

export interface Props {
  alt?: string
  className?: string
  fill?: boolean // for NextImage only
  htmlElement?: ElementType | null
  pictureClassName?: string
  imgClassName?: string
  onClick?: () => void
  onLoad?: () => void
  loading?: 'lazy' | 'eager' // for NextImage only
  priority?: boolean // for NextImage only
  // next/image quality (1–100). Defaults to 80 in ImageMedia — a near-
  // imperceptible drop from the old hard-coded 100 that roughly halves
  // image bytes. Pass a higher value (e.g. 85) for hero/feature imagery
  // where fine meenakari detail matters, or lower (e.g. 60) for small
  // decorative thumbnails like the footer flowers.
  quality?: number // for NextImage only
  ref?: Ref<HTMLImageElement | HTMLVideoElement | null>
  resource?: MediaType | string | number | null // for Payload media
  size?: string // for NextImage only
  src?: StaticImageData // for static media
  videoClassName?: string
}
