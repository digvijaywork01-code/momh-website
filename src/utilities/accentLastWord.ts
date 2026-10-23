// The site's heading rule: only the LAST word of a title or section heading
// carries the accent. Lexical italic is that accent; each heading style
// renders it in its serif italic and in brand red. Any italic or bold run the
// editor typed elsewhere in the heading is dropped and the accent moves to
// the last word, so "Terms *of Use*" renders as "Terms of *Use*" and
// "A **TRADE** CARRIED BY SEA" as "A TRADE CARRIED BY *SEA*". Runs at render
// time on a copy; the stored content is not changed. A heading whose only
// italic run is already its last word comes back with the same nodes.

const IS_BOLD = 1
const IS_ITALIC = 1 << 1

type LexicalNode = {
  type?: string
  text?: string
  format?: number | string
  children?: LexicalNode[]
}

type Leaf = { node: LexicalNode; siblings: LexicalNode[]; start: number; end: number }

// Inline element nodes sit inside a line of text; every other element
// (paragraph, heading, list item...) ends the line, and so ends a word.
const INLINE_ELEMENTS = new Set(['link', 'autolink'])

export const accentLastWord = <T>(value: T): T => {
  if (!(value as { root?: LexicalNode } | null | undefined)?.root) return value
  // Lexical state is plain JSON. A JSON copy, not structuredClone: this runs in
  // the browser during hydration, and structuredClone is missing before
  // Safari 15.4 / Chrome 98 (Next does not polyfill it).
  const copy = JSON.parse(JSON.stringify(value)) as T & { root: LexicalNode }

  // Every text run in reading order, positioned in one flattened string so a
  // word split across runs ("Site" + "*map*") is still found as one word.
  const leaves: Leaf[] = []
  let flat = ''
  const walk = (parent: LexicalNode) => {
    for (const child of parent.children ?? []) {
      if (child.type === 'text' && typeof child.text === 'string') {
        const format = typeof child.format === 'number' ? child.format : 0
        child.format = format & ~(IS_BOLD | IS_ITALIC)
        leaves.push({
          node: child,
          siblings: parent.children!,
          start: flat.length,
          end: flat.length + child.text.length,
        })
        flat += child.text
      } else if (child.type === 'linebreak' || child.type === 'tab') {
        flat += ' '
      } else if (Array.isArray(child.children)) {
        walk(child)
        if (!INLINE_ELEMENTS.has(child.type ?? '')) flat += ' '
      }
    }
  }
  walk(copy.root)

  const end = flat.trimEnd().length
  const start = flat.slice(0, end).search(/\S+$/)
  if (start < 0) return copy

  // Split each run the last word touches into before / word / after, and
  // italicise only the word part. Reverse order keeps earlier runs' places in
  // their sibling arrays valid while later ones are spliced.
  for (const leaf of [...leaves].reverse()) {
    const from = Math.max(start, leaf.start)
    const to = Math.min(end, leaf.end)
    if (from >= to) continue
    const text = leaf.node.text as string
    const format = leaf.node.format as number
    const parts = [
      { text: text.slice(0, from - leaf.start), format },
      { text: text.slice(from - leaf.start, to - leaf.start), format: format | IS_ITALIC },
      { text: text.slice(to - leaf.start), format },
    ]
    leaf.siblings.splice(
      leaf.siblings.indexOf(leaf.node),
      1,
      ...parts.filter((part) => part.text).map((part) => ({ ...leaf.node, ...part })),
    )
  }

  // Rejoin neighbouring runs that now look the same, so a word that spanned
  // two runs renders as one <em>Sitemap</em>, not <em>Site</em><em>map</em>.
  const merge = (parent: LexicalNode) => {
    const children = parent.children
    if (!children) return
    for (let i = children.length - 1; i > 0; i--) {
      const [prev, next] = [children[i - 1], children[i]]
      if (prev.type === 'text' && next.type === 'text' && sameLook(prev, next)) {
        prev.text = `${prev.text ?? ''}${next.text ?? ''}`
        children.splice(i, 1)
      }
    }
    children.forEach(merge)
  }
  merge(copy.root)
  return copy
}

// Same props apart from the text itself (format, style, mode, detail...).
const sameLook = (a: LexicalNode, b: LexicalNode): boolean => {
  const { text: _a, ...restA } = a
  const { text: _b, ...restB } = b
  return JSON.stringify(restA) === JSON.stringify(restB)
}
