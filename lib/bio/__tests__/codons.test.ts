import { describe, expect, it } from "vitest"
import { translateDna, STANDARD_CODE, VERT_MITO_CODE } from "../codons"

describe("translateDna", () => {
  it("translates Met start to M", () => {
    expect(translateDna("ATG")).toBe("M")
  })
  it("translates a known short ORF", () => {
    // ATG GCT TAA → MA*
    expect(translateDna("ATGGCTTAA")).toBe("MA*")
  })
  it("U is treated as T", () => {
    expect(translateDna("AUG")).toBe("M")
  })
  it("drops trailing partial codon", () => {
    expect(translateDna("ATGA")).toBe("M")
  })
  it("vertebrate mito: TGA = W", () => {
    expect(translateDna("TGA", VERT_MITO_CODE)).toBe("W")
    expect(translateDna("TGA", STANDARD_CODE)).toBe("*")
  })
  it("unknown codon becomes X", () => {
    expect(translateDna("NNN")).toBe("X")
  })
})
