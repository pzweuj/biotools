import { describe, expect, it } from "vitest"
import { convertAminoAcidVariant } from "../amino-acid-converter"

describe("amino-acid variant conversion", () => {
  it("converts every residue in a deleted sequence", () => {
    expect(
      convertAminoAcidVariant("p.E746_A750delELREA", "toThree", "Ter"),
    ).toBe("p.Glu746_Ala750delGluLeuArgGluAla")
  })

  it("matches delins before del", () => {
    expect(
      convertAminoAcidVariant("p.L858_E861delinsD", "toThree", "Ter"),
    ).toBe("p.Leu858_Glu861delinsAsp")
  })

  it("preserves single-residue substitutions", () => {
    expect(
      convertAminoAcidVariant("p.L858R", "toThree", "Ter"),
    ).toBe("p.Leu858Arg")
  })
})
