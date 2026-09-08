// Molecular-weight helpers used by the browser tools.
// The protein table contains free amino-acid average masses.  A peptide with
// n residues therefore loses (n - 1) water molecules during condensation.

import { AMINO_ACID_FREE_MASS } from "./codons"

export const WATER_AVERAGE_MASS = 18.01528

export const PROTEIN_FREE_AMINO_ACID_MASS = AMINO_ACID_FREE_MASS

export const DNA_NUCLEOTIDE_MONOPHOSPHATE_MASS: Readonly<Record<string, number>> = Object.freeze({
  A: 331.20, C: 307.20, G: 347.20, T: 322.20,
})

export const RNA_NUCLEOTIDE_MONOPHOSPHATE_MASS: Readonly<Record<string, number>> = Object.freeze({
  A: 347.20, C: 323.20, G: 363.20, U: 324.20,
})

/** Average mass difference between a terminal phosphate and a terminal OH. */
export const PHOSPHATE_TO_HYDROXYL_MASS = 79.96633

/** Average mass of a peptide from free amino-acid masses (Da). */
export function proteinMolecularWeight(sequence: string): number {
  const clean = sequence.toUpperCase().replace(/\s+/g, "")
  if (!clean) throw new RangeError("protein sequence must not be empty")
  const residues = clean.endsWith("*") ? clean.slice(0, -1) : clean
  if (!residues) throw new RangeError("protein sequence must contain at least one residue")
  if (!/^[ACDEFGHIKLMNPQRSTVWY]+$/.test(residues)) {
    throw new TypeError("protein sequence contains an unsupported residue or an internal stop")
  }
  const sum = [...residues].reduce((total, aa) => total + PROTEIN_FREE_AMINO_ACID_MASS[aa], 0)
  return sum - Math.max(0, residues.length - 1) * WATER_AVERAGE_MASS
}

/**
 * Average mass of an unmodified, linear, single-stranded oligonucleotide
 * with 5'OH/3'OH ends.  Monophosphate masses are used for each nucleotide;
 * water is lost at each internucleotide bond and one terminal phosphate is
 * removed to convert the monophosphate sum to OH termini.
 */
export function nucleicAcidMolecularWeight(sequence: string, type: "dna" | "rna"): number {
  const clean = sequence.toUpperCase().replace(/\s+/g, "")
  const table = type === "dna" ? DNA_NUCLEOTIDE_MONOPHOSPHATE_MASS : RNA_NUCLEOTIDE_MONOPHOSPHATE_MASS
  const pattern = type === "dna" ? /^[ACGT]+$/ : /^[ACGU]+$/
  if (!clean || !pattern.test(clean)) {
    throw new TypeError(`invalid ${type.toUpperCase()} sequence`)
  }
  const sum = [...clean].reduce((total, base) => total + table[base], 0)
  return sum - Math.max(0, clean.length - 1) * WATER_AVERAGE_MASS - PHOSPHATE_TO_HYDROXYL_MASS
}
