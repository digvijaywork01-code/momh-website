// True when a rich-text value holds any visible text. An untouched field can
// still store an empty paragraph, a field typed into and then cleared stores
// one too, and a stray space must not count either.
type LexicalNode = { text?: unknown; children?: LexicalNode[] }

export const richTextHasText = (value: unknown): boolean => {
  const walk = (node: LexicalNode | undefined): boolean =>
    Boolean(node) &&
    ((typeof node?.text === 'string' && /\S/.test(node.text)) ||
      (Array.isArray(node?.children) && node.children.some(walk)))
  return walk((value as { root?: LexicalNode } | null | undefined)?.root)
}
