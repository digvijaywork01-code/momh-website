// The words of a rich-text value as one plain line: text runs joined, each
// paragraph or other block separated by a space, outer spaces trimmed. For a
// heading reused as a small plain label (a title block's heading shown as the
// line above a hero's title).
type LexicalNode = { text?: unknown; type?: string; children?: LexicalNode[] }

const INLINE_ELEMENTS = new Set(['link', 'autolink'])

export const richTextToPlain = (value: unknown): string => {
  const walk = (node: LexicalNode | undefined): string => {
    if (!node) return ''
    if (typeof node.text === 'string') return node.text
    if (node.type === 'linebreak' || node.type === 'tab') return ' '
    const inner = (node.children ?? []).map(walk).join('')
    return INLINE_ELEMENTS.has(node.type ?? '') ? inner : `${inner} `
  }
  return walk((value as { root?: LexicalNode } | null | undefined)?.root)
    .replace(/\s+/g, ' ')
    .trim()
}
