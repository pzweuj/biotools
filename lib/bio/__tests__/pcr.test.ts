import { describe, expect, it } from "vitest"
import { calculatePcrProducts, findPcrPrimerMatches } from "../pcr"

describe("PCR binding scans", () => {
  it("reports products from forward and reverse primer binding sites", () => {
    const result = calculatePcrProducts(
      { name: "template", sequence: "AAAACCCCGGGGTTTT" },
      { id: "1", forwardName: "F", forwardSequence: "AAAA", reverseName: "R", reverseSequence: "AAAA" },
      0,
    )
    expect(result.products[0].size).toBe(16)
    expect(result.specificity).toBe("high")
  })

  it("skips binding windows containing unknown or IUPAC symbols", () => {
    const result = findPcrPrimerMatches("AAAA NAAA", "AAAA", 0)
    expect(result.matches.every((match) => /^[ACGT]+$/.test(match.matchedSequence))).toBe(true)
    expect(result.skippedUnknown).toBeGreaterThan(0)
  })

  it("rejects invalid primers instead of treating them as mismatches", () => {
    expect(() => findPcrPrimerMatches("AAAAAA", "AAAN")).toThrow()
  })
})
