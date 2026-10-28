// A page's title can sit on its opening banner (RenderBlocks' introOnBanner).
// The banner then carries only the first sentence of the intro text, and the
// rest stays in the text block below the photo. This splits a rich-text value
// into those two parts, as separate copies: `lead` is the first paragraph up
// to and including its first sentence, `rest` is everything after it (null
// when nothing is left). A sentence ends at . ! or ? (plus any closing quote
// or bracket) followed by a space or the end of the paragraph, so
// "momhindia.org" does not end one. A link is never cut: a sentence that ends
// inside one ends after it. Runs at render time; the stored content is not
// changed.

type LexicalNode = {
  type?: string
  text?: string
  children?: LexicalNode[]
}

const textOf = (node: LexicalNode): string =>
  typeof node.text === 'string' ? node.text : (node.children ?? []).map(textOf).join('')

const hasText = (nodes: LexicalNode[]): boolean => nodes.some((n) => /\S/.test(textOf(n)))

export const splitFirstSentence = <T>(value: T): { lead: T; rest: T | null } => {
  if (!(value as { root?: LexicalNode } | null | undefined)?.root)
    return { lead: value, rest: null }
  // A JSON copy, not structuredClone (see accentLastWord).
  const copy = JSON.parse(JSON.stringify(value)) as T & { root: LexicalNode }
  const blocks = copy.root.children ?? []
  const first = blocks.findIndex((block) => hasText([block]))
  if (first < 0) return { lead: value, rest: null }

  const para = blocks[first]
  const runs = para.children ?? []
  const flat = runs.map(textOf).join('')
  const end = /[.!?]["'’”)\]]*(?=\s|$)/.exec(flat)

  let leadRuns = runs
  let restRuns: LexicalNode[] = []
  if (end) {
    const cut = end.index + end[0].length
    let start = 0
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i]
      const length = textOf(run).length
      if (cut <= start + length) {
        if (run.type === 'text' && typeof run.text === 'string') {
          leadRuns = [...runs.slice(0, i), { ...run, text: run.text.slice(0, cut - start) }]
          restRuns = [{ ...run, text: run.text.slice(cut - start) }, ...runs.slice(i + 1)]
        } else {
          leadRuns = runs.slice(0, i + 1)
          restRuns = runs.slice(i + 1)
        }
        break
      }
      start += length
    }
    // The space after the sentence belongs to neither part.
    const head = restRuns.find((run) => textOf(run).length > 0)
    if (head?.type === 'text' && typeof head.text === 'string') head.text = head.text.trimStart()
    restRuns = restRuns.filter((run) => run.type !== 'text' || (run.text ?? '').length > 0)
  }

  const restBlocks = [
    ...(hasText(restRuns) ? [{ ...para, children: restRuns }] : []),
    ...blocks.slice(first + 1),
  ]
  const lead = { ...copy, root: { ...copy.root, children: [{ ...para, children: leadRuns }] } }
  const rest = hasText(restBlocks)
    ? { ...copy, root: { ...copy.root, children: restBlocks } }
    : null
  return { lead, rest }
}
