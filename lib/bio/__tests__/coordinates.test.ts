import { describe, expect, it } from "vitest"
import {
  findAllMatches,
  locateForwardPrimer,
  locateReversePrimer,
  locatePrimer,
  computeAmplicon,
} from "../coordinates"

// 示例模板（19 bp），基因组起始坐标 1000
//   F 区 = ATCGATCG (index 0-7)  中间 = AAA (8-10)  R 结合区 = CTTGTAAC (11-18)
const TEMPLATE = "ATCGATCGAAACTTGTAAC"
const G = 1000

describe("findAllMatches", () => {
  it("finds all occurrences including tandem repeats", () => {
    // ATCG 重复 3 次
    expect(findAllMatches("ATCGATCGATCG", "ATCG")).toEqual([0, 4, 8])
  })
  it("returns single index for unique match", () => {
    expect(findAllMatches(TEMPLATE, "ATCGATCG")).toEqual([0])
  })
  it("returns empty when not found", () => {
    expect(findAllMatches("AAAAAAAA", "TTTT")).toEqual([])
  })
  it("returns empty for empty/oversized query", () => {
    expect(findAllMatches("ACGT", "")).toEqual([])
    expect(findAllMatches("ACGT", "ACGTA")).toEqual([])
  })
})

describe("locateForwardPrimer", () => {
  it("maps template position to genomic coordinates (1-based inclusive)", () => {
    const hits = locateForwardPrimer(TEMPLATE, "ATCGATCG", { genomicStart: G })
    expect(hits).toHaveLength(1)
    const h = hits[0]
    expect(h.index).toBe(0)
    expect(h.templateStart).toBe(1)
    expect(h.templateEnd).toBe(8)
    expect(h.genomicStart).toBe(1000)
    expect(h.genomicEnd).toBe(1007)
    expect(h.strand).toBe("+")
    expect(h.fivePrimeGenomic).toBe(1000) // +链 5' 在低坐标
    expect(h.threePrimeGenomic).toBe(1007) // +链 3' 在高坐标
    expect(h.matchedSequence).toBe("ATCGATCG")
    expect(h.length).toBe(8)
  })

  it("reports multiple hits with correct offsets", () => {
    const hits = locateForwardPrimer("ATCGATCGATCG", "ATCG", { genomicStart: 1 })
    expect(hits.map((h) => h.genomicStart)).toEqual([1, 5, 9])
    expect(hits.map((h) => h.genomicEnd)).toEqual([4, 8, 12])
  })

  it("defaults genomicStart to 1", () => {
    const hits = locateForwardPrimer("ACGT", "ACGT")
    expect(hits[0].genomicStart).toBe(1)
    expect(hits[0].genomicEnd).toBe(4)
  })
})

describe("locateReversePrimer", () => {
  it("locates binding region via reverse complement of the primer", () => {
    // R 引物 5'->3' = GTTACAAG；其 RC = CTTGTAAC，位于模板 index 11
    const hits = locateReversePrimer(TEMPLATE, "GTTACAAG", { genomicStart: G })
    expect(hits).toHaveLength(1)
    const h = hits[0]
    expect(h.index).toBe(11)
    expect(h.templateStart).toBe(12)
    expect(h.templateEnd).toBe(19)
    expect(h.genomicStart).toBe(1011)
    expect(h.genomicEnd).toBe(1018)
    expect(h.strand).toBe("-")
    expect(h.fivePrimeGenomic).toBe(1018) // -链 5' 在高坐标
    expect(h.threePrimeGenomic).toBe(1011) // -链 3' 在低坐标
    expect(h.matchedSequence).toBe("CTTGTAAC") // 模板正链方向
    expect(h.length).toBe(8)
  })

  it("returns empty when RC not present", () => {
    expect(locateReversePrimer("AAAAAAAA", "CGCG")).toEqual([])
  })
})

describe("locatePrimer (orientation fallback)", () => {
  it("uses expected strand when it matches", () => {
    const loc = locatePrimer(TEMPLATE, "ATCGATCG", "+", G)
    expect(loc.strand).toBe("+")
    expect(loc.expectedStrand).toBe("+")
    expect(loc.orientationMatches).toBe(true)
    expect(loc.hits).toHaveLength(1)
  })

  it("falls back to reverse search when forward primer entered as its RC", () => {
    // F 期望为 +，但用户粘成了 RC("ATCGATCG") = "CGATCGAT"（正链里没有）
    // 回退到反向搜索：RC("CGATCGAT") = "ATCGATCG" 命中 index 0
    const loc = locatePrimer(TEMPLATE, "CGATCGAT", "+", G)
    expect(loc.hits).toHaveLength(1)
    expect(loc.strand).toBe("-")
    expect(loc.orientationMatches).toBe(false)
    expect(loc.hits[0].genomicStart).toBe(1000)
    expect(loc.hits[0].genomicEnd).toBe(1007)
  })

  it("falls back to forward search when reverse primer entered as top-strand sequence", () => {
    // R 期望为 -，但用户直接粘了正链序列 "CTTGTAAC"（而非其 RC "GTTACAAG"）
    const loc = locatePrimer(TEMPLATE, "CTTGTAAC", "-", G)
    expect(loc.hits).toHaveLength(1)
    expect(loc.strand).toBe("+")
    expect(loc.orientationMatches).toBe(false)
    expect(loc.hits[0].genomicStart).toBe(1011)
  })

  it("returns empty hits with orientationMatches=true when nothing matches", () => {
    const loc = locatePrimer(TEMPLATE, "GGGGGGGG", "+", G)
    expect(loc.hits).toEqual([])
    expect(loc.orientationMatches).toBe(true)
  })
})

describe("computeAmplicon", () => {
  const fHit = locateForwardPrimer(TEMPLATE, "ATCGATCG", { genomicStart: G })[0]
  const rHit = locateReversePrimer(TEMPLATE, "GTTACAAG", { genomicStart: G })[0]

  it("computes span from F start to R end", () => {
    const amp = computeAmplicon(fHit, rHit)
    expect(amp.genomicStart).toBe(1000)
    expect(amp.genomicEnd).toBe(1018)
    expect(amp.size).toBe(19)
    expect(amp.valid).toBe(true)
    expect(amp.reason).toBeUndefined()
  })

  it("flags overlap as invalid", () => {
    // F 1000-1010, R 1005-1012 -> 重叠
    const f = { ...fHit, genomicEnd: 1010 }
    const r = { ...rHit, genomicStart: 1005, genomicEnd: 1012 }
    const amp = computeAmplicon(f, r)
    expect(amp.valid).toBe(false)
    expect(amp.reason).toBe("overlap")
  })

  it("flags wrong order (R upstream of F) as invalid", () => {
    // R 在 F 上游
    const amp = computeAmplicon(rHit, fHit)
    expect(amp.valid).toBe(false)
    expect(amp.reason).toBe("order")
  })
})
