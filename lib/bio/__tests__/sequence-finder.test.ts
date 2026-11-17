import { describe, expect, it } from "vitest"
import {
  SEQUENCE_FINDER_MIN_QUERY_LENGTH,
  findSequenceMatches,
  normalizeSequenceFinderQuery,
} from "../sequence-finder"

// 示例：查询 AGCTTGAC 的四种形式各出现一次，正向形式额外出现第二次。
// 坐标 1-based inclusive：
//   forward 5-12, 53-60 | reverse 17-24 | complement 29-36 | reverse-complement 41-48
const TEMPLATE =
  "TTTTAGCTTGACAAAACAGTTCGACCCCTCGAACTGGGGGGTCAAGCTTTTTAGCTTGACGGGGCCCCAA"
const QUERY = "AGCTTGAC"

describe("normalizeSequenceFinderQuery", () => {
  it("removes whitespace and uppercases the query", () => {
    expect(normalizeSequenceFinderQuery("  agct tgac\n")).toBe("AGCTTGAC")
  })

  it("enforces the 8 bp minimum", () => {
    expect(SEQUENCE_FINDER_MIN_QUERY_LENGTH).toBe(8)
    expect(() => normalizeSequenceFinderQuery("ACGTTGC")).toThrow(RangeError)
  })

  it("rejects empty and non-ACGT queries", () => {
    expect(() => normalizeSequenceFinderQuery("   ")).toThrow(RangeError)
    expect(() => normalizeSequenceFinderQuery("ACGTNCGT")).toThrow(TypeError)
    expect(() => normalizeSequenceFinderQuery("ACGTacgu")).toThrow(TypeError)
  })
})

describe("findSequenceMatches", () => {
  it("finds all four forms and maps 1-based inclusive coordinates", () => {
    const result = findSequenceMatches(TEMPLATE, QUERY)

    expect(result.query).toBe(QUERY)
    expect(result.counts).toEqual({
      forward: 2,
      reverse: 1,
      complement: 1,
      "reverse-complement": 1,
    })
    expect(result.matches).toHaveLength(5)

    const byType = (type: string) =>
      result.matches.filter((match) => match.type === type).map(({ start, end }) => ({ start, end }))

    expect(byType("forward")).toEqual([
      { start: 5, end: 12 },
      { start: 53, end: 60 },
    ])
    expect(byType("reverse")).toEqual([{ start: 17, end: 24 }])
    expect(byType("complement")).toEqual([{ start: 29, end: 36 }])
    expect(byType("reverse-complement")).toEqual([{ start: 41, end: 48 }])
  })

  it("reports overlapping occurrences and duplicated forms for self-complementary queries", () => {
    const result = findSequenceMatches("AAAAAAAAAA", "AAAAAAAA")

    expect(result.matches).toHaveLength(6)
    expect(result.counts.forward).toBe(3)
    expect(result.counts.reverse).toBe(3)
    expect(result.counts.complement).toBe(0)
    expect(result.counts["reverse-complement"]).toBe(0)
    expect(result.matches.filter((m) => m.type === "forward").map((m) => m.index)).toEqual([0, 1, 2])
  })

  it("keeps forward and reverse-complement hits at the same position for a palindrome", () => {
    const result = findSequenceMatches("ACGTACGT", "ACGTACGT")
    const hitsAtZero = result.matches.filter((match) => match.index === 0)

    expect(hitsAtZero.map((match) => match.type)).toEqual(["forward", "reverse-complement"])
    expect(hitsAtZero.every((match) => match.start === 1 && match.end === 8)).toBe(true)
  })

  it("is case-insensitive and ignores whitespace in the template", () => {
    const result = findSequenceMatches("acgt acgt", "ACGTACGT")

    expect(result.counts.forward).toBe(1)
    expect(result.matches[0]).toMatchObject({
      index: 0,
      start: 1,
      end: 8,
      matchedSequence: "ACGTACGT",
    })
  })

  it("returns no matches when the query is longer than the template", () => {
    const result = findSequenceMatches("ACGT", "ACGTACGT")

    expect(result.matches).toEqual([])
    expect(result.counts).toEqual({
      forward: 0,
      reverse: 0,
      complement: 0,
      "reverse-complement": 0,
    })
  })
})
