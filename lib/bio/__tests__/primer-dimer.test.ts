import { describe, expect, it } from "vitest"
import {
  analyzePrimerDimerPair,
  findBestPrimerDimerAlignment,
  formatPrimerDimerAlignment,
  splitPrimerLine,
} from "../primer-dimer"
import { complement, reverse } from "../sequence"

function expectDiagram(diagram: string, primer1: string, primer2: string) {
  const lines = diagram.split("\n")
  expect(lines).toHaveLength(3)
  expect(lines[0].startsWith("5'-")).toBe(true)
  expect(lines[0].endsWith("-3'")).toBe(true)
  expect(lines[2].startsWith("3'-")).toBe(true)
  expect(lines[2].endsWith("-5'")).toBe(true)
  expect(lines[1].startsWith("   ")).toBe(true)
  const top = lines[0].slice(3, -3)
  const bottom = lines[2].slice(3, -3)
  const match = lines[1].slice(3)
  expect(top.replace(/ /g, "")).toBe(primer1)
  expect(bottom.replace(/ /g, "")).toBe(reverse(primer2))
  const width = Math.max(top.length, bottom.length, match.length)
  let bars = 0
  for (let index = 0; index < width; index++) {
    if ((match[index] ?? " ") !== "|") continue
    bars++
    expect(top[index]).toBe(complement(bottom[index] ?? ""))
  }
  expect(bars).toBeGreaterThan(0)
}

describe("primer dimer complementarity", () => {
  it("does not treat a homopolymer as its own complement", () => {
    const report = analyzePrimerDimerPair("AAAAAA", "AAAAAA")
    expect(report.duplex.pairCount).toBe(0)
    expect(report.duplex.overlapIdentity).toBe(0)
    expect(report.threePrime).toBeNull()
  })

  it("finds a fully complementary pair without exceeding 100 percent", () => {
    const result = findBestPrimerDimerAlignment("AAAAAA", "TTTTTT")
    expect(result.pairCount).toBe(6)
    expect(result.overlapIdentity).toBe(100)
    expect(result.longestRun).toBe(6)
    expect(result.primer1ThreePrimeRun).toBe(6)
    expect(result.primer2ThreePrimeRun).toBe(6)
    expectDiagram(formatPrimerDimerAlignment(result), "AAAAAA", "TTTTTT")
  })

  it("reverses the second primer before antiparallel comparison", () => {
    const result = findBestPrimerDimerAlignment("ATG", "CAT")
    expect(result.pairCount).toBe(3)
    expect(result.primer1ThreePrimeRun).toBe(3)
    expect(result.primer2ThreePrimeRun).toBe(3)
  })

  it("counts a 3′ run only when the overlap reaches that primer end", () => {
    const result = findBestPrimerDimerAlignment("GGGGAAAA", "CCCC")
    expect(result.pairCount).toBe(4)
    expect(result.overlapIdentity).toBe(100)
    expect(result.primer1ThreePrimeRun).toBe(0)
    expect(result.primer2ThreePrimeRun).toBe(4)
    expect(result.primer2ThreePrimeGc).toBe(4)
    expectDiagram(formatPrimerDimerAlignment(result), "GGGGAAAA", "CCCC")
  })

  it("prefers the register where both 3′ ends are paired when pair counts tie", () => {
    const report = analyzePrimerDimerPair("AAAAAA", "TTT")
    expect(report.duplex.offset).toBe(3)
    expect(report.duplex.pairCount).toBe(3)
    expect(report.duplex.overlapIdentity).toBe(100)
    expect(report.duplex.primer1ThreePrimeRun).toBe(3)
    expect(report.duplex.primer2ThreePrimeRun).toBe(3)
    expect(report.duplex.primer1ThreePrimeGc).toBe(0)
    expect(report.threePrime?.offset).toBe(report.duplex.offset)
    expect(formatPrimerDimerAlignment(report.duplex)).toBe("5'-AAAAAA-3'\n      |||\n3'-   TTT-5'")
  })

  it("keeps a 3′ alignment and a longer internal duplex separately", () => {
    const report = analyzePrimerDimerPair("AAAAAAAACCCCCCCCAAAAAAAT", "GGGGGGGGAAAAAAAA")
    expect(report.threePrime).not.toBeNull()
    expect(report.threePrime?.offset).not.toBe(report.duplex.offset)
    expect(report.threePrime?.pairCount).toBe(1)
    expect(report.threePrime?.primer1ThreePrimeRun).toBe(1)
    expect(report.threePrime?.primer2ThreePrimeRun).toBe(1)
    expect(report.duplex.pairCount).toBe(8)
    expect(report.duplex.longestRun).toBe(8)
    expect(report.duplex.primer1ThreePrimeRun).toBe(0)
    expect(report.duplex.primer2ThreePrimeRun).toBe(0)
    expectDiagram(formatPrimerDimerAlignment(report.duplex), "AAAAAAAACCCCCCCCAAAAAAAT", "GGGGGGGGAAAAAAAA")
    expectDiagram(formatPrimerDimerAlignment(report.threePrime!), "AAAAAAAACCCCCCCCAAAAAAAT", "GGGGGGGGAAAAAAAA")
  })

  it("aligns a shifted pair on complementary columns", () => {
    const report = analyzePrimerDimerPair("ATCGATCGATCG", "GATCGATCGATC")
    expect(report.threePrime?.offset).not.toBe(report.duplex.offset)
    expectDiagram(formatPrimerDimerAlignment(report.duplex), "ATCGATCGATCG", "GATCGATCGATC")
    expectDiagram(formatPrimerDimerAlignment(report.threePrime!), "ATCGATCGATCG", "GATCGATCGATC")
  })

  it("keeps the example pair's 4 bp 3′ GC stack", () => {
    const report = analyzePrimerDimerPair("ATCGATCGATCGATCGGGGG", "CCCCATGCTAGCTAGCTAGC")
    expect(report.threePrime).toMatchObject({
      primer1ThreePrimeRun: 4,
      primer2ThreePrimeRun: 0,
      primer1ThreePrimeGc: 4,
      primer2ThreePrimeGc: 0,
    })
    expect(report.duplex.pairCount).toBeGreaterThan(report.threePrime?.pairCount ?? 0)
  })

  it("reports six G·T wobble pairs as no Watson–Crick duplex", () => {
    const report = analyzePrimerDimerPair("GGGGGG", "TTTTTT")
    expect(report.duplex.pairCount).toBe(0)
    expect(report.threePrime).toBeNull()
  })

  it("normalizes case and whitespace before aligning", () => {
    const result = findBestPrimerDimerAlignment("at gc", "gc at")
    expect(result.pairCount).toBe(4)
    expect(result.overlapIdentity).toBe(100)
  })

  it("rejects empty primers and non-ACGT bases", () => {
    expect(() => analyzePrimerDimerPair("", "A")).toThrow(RangeError)
    expect(() => analyzePrimerDimerPair("A", "   ")).toThrow(RangeError)
    expect(() => analyzePrimerDimerPair("ACGN", "ACGT")).toThrow(TypeError)
  })
})

describe("splitPrimerLine", () => {
  it("keeps a spaced ACGT line as one sequence", () => {
    expect(splitPrimerLine("ATCG ATCG")).toEqual({ name: null, sequence: "ATCGATCG" })
  })

  it("takes the name from the tokens before a terminal sequence", () => {
    expect(splitPrimerLine("Forward ATCGATCG")).toEqual({ name: "Forward", sequence: "ATCGATCG" })
    expect(splitPrimerLine("My primer ATGC")).toEqual({ name: "My primer", sequence: "ATGC" })
    expect(splitPrimerLine("Forward ATCX")).toEqual({ name: "Forward", sequence: "ATCX" })
  })
})
