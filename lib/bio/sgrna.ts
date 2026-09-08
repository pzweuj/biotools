import { reverseComplement } from "./sequence"

export type SgPamType = "NGG" | "NG" | "NRG" | "NNGRRT"

export interface SgRnaCandidate {
  sequence: string
  position: number
  strand: "+" | "-"
  pam: string
}

export interface SgRnaScanResult {
  candidates: SgRnaCandidate[]
  skippedUnknown: number
}

export const SG_PAM_LENGTH: Readonly<Record<SgPamType, number>> = Object.freeze({ NGG: 3, NG: 2, NRG: 3, NNGRRT: 6 })
export const SG_SPACER_LENGTH: Readonly<Record<SgPamType, number>> = Object.freeze({ NGG: 20, NG: 20, NRG: 20, NNGRRT: 24 })

const PAM_PATTERNS: Readonly<Record<SgPamType, string>> = Object.freeze({
  NGG: "NGG",
  NG: "NG",
  NRG: "NRG",
  NNGRRT: "NNGRRT",
})

function patternBaseMatches(base: string, pattern: string): boolean {
  if (pattern === "N") return /^[ACGT]$/.test(base)
  if (pattern === "R") return base === "A" || base === "G"
  return base === pattern
}

function pamMatches(pam: string, type: SgPamType): boolean {
  const pattern = PAM_PATTERNS[type]
  return pam.length === pattern.length && [...pam].every((base, index) => patternBaseMatches(base, pattern[index]))
}

function scanStrand(sequence: string, type: SgPamType, strand: "+" | "-"): { candidates: SgRnaCandidate[]; skippedUnknown: number } {
  const pamLength = SG_PAM_LENGTH[type]
  const spacerLength = SG_SPACER_LENGTH[type]
  const candidates: SgRnaCandidate[] = []
  let skippedUnknown = 0
  for (let pamStart = 0; pamStart <= sequence.length - pamLength; pamStart++) {
    const pam = sequence.slice(pamStart, pamStart + pamLength)
    const spacerStart = pamStart - spacerLength
    if (spacerStart < 0) continue
    const spacer = sequence.slice(spacerStart, pamStart)
    // Ambiguous/IUPAC bases are retained for diagnostics but are never a
    // determined spacer or PAM match. Count the candidate window so the page
    // can explain why a nearby-looking guide was skipped.
    if (![...spacer, ...pam].every((base) => /^[ACGT]$/.test(base))) {
      skippedUnknown++
      continue
    }
    if (!pamMatches(pam, type)) continue
    const position = strand === "+"
      ? spacerStart + 1
      : sequence.length - pamStart + 1
    candidates.push({ sequence: spacer, position, strand, pam })
  }
  return { candidates, skippedUnknown }
}

/** Scan all overlapping PAMs on both strands without treating N as a match. */
export function findSgRnaCandidates(rawSequence: string, type: SgPamType): SgRnaScanResult {
  const sequence = rawSequence.toUpperCase().replace(/\s+/g, "")
  if (!sequence || !/^[ACGTRYSWKMBDHVN]+$/.test(sequence)) {
    throw new TypeError("sgRNA target must contain DNA/IUPAC symbols")
  }
  const minimumLength = SG_SPACER_LENGTH[type] + SG_PAM_LENGTH[type]
  if (sequence.length < minimumLength) return { candidates: [], skippedUnknown: 0 }
  const forward = scanStrand(sequence, type, "+")
  const reverse = scanStrand(reverseComplement(sequence), type, "-")
  return {
    candidates: [...forward.candidates, ...reverse.candidates],
    skippedUnknown: forward.skippedUnknown + reverse.skippedUnknown,
  }
}
