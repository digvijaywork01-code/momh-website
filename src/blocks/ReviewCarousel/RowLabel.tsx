'use client'
import type { ReviewCarouselBlock } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

/** Admin row label for a review: "3. Himashweta S.". */
export const RowLabel: React.FC<RowLabelProps> = () => {
  const row = useRowLabel<NonNullable<ReviewCarouselBlock['reviews']>[number]>()
  const author = row?.data?.author?.trim()
  const number = row?.rowNumber !== undefined ? `${row.rowNumber + 1}. ` : ''

  return <div>{`${number}${author || 'New review'}`}</div>
}
