import { describe, expect, it } from "vitest"
import { findBestPrimerDimerAlignment } from "../primer-dimer"

describe("primer dimer complementarity", () => {
  it("does not treat a homopolymer as its own complement", () => {
    const result = findBestPrimerDimerAlignment("AAAAAA", "AAAAAA")
    expect(result.pairCount).toBe(0)
    expect(result.complementarity).toBe(0)
  })

  it("finds a fully complementary pair without exceeding 100 percent", () => {
    const result = findBestPrimerDimerAlignment("AAAAAA", "TTTTTT")
    expect(result.pairCount).toBe(6)
    expect(result.complementarity).toBe(100)
    expect(result.longestRun).toBe(6)
  })

  it("reverses the second primer before antiparallel comparison", () => {
    const result = findBestPrimerDimerAlignment("ATG", "CAT")
    expect(result.pairCount).toBe(3)
    expect(result.primer1ThreePrimeRun).toBe(3)
    expect(result.primer2ThreePrimeRun).toBe(3)
  })

  it("counts a 3′ run only when the overlap reaches that primer end", () => {
    const result = findBestPrimerDimerAlignment("AAAAAA", "TTT")
    expect(result.pairCount).toBe(3)
    expect(result.primer1ThreePrimeRun).toBe(0)
    expect(result.primer2ThreePrimeRun).toBe(3)
  })
})
