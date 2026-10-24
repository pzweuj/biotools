import { complement, reverse } from "./sequence"

/** Screening cutoffs for highlighting. These are not thermodynamic risk grades. */
export const PRIMER_DIMER_SCREEN = {
  threePrimeRun: 4,
  longestRun: 8,
} as const

export interface PrimerDimerAlignment {
  /** Full primer 1 (5'→3'), with leading spaces when it is shifted right. */
  primer1Aligned: string
  /** Full primer 2 reversed (3'→5'), with leading spaces when it is shifted right. */
  primer2Aligned: string
  /** Same width as the aligned primers. `|` marks a Watson–Crick pair. */
  matchString: string
  offset: number
  overlapLength: number
  pairCount: number
  /** `pairCount / overlapLength`, as a percentage. 0 when the overlap is empty. */
  overlapIdentity: number
  longestRun: number
  primer1ThreePrimeRun: number
  primer2ThreePrimeRun: number
  primer1ThreePrimeGc: number
  primer2ThreePrimeGc: number
}

export interface PrimerDimerPairReport {
  /** Strongest alignment that reaches at least one 3′ end. Null when no such pair exists. */
  threePrime: PrimerDimerAlignment | null
  /** Alignment with the most Watson–Crick pairs. */
  duplex: PrimerDimerAlignment
}

export interface SplitPrimerLine {
  /** Name taken from the tokens before a terminal sequence. Null when the line is only sequence. */
  name: string | null
  sequence: string
}

function normalizePrimer(raw: string): string {
  const primer = raw.toUpperCase().replace(/\s+/g, "")
  if (!primer) throw new RangeError("primers must not be empty")
  if (!/^[ACGT]+$/.test(primer)) throw new TypeError("primers must contain only A, C, G and T")
  return primer
}

function gcCount(sequence: string): number {
  let count = 0
  for (let index = 0; index < sequence.length; index++) {
    const base = sequence[index]
    if (base === "G" || base === "C") count++
  }
  return count
}

function alignmentForOffset(primer1: string, orientedPrimer2: string, offset: number): PrimerDimerAlignment {
  const start1 = Math.max(0, offset)
  const start2 = Math.max(0, -offset)
  const overlapLength = Math.min(primer1.length - start1, orientedPrimer2.length - start2)
  const pad1 = offset > 0 ? 0 : -offset
  const pad2 = offset > 0 ? offset : 0
  const width = Math.max(pad1 + primer1.length, pad2 + orientedPrimer2.length)
  const overlapColumn = Math.max(pad1, pad2)
  const matchChars = Array.from({ length: width }, () => " ")
  let pairCount = 0
  let longestRun = 0
  let currentRun = 0
  for (let index = 0; index < overlapLength; index++) {
    const match = primer1[start1 + index] === complement(orientedPrimer2[start2 + index])
    if (match) {
      matchChars[overlapColumn + index] = "|"
      pairCount++
      currentRun++
      longestRun = Math.max(longestRun, currentRun)
    } else {
      currentRun = 0
    }
  }
  // The overlap contributes to primer 1's 3′ end only when it reaches the
  // last base of primer 1. A matching suffix in a shorter overlap is
  // internal pairing and must not be reported as 3′-end pairing.
  let primer1ThreePrimeRun = 0
  if (start1 + overlapLength === primer1.length) {
    for (let index = overlapLength - 1; index >= 0 && matchChars[overlapColumn + index] === "|"; index--) {
      primer1ThreePrimeRun++
    }
  }
  // Primer 2 is displayed reversed (3′→5′), so its 3′ end is at the left
  // edge. The overlap must include that edge before counting it.
  let primer2ThreePrimeRun = 0
  if (start2 === 0) {
    for (let index = 0; index < overlapLength && matchChars[overlapColumn + index] === "|"; index++) {
      primer2ThreePrimeRun++
    }
  }
  return {
    primer1Aligned: `${" ".repeat(pad1)}${primer1}${" ".repeat(width - pad1 - primer1.length)}`,
    primer2Aligned: `${" ".repeat(pad2)}${orientedPrimer2}${" ".repeat(width - pad2 - orientedPrimer2.length)}`,
    matchString: matchChars.join(""),
    offset,
    overlapLength,
    pairCount,
    overlapIdentity: overlapLength === 0 ? 0 : (pairCount / overlapLength) * 100,
    longestRun,
    primer1ThreePrimeRun,
    primer2ThreePrimeRun,
    primer1ThreePrimeGc: primer1ThreePrimeRun === 0 ? 0 : gcCount(primer1.slice(primer1.length - primer1ThreePrimeRun)),
    primer2ThreePrimeGc: primer2ThreePrimeRun === 0 ? 0 : gcCount(orientedPrimer2.slice(0, primer2ThreePrimeRun)),
  }
}

function threePrimeSum(alignment: PrimerDimerAlignment): number {
  return alignment.primer1ThreePrimeRun + alignment.primer2ThreePrimeRun
}

function threePrimeMax(alignment: PrimerDimerAlignment): number {
  return Math.max(alignment.primer1ThreePrimeRun, alignment.primer2ThreePrimeRun)
}

function pairCountOf(alignment: PrimerDimerAlignment): number {
  return alignment.pairCount
}

function longestRunOf(alignment: PrimerDimerAlignment): number {
  return alignment.longestRun
}

/** Higher metric keys win. Equal keys prefer the smaller absolute offset, then the smaller offset. */
function beats(
  candidate: PrimerDimerAlignment,
  current: PrimerDimerAlignment,
  keys: Array<(alignment: PrimerDimerAlignment) => number>,
): boolean {
  for (const key of keys) {
    const difference = key(candidate) - key(current)
    if (difference !== 0) return difference > 0
  }
  const absolute = Math.abs(candidate.offset) - Math.abs(current.offset)
  if (absolute !== 0) return absolute < 0
  return candidate.offset < current.offset
}

const duplexKeys = [pairCountOf, longestRunOf, threePrimeSum, threePrimeMax]
const threePrimeKeys = [threePrimeSum, threePrimeMax, pairCountOf, longestRunOf]

/** Find the 3′-end alignment and the strongest duplex across every relative offset. */
export function analyzePrimerDimerPair(rawPrimer1: string, rawPrimer2: string): PrimerDimerPairReport {
  const primer1 = normalizePrimer(rawPrimer1)
  const orientedPrimer2 = reverse(normalizePrimer(rawPrimer2))
  let duplex: PrimerDimerAlignment | null = null
  let threePrime: PrimerDimerAlignment | null = null
  for (let offset = -(orientedPrimer2.length - 1); offset <= primer1.length - 1; offset++) {
    const alignment = alignmentForOffset(primer1, orientedPrimer2, offset)
    if (!duplex || beats(alignment, duplex, duplexKeys)) duplex = alignment
    if (threePrimeMax(alignment) > 0 && (!threePrime || beats(alignment, threePrime, threePrimeKeys))) {
      threePrime = alignment
    }
  }
  if (!duplex) throw new RangeError("primers must not be empty")
  return { threePrime, duplex }
}

/** Strongest duplex alignment. Prefer {@link analyzePrimerDimerPair} when the 3′ alignment may differ. */
export function findBestPrimerDimerAlignment(rawPrimer1: string, rawPrimer2: string): PrimerDimerAlignment {
  return analyzePrimerDimerPair(rawPrimer1, rawPrimer2).duplex
}

/**
 * Draw both full primers. The end labels sit outside the monospace columns:
 * `5'-`, `3'-`, and the match-line indent are each three ASCII characters.
 */
export function formatPrimerDimerAlignment(alignment: PrimerDimerAlignment): string {
  const top = alignment.primer1Aligned.trimEnd()
  const bottom = alignment.primer2Aligned.trimEnd()
  const match = alignment.matchString.trimEnd()
  return `5'-${top}-3'\n   ${match}\n3'-${bottom}-5'`
}

/** Split `Name SEQUENCE` from a plain primer line. An all-ACGT line stays one sequence. */
export function splitPrimerLine(line: string): SplitPrimerLine {
  const tokens = line.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return { name: null, sequence: "" }
  if (tokens.length >= 2) {
    const sequence = tokens[tokens.length - 1]
    const nameTokens = tokens.slice(0, -1)
    // A non-sequence name keeps the last token as the sequence, including an
    // invalid base, so the reported position stays inside that sequence.
    if (/^[A-Za-z]+$/.test(sequence) && nameTokens.some((token) => !/^[ACGT]+$/i.test(token))) {
      return { name: nameTokens.join(" "), sequence: sequence.toUpperCase() }
    }
  }
  return { name: null, sequence: tokens.join("").toUpperCase() }
}
