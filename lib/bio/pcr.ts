import { reverseComplement } from "./sequence"

export interface PcrTemplate {
  name: string
  sequence: string
}

export interface PcrPrimerPair {
  id: string
  forwardName: string
  forwardSequence: string
  reverseName: string
  reverseSequence: string
}

export interface PcrPrimerMatch {
  position: number
  strand: "forward" | "reverse"
  mismatches: number
  sequence: string
  matchedSequence: string
}

export interface PcrProduct {
  startPos: number
  endPos: number
  size: number
  forwardMatch: PcrPrimerMatch
  reverseMatch: PcrPrimerMatch
  specificity: "specific" | "multiple" | "none"
}

export interface PcrResult {
  id: string
  templateName: string
  primerPairId: string
  forwardPrimer: string
  reversePrimer: string
  forwardPrimerName: string
  reversePrimerName: string
  forwardMatches: PcrPrimerMatch[]
  reverseMatches: PcrPrimerMatch[]
  products: PcrProduct[]
  skippedUnknown: number
  specificity: "high" | "medium" | "low" | "none"
}

function normalizePrimer(primer: string): string {
  const normalized = primer.toUpperCase().replace(/\s+/g, "")
  if (!normalized || !/^[ACGT]+$/.test(normalized)) {
    throw new TypeError("primers must contain only A, C, G and T")
  }
  return normalized
}

function countMismatches(left: string, right: string): number {
  if (left.length !== right.length) return Math.abs(left.length - right.length)
  let mismatches = 0
  for (let index = 0; index < left.length; index++) if (left[index] !== right[index]) mismatches++
  return mismatches
}

/**
 * Find forward and reverse-primer binding windows.  A candidate window that
 * contains N or an IUPAC symbol is skipped because it is not a determined
 * binding event; the count is returned for the UI diagnostic.
 */
export function findPcrPrimerMatches(
  rawTemplate: string,
  rawPrimer: string,
  maxMismatches = 2,
): { matches: PcrPrimerMatch[]; skippedUnknown: number } {
  const template = rawTemplate.toUpperCase().replace(/\s+/g, "")
  if (!template || !/^[ACGTRYSWKMBDHVN]+$/.test(template)) {
    throw new TypeError("template must contain DNA/IUPAC symbols")
  }
  if (!Number.isInteger(maxMismatches) || maxMismatches < 0) throw new RangeError("max mismatches must be non-negative")
  const primer = normalizePrimer(rawPrimer)
  const matches: PcrPrimerMatch[] = []
  let skippedUnknown = 0
  const orientedPrimers: Array<{ sequence: string; strand: "forward" | "reverse" }> = [
    { sequence: primer, strand: "forward" },
    { sequence: reverseComplement(primer), strand: "reverse" },
  ]
  for (let index = 0; index <= template.length - primer.length; index++) {
    const target = template.slice(index, index + primer.length)
    if (!/^[ACGT]+$/.test(target)) {
      skippedUnknown++
      continue
    }
    for (const oriented of orientedPrimers) {
      const mismatches = countMismatches(oriented.sequence, target)
      if (mismatches <= maxMismatches) {
        matches.push({
          position: index + 1,
          strand: oriented.strand,
          mismatches,
          sequence: primer,
          matchedSequence: target,
        })
      }
    }
  }
  matches.sort((left, right) => left.mismatches - right.mismatches || left.position - right.position || (left.strand === "forward" ? -1 : 1))
  return { matches, skippedUnknown }
}

/** Calculate every non-overlapping F/R product for one template and primer pair. */
export function calculatePcrProducts(
  template: PcrTemplate,
  primerPair: PcrPrimerPair,
  maxMismatches = 2,
): PcrResult {
  const forwardPrimer = normalizePrimer(primerPair.forwardSequence)
  const reversePrimer = normalizePrimer(primerPair.reverseSequence)
  const forward = findPcrPrimerMatches(template.sequence, forwardPrimer, maxMismatches)
  const reverse = findPcrPrimerMatches(template.sequence, reversePrimer, maxMismatches)
  const products: PcrProduct[] = []
  for (const forwardMatch of forward.matches) {
    if (forwardMatch.strand !== "forward") continue
    const forwardEnd = forwardMatch.position + forwardPrimer.length - 1
    for (const reverseMatch of reverse.matches) {
      if (reverseMatch.strand !== "reverse" || reverseMatch.position <= forwardEnd) continue
      const endPos = reverseMatch.position + reversePrimer.length - 1
      products.push({
        startPos: forwardMatch.position,
        endPos,
        size: endPos - forwardMatch.position + 1,
        forwardMatch,
        reverseMatch,
        specificity: "specific",
      })
    }
  }
  products.sort((left, right) => left.size - right.size || left.startPos - right.startPos)
  const specificity: PcrResult["specificity"] = products.length === 0
    ? "none"
    : products.length === 1 && products[0].forwardMatch.mismatches === 0 && products[0].reverseMatch.mismatches === 0
      ? "high"
      : products.length === 1
        ? "medium"
        : "low"
  products.forEach((product) => {
    product.specificity = products.length > 1 || product.forwardMatch.mismatches > 0 || product.reverseMatch.mismatches > 0 ? "multiple" : "specific"
  })
  return {
    id: `${template.name}-${primerPair.id}`,
    templateName: template.name,
    primerPairId: primerPair.id,
    forwardPrimer,
    reversePrimer,
    forwardPrimerName: primerPair.forwardName,
    reversePrimerName: primerPair.reverseName,
    forwardMatches: forward.matches,
    reverseMatches: reverse.matches,
    products,
    skippedUnknown: forward.skippedUnknown + reverse.skippedUnknown,
    specificity,
  }
}
