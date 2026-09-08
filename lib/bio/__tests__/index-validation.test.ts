import { describe, expect, it } from "vitest"
import { parseAndValidateIndices, parseIndexInput, resolveIndexMode, validateIndexEntries } from "../index-validation"

describe("index validation modes", () => {
  it("uses combinatorial duplicate semantics for dual indexes", () => {
    const result = parseAndValidateIndices("a AAAA CCCC\nb AAAA GGGG", "combinatorial", 1)
    expect(result.isValid).toBe(true)
    expect(result.issues.some((issue) => issue.type === "duplicate")).toBe(false)
  })

  it("requires each side to be unique in UDI mode", () => {
    const result = parseAndValidateIndices("a AAAA CCCC\nb AAAA GGGG", "udi", 1)
    expect(result.issues.filter((issue) => issue.type === "duplicate")).toHaveLength(1)
    expect(result.isValid).toBe(false)
  })

  it("reports a possible dual-index ambiguity only when both sides are close", () => {
    const result = parseAndValidateIndices("a AAAA CCCC\nb AAAT CCCG", "combinatorial", 1)
    expect(result.issues.some((issue) => issue.type === "similar")).toBe(true)
    const oneSide = parseAndValidateIndices("a AAAA CCCC\nb AAAT TTTT", "combinatorial", 1)
    expect(oneSide.issues.some((issue) => issue.type === "similar")).toBe(false)
  })

  it("rejects malformed rows and resolves the default mode from columns", () => {
    expect(resolveIndexMode("a AAAA\nb CCCC")).toBe("single")
    expect(resolveIndexMode("a AAAA CCCC\nb CCCC GGGG")).toBe("combinatorial")
    expect(() => parseIndexInput("a AAAA\nb CCCC", "combinatorial")).toThrow()
    expect(() => parseIndexInput("a AAAA NNNN", "single")).toThrow()
    expect(() => validateIndexEntries([{ row: 1, name: "a", index1: "AAAA" }], "combinatorial")).toThrow()
  })
})
