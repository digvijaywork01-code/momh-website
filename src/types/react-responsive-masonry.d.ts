declare module 'react-responsive-masonry' {
  import { ReactNode } from 'react'

  export interface ResponsiveMasonryProps {
    columnsCountBreakPoints?: Record<number, number>
    gutterBreakpoints?: Record<number, string>
    children: ReactNode
  }

  export interface MasonryProps {
    columnsCount?: number
    gutter?: string
    containerTag?: string
    itemTag?: string
    itemStyle?: React.CSSProperties
    sequential?: boolean
    children: ReactNode
  }

  export const ResponsiveMasonry: React.FC<ResponsiveMasonryProps>
  const Masonry: React.FC<MasonryProps>
  export default Masonry
}
