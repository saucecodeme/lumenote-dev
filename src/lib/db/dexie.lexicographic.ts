const ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' // 62 chars
const MIN = ALPHABET[0] // 0
const MAX = ALPHABET[ALPHABET.length - 1] // z
const MIN_INDEX = 0
const MAX_INDEX = ALPHABET.length - 1

const idx = (ch?: string) => (ch ? ALPHABET.indexOf(ch) : -1)

export function midChar(lo: string, hi: string) {
  const m = Math.floor((idx(lo) + idx(hi)) / 2)
  return ALPHABET[m]
}

// Try to nudge the last char of ref by dir (1 or -1), extend if overflow
export function step(ref: string, dir: -1 | 1) {
  const last = ref[ref.length - 1]
  const li = idx(last)
  const ni = li + dir
  if (ni >= 0 && ni < ALPHABET.length) {
    return ref.slice(0, -1) + ALPHABET[ni]
  }
  // overflow -> add new char
  return ref + midChar(MIN, MAX)
}

export function orderBetween(a: string | null, b: string | null) {
  if (a != null && b != null && a >= b) {
    throw new Error('Invalid bounds a>=b')
  }

  // Both null -> center
  if (!a && !b) return midChar(MIN, MAX)
  // only a -> place after a
  // e.g. orderBetween(A1, null) -> A2
  if (a && !b) return step(a, 1)
  // only b -> place before b
  // e.g. orderBetween(null, B2) -> B1
  if (!a && b) return step(b, -1)

  // both present
  let i = 0
  while (true) {
    const ac = a![i] // a char
    const bc = b![i] // b char

    // If equal prefix, keep digging
    if (ac === bc) {
      i++
      continue
    }

    // Case like a=A0 and b=A00
    if (ac === undefined) {
      const bi = idx(bc)
      if (bi <= MIN_INDEX) null
      return a! + ALPHABET[bi - 1]
    }

    if (bc === undefined) {
      const ai = idx(ac)
      if (ai >= MAX_INDEX) return a! + midChar(MIN, MAX)
      return b! + ALPHABET[ai + 1]
    }

    const ai = idx(ac)
    const bi = idx(bc)
    if (bi - ai > 1) {
      const m = ai + Math.floor((bi - ai) / 2)
      return (a as string).slice(0, i) + ALPHABET[m]
    }

    return (a as string).slice(0, i + 1) + midChar(MIN, MAX)
  }
}
