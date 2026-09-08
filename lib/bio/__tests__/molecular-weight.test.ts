import { describe, expect, it } from "vitest"
import { nucleicAcidMolecularWeight, proteinMolecularWeight } from "../molecular-weight"

describe("molecular weights", () => {
  it("uses one water loss per peptide bond", () => {
    expect(proteinMolecularWeight("AA")).toBeCloseTo(160.17, 2)
    expect(proteinMolecularWeight("MM")).toBeCloseTo(280.41, 2)
    expect(proteinMolecularWeight("AA*")).toBeCloseTo(proteinMolecularWeight("AA"), 6)
  })

  it("rejects unknown protein residues", () => {
    expect(() => proteinMolecularWeight("AXA")).toThrow()
    expect(() => proteinMolecularWeight("AA*AA")).toThrow()
  })

  it("uses the documented OH-terminated oligonucleotide convention", () => {
    expect(nucleicAcidMolecularWeight("A", "dna")).toBeCloseTo(251.23, 1)
    expect(nucleicAcidMolecularWeight("A", "rna")).toBeCloseTo(267.23, 1)
    expect(() => nucleicAcidMolecularWeight("AN", "dna")).toThrow()
  })
})
