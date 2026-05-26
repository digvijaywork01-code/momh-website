/**
 * Tiny helpers for building serialized Lexical editor states from plain text.
 *
 * Payload stores rich-text fields as Lexical JSON. This module builds those
 * JSON structures programmatically so the MOMH seed script can express
 * headlines like "A Living Archive of *Meenakari*, in the *Heart of Jaipur*"
 * without typing out the full Lexical AST by hand.
 *
 * Lexical's text format flag for italic is 2 (a bitmask: 1=bold, 2=italic,
 * 4=strikethrough, 8=underline, 16=code, 32=subscript, 64=superscript).
 */

const ITALIC_FORMAT = 2

type Run = { text: string; italic?: boolean; bold?: boolean }

const textNode = (run: Run) => {
  let format = 0
  if (run.italic) format |= ITALIC_FORMAT
  if (run.bold) format |= 1
  return {
    type: 'text',
    detail: 0,
    format,
    mode: 'normal',
    style: '',
    text: run.text,
    version: 1,
  }
}

const paragraph = (runs: Run[]) => ({
  type: 'paragraph',
  children: runs.map(textNode),
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  textFormat: 0,
  textStyle: '',
  version: 1,
})

/** Build a Lexical root from one or more paragraphs (each paragraph = an array of text runs). */
export const richText = (...paragraphs: Run[][]) => ({
  root: {
    type: 'root',
    children: paragraphs.map(paragraph),
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})

/**
 * Convenience: build a single-paragraph Lexical state from a template string
 * where * delimits italic runs. Asterisks are not escaped; if you need a
 * literal asterisk, build with `richText([...])` directly.
 *
 * Example:
 *   p('A Living Archive of *Meenakari*, in the *Heart of Jaipur*')
 *   // → paragraph with 4 runs: plain, italic, plain, italic
 */
export const p = (template: string) => {
  const runs: Run[] = []
  const parts = template.split(/(\*[^*]+\*)/g).filter(Boolean)
  for (const part of parts) {
    if (part.startsWith('*') && part.endsWith('*')) {
      runs.push({ text: part.slice(1, -1), italic: true })
    } else {
      runs.push({ text: part })
    }
  }
  return richText(runs)
}

/** Two-paragraph version of `p`. */
export const pp = (a: string, b: string) => {
  const parseLine = (s: string): Run[] =>
    s
      .split(/(\*[^*]+\*)/g)
      .filter(Boolean)
      .map((part) =>
        part.startsWith('*') && part.endsWith('*')
          ? { text: part.slice(1, -1), italic: true }
          : { text: part },
      )
  return richText(parseLine(a), parseLine(b))
}
