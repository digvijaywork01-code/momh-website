'use client'
import type { PressGridBlock } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

/** Admin row label for a press item: "Condé Nast Traveller India, 14 January 2026". */
export const RowLabel: React.FC<RowLabelProps> = () => {
  const row = useRowLabel<NonNullable<PressGridBlock['items']>[number]>()
  const publication = row?.data?.publication
  const date = row?.data?.date
    ? new Date(row.data.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      })
    : ''
  const number = row?.rowNumber !== undefined ? `${row.rowNumber + 1}. ` : ''

  return <div>{publication ? `${number}${publication}${date ? `, ${date}` : ''}` : `${number}New press item`}</div>
}
