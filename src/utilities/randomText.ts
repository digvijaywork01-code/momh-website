import { LETTER_PAIR_LOG2 } from './randomTextModel'

/**
 * Spots enquiries filled with random letters, the way the Nov 2026 bots
 * filled the Personal Consultation form: name "Zzdgamua Jaqkn", city
 * "Pnpbxoo", and random letters in the design idea and notes too.
 *
 * Each text answer gets a score: how ordinary its letter pairs are in real
 * words and names (English words, first names, country names, and Indian
 * names, places and enquiry words; see scripts/random-text-model/). Random
 * letters score far lower than real text.
 *
 * One odd-looking answer is never enough: some real names score low on
 * their own (Naqvi, Avni). An enquiry is refused only when at least
 * RANDOM_FIELDS_TO_REFUSE of its answers look random, which bots do and
 * people do not.
 *
 * Tested before shipping (Nov 2026):
 *   - 115 real SS enquiries since June 2026: none had even 2 such answers;
 *   - 50,000 made-up enquiries from Indian names, cities and countries the
 *     table had not seen: none refused;
 *   - bot-style enquiries of 4-11 random letters per answer: 96-99% refused.
 *
 * Plain functions, no imports beyond the table: safe on server and client.
 */

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'
const START = 26
const END = 27

/** An answer scoring below this looks like random letters. */
export const RANDOM_SCORE_LIMIT = -5.75
/** How many random-looking answers it takes to refuse an enquiry. */
export const RANDOM_FIELDS_TO_REFUSE = 3

/**
 * The answer's letter-pair score (average log2 chance per pair, words of 3+
 * letters only), or null when it has fewer than 4 such letters to judge
 * ("NA", "-", a number).
 */
// Links (a pasted Pinterest or Instagram link is mostly random letters by
// design), email addresses and anything else with a dot or slash inside a
// word, such as "pin.it/4kXqZJb2T": not judged at all.
// Tested one word (a run without spaces) at a time, with no open-ended
// repeats, so this test takes time only in step with the answer's length.
// A single pattern over the whole answer, with repeats on both sides, took
// 32 seconds on one 4,000-letter word and held up the server.
const LINK_LIKE_WORD = /[a-z]:\/\/|www\.|@|[\w-]\.[a-z]{2}|\//i

// Only an answer's first 2,000 characters are judged: plenty to tell, and
// it keeps every answer cheap. The tidying step (normalize) slows down
// sharply on one long run of accent marks, so it never sees more.
const JUDGED_LENGTH = 2000

export const randomTextScore = (value: unknown): number | null => {
  if (typeof value !== 'string') return null
  const words = value
    .slice(0, JUDGED_LENGTH)
    .split(/\s+/)
    .filter((word) => !LINK_LIKE_WORD.test(word))
    .join(' ')
    .normalize('NFKD')
    .split(/[^A-Za-z]+/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length >= 3)
  let total = 0
  let pairs = 0
  let letters = 0
  for (const word of words) {
    letters += word.length
    let prev = START
    for (const ch of word) {
      const next = LETTERS.indexOf(ch)
      total += LETTER_PAIR_LOG2[prev][next]
      pairs++
      prev = next
    }
    total += LETTER_PAIR_LOG2[prev][END]
    pairs++
  }
  return letters >= 4 ? total / pairs : null
}

export const looksRandom = (value: unknown): boolean => {
  const score = randomTextScore(value)
  return score !== null && score < RANDOM_SCORE_LIMIT
}

/**
 * The fields, by name, whose answers look random. The caller refuses the
 * enquiry when there are RANDOM_FIELDS_TO_REFUSE or more.
 */
export const randomLookingFields = (
  entries: ReadonlyArray<{ field: string; value: unknown }>,
  fieldNames: ReadonlySet<string>,
): string[] =>
  entries.filter((e) => fieldNames.has(e.field) && looksRandom(e.value)).map((e) => e.field)
