import { complement, reverse } from "./sequence"

export interface PrimerDimerAlignment {
  primer1Aligned: string
  primer2Aligned: string
  matchString: string
  offset: number
  pairCount: number
  complementarity: number
  longestRun: number
  primer1ThreePrimeRun: number
  primer2ThreePrimeRun: number
  score: [number, number, number, number]
}

function alignmentForOffset(primer1: string, orientedPrimer2: string, offset: number): PrimerDimerAlignment {
  const start1 = Math.max(0, offset)
  const start2 = Math.max(0, -offset)
  const length = Math.min(primer1.length - start1, orientedPrimer2.length - start2)
  let matchString = ""
  let pairCount = 0
  let longestRun = 0
  let currentRun = 0
  for (let i = 0; i < length; i++) {
    const match = primer1[start1 + i] === complement(orientedPrimer2[start2 + i])
    matchString += match ? "|" : " "
    if (match) {
      pairCount++
      currentRun++
      longestRun = Math.max(longestRun, currentRun)
    } else {
      currentRun = 0
    }
  }
  const primer1ThreePrimeRun = (() => {
    // The overlap contributes to primer 1's 3′ end only when it reaches
    // the last base of primer 1.  A matching suffix in a shorter overlap
    // is internal pairing and must not be reported as 3′-end pairing.
    if (start1 + length !== primer1.length) return 0
    let run = 0
    for (let i = length - 1; i >= 0 && matchString[i] === "|"; i--) run++
    return run
  })()
  const primer2ThreePrimeRun = (() => {
    // primer 2 is displayed reversed (3′ -> 5′), so its 3′ end is at the
    // left edge.  The overlap must include that edge before counting it.
    if (start2 !== 0) return 0
    let run = 0
    for (let i = 0; i < length && matchString[i] === "|"; i++) run++
    return run
  })()
  const maxLength = Math.max(primer1.length, orientedPrimer2.length)
  const complementarity = maxLength === 0 ? 0 : (pairCount / maxLength) * 100
  const displayOffset = Math.max(start1, start2)
  return {
    primer1Aligned: " ".repeat(start1) + primer1.slice(start1, start1 + length),
    // The second primer is shown in its antiparallel orientation (3' -> 5').
    primer2Aligned: " ".repeat(start2) + orientedPrimer2.slice(start2, start2 + length),
    matchString: " ".repeat(displayOffset) + matchString,
    offset,
    pairCount,
    complementarity,
    longestRun,
    primer1ThreePrimeRun,
    primer2ThreePrimeRun,
    score: [Math.max(primer1ThreePrimeRun, primer2ThreePrimeRun), longestRun, pairCount, 0],
  }
}

/** Find the strongest Watson–Crick alignment across every relative offset. */
export function findBestPrimerDimerAlignment(rawPrimer1: string, rawPrimer2: string): PrimerDimerAlignment {
  const primer1 = rawPrimer1.toUpperCase().replace(/\s+/g, "")
  const primer2 = rawPrimer2.toUpperCase().replace(/\s+/g, "")
  if (!/^[ACGT]+$/.test(primer1) || !/^[ACGT]+$/.test(primer2)) {
    throw new TypeError("primers must contain only A, C, G and T")
  }
  if (!primer1 || !primer2) throw new RangeError("primers must not be empty")
  // Reverse only the second primer before base-by-base Watson–Crick checks.
  // This keeps the top strand 5' -> 3' and the displayed bottom strand 3' -> 5'.
  const orientedPrimer2 = reverse(primer2)
  const candidates: PrimerDimerAlignment[] = []
  for (let offset = -(orientedPrimer2.length - 1); offset <= primer1.length - 1; offset++) {
    candidates.push(alignmentForOffset(primer1, orientedPrimer2, offset))
  }
  candidates.sort((a, b) => {
    for (let index = 0; index < 3; index++) {
      if (a.score[index] !== b.score[index]) return b.score[index] - a.score[index]
    }
    return a.offset - b.offset
  })
  return candidates[0]
}
