import { describe, expect, it } from "vitest"
import { findSgRnaCandidates } from "../sgrna"

describe("sgRNA PAM scanning", () => {
  it("captures overlapping NGG PAMs", () => {
    const result = findSgRnaCandidates(`${"A".repeat(20)}AGGG`, "NGG")
    expect(result.candidates.filter((candidate) => candidate.strand === "+")).toHaveLength(2)
    expect(result.candidates.filter((candidate) => candidate.strand === "+").map((candidate) => candidate.position)).toEqual([1, 2])
  })

  it("does not use N as a determined PAM or spacer base", () => {
    const result = findSgRnaCandidates(`${"A".repeat(20)}NGG`, "NGG")
    expect(result.candidates).toHaveLength(0)
    expect(result.skippedUnknown).toBeGreaterThan(0)
  })

  it("retains IUPAC input but skips ambiguous candidate windows", () => {
    const result = findSgRnaCandidates(`${"A".repeat(19)}RAGG`, "NGG")
    expect(result.candidates).toHaveLength(0)
    expect(result.skippedUnknown).toBeGreaterThan(0)
  })

  it("reports reverse-strand positions as the positive-strand left coordinate", () => {
    const result = findSgRnaCandidates(`CCT${"T".repeat(20)}`, "NGG")
    const reverse = result.candidates.filter((candidate) => candidate.strand === "-")
    expect(reverse).toHaveLength(1)
    expect(reverse[0].position).toBe(4)
  })

  it("uses the PAM-specific minimum length", () => {
    expect(findSgRnaCandidates("A".repeat(22), "NGG").candidates).toHaveLength(0)
    expect(() => findSgRnaCandidates("ACGT!", "NGG")).toThrow()
  })
})
