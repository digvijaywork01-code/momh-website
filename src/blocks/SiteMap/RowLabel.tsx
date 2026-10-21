'use client'
import type { SiteMapBlock } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type Column = NonNullable<SiteMapBlock['columns']>[number]
type Link = NonNullable<Column['links']>[number]

/** Admin row label for a column: "1. About". */
export const ColumnRowLabel: React.FC<RowLabelProps> = () => {
  const row = useRowLabel<Column>()
  const number = row?.rowNumber !== undefined ? `${row.rowNumber + 1}. ` : ''
  return <div>{`${number}${row?.data?.title || 'New column'}`}</div>
}

/** Admin row label for a link: "2. Our Story (/about)". */
export const LinkRowLabel: React.FC<RowLabelProps> = () => {
  const row = useRowLabel<Link>()
  const number = row?.rowNumber !== undefined ? `${row.rowNumber + 1}. ` : ''
  const label = row?.data?.label
  const url = row?.data?.url
  return <div>{label ? `${number}${label}${url ? ` (${url})` : ''}` : `${number}New link`}</div>
}
