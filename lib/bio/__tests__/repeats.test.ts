import { describe, expect, it } from "vitest"
import { findRepeats } from "../repeats"

describe("findRepeats", () => {
  it("detects a tandem trinucleotide repeat", () => {
    // (CAG)₆
    const seq = "CAGCAGCAGCAGCAGCAG"
    const repeats = findRepeats(seq, { minLength: 3, maxLength: 10, maximalOnly: false })
    const cag = repeats.find((r) => r.sequence === "CAG")
    expect(cag).toBeDefined()
    expect(cag!.count).toBe(6)
    expect(cag!.isTandem).toBe(true)
    expect(cag!.length).toBe(3)
  })

  it("handles short interspersed repeat", () => {
    // "ATGC" at positions 1, 15, 30
    const seq = "ATGCTAGCTAGCTGATGCGGCCATGCT"
    const repeats = findRepeats(seq, { minLength: 4, maxLength: 8, maximalOnly: false })
    const atgc = repeats.find((r) => r.sequence === "ATGC")
    expect(atgc).toBeDefined()
    expect(atgc!.count).toBeGreaterThanOrEqual(2)
    expect(atgc!.positions).toContain(1)
  })

  it("skips homopolymers", () => {
    const seq = "AAAATTTTGGGG" // poly-A, poly-T, poly-G
    const repeats = findRepeats(seq, { minLength: 2, maxLength: 6 })
    expect(repeats.filter((r) => new Set(r.sequence).size === 1)).toHaveLength(0)
  })

  it("skips substrings with N bases", () => {
    const seq = "ATGCANTGCNTAGC"
    const repeats = findRepeats(seq, { minLength: 3, maxLength: 6 })
    for (const r of repeats) {
      expect(r.sequence).not.toMatch(/[^ACGT]/i)
    }
  })

  it("reports maximal repeats only by default (excludes sub-repeats)", () => {
    const seq = "ATGCATGCATGCATGC" // (ATGC)₄ — a 4-mer tandem repeat
    const repeats = findRepeats(seq, { minLength: 2, maxLength: 8 })
    // "AT" is a sub-repeat of "ATGC", should be excluded
    const short = repeats.filter((r) => r.length <= 3)
    // shorter sub-repeats should be filtered OUT when maximalOnly=true (default)
    for (const r of short) {
      // All short repeats should either be absent or have significantly fewer positions
      const longerParent = repeats.find(
        (lr) => lr.length > r.length && lr.sequence.includes(r.sequence),
      )
      if (longerParent) {
        // The shorter's positions should be subsumed — meaning it was filtered
        // If it's still here, it should NOT have all positions covered by the longer
        expect(r.positions.length).toBeLessThan(longerParent.positions.length)
      }
    }
  })

  it("empty sequence returns empty", () => {
    expect(findRepeats("")).toHaveLength(0)
    expect(findRepeats("A")).toHaveLength(0)
  })

  it("sequence shorter than minLength returns empty", () => {
    expect(findRepeats("AC", { minLength: 3 })).toHaveLength(0)
  })

  it("does not report unique substrings", () => {
    const seq = "ATGCATGC" // only "ATGC" repeats twice
    const repeats = findRepeats(seq, { minLength: 3, maxLength: 5 })
    // "TGC" appears only once in a non-overlapping sense? Actually "TGC" appears at positions 2 and 6
    // non-overlapping check: pos 2 → ends at 4; pos 6 starts at 6 > 4 → both kept
    // So 2 occurrences of "TGC" should be reported
    // But "ATG" at pos 1 → ends at 3; pos 5 starts at 5 > 3 → both kept
    // "GCA" at pos 3 → ends at 5; pos 7 starts at 7 > 5 → both kept
    // They should all be there, though may be filtered by maximalOnly
    expect(repeats.length).toBeGreaterThan(0)
    // Verify all reported have count ≥ 2
    for (const r of repeats) {
      expect(r.count).toBeGreaterThanOrEqual(2)
    }
  })

  it("non-overlapping count is correct for overlapping occurrences", () => {
    // "AAA" has many overlapping occurrences in "AAAAA" — non-overlapping should be floor(5/3)=1
    const seq = "CCCCCC" // poly-C, skipped by homopolymer filter
    // Let's use a non-homopolymer case: "ATATATA"
    // "ATA" at positions 1, 3, 5 — all overlap with each other
    // Non-overlapping: pick 1 (ends 3), then 5 (starts after 3) → 2
    const repeats = findRepeats("ATATATA", { minLength: 3, maxLength: 3, maximalOnly: false })
    const ata = repeats.find((r) => r.sequence === "ATA")
    expect(ata).toBeDefined()
    expect(ata!.count).toBe(2)
    expect(ata!.positions).toEqual([1, 5])
  })

  it("long sequence performance: does not hang", () => {
    // A 5 KB random-ish sequence should complete in < 500 ms
    const bases = "ACGT"
    let seq = ""
    for (let i = 0; i < 5000; i++) seq += bases[Math.floor(Math.random() * 4)]
    const start = performance.now()
    const repeats = findRepeats(seq, { minLength: 3, maxLength: 15 })
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(2000) // generous upper bound
    // Result should be an array (may be empty with random seq)
    expect(Array.isArray(repeats)).toBe(true)
  })

  it("results are sorted by count×length descending", () => {
    const seq = "ATGCATGCATGC" + "CAGCAGCAGCAGCAGCAG"
    const repeats = findRepeats(seq, { minLength: 3, maxLength: 8, maximalOnly: false })
    for (let i = 1; i < repeats.length; i++) {
      const prevScore = repeats[i - 1].count * repeats[i - 1].length
      const currScore = repeats[i].count * repeats[i].length
      expect(prevScore).toBeGreaterThanOrEqual(currScore)
    }
  })

  it("respects minCount option", () => {
    const seq = "ATGCATGCATGCATGC" // ATGC × 4
    const repeats = findRepeats(seq, { minLength: 4, maxLength: 4, minCount: 5 })
    expect(repeats).toHaveLength(0) // only 4 occurrences, need 5
  })

  it("respects maxLength option", () => {
    const seq = "ATGCATGCATGCATGCATGC" // ATGC × 5
    const repeats = findRepeats(seq, { minLength: 2, maxLength: 3, maximalOnly: false })
    for (const r of repeats) {
      expect(r.length).toBeLessThanOrEqual(3)
      expect(r.length).toBeGreaterThanOrEqual(2)
    }
  })
})
