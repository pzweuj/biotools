// SantaLucia/Allawi DNA/DNA nearest-neighbor melting temperature.
//
// The thermodynamic table is Biopython's DNA_NN3 table (Allawi &
// SantaLucia, 1997).  Concentrations are accepted in nM/mM at the public
// boundary and the calculation is kept side-effect free so it can be used by
// the browser UI or a worker.

import { complement, reverseComplement } from "./sequence"

export interface TmNearestNeighborOptions {
  /** Total concentration of both oligonucleotide strands, in nM. */
  oligoConcentrationNM?: number
  /** Combined Na+ and K+ concentration, in mM. */
  monovalentMM?: number
  /** Mg2+ concentration, in mM. */
  magnesiumMM?: number
  /** Total dNTP concentration, in mM. */
  dntpMM?: number
  /** Override automatic self-complementarity detection when supplied. */
  selfComplement?: boolean
}

export const DEFAULT_TM_NEAREST_NEIGHBOR_OPTIONS = {
  oligoConcentrationNM: 250,
  monovalentMM: 50,
  magnesiumMM: 1.5,
  dntpMM: 0.8,
} as const

type ThermodynamicPair = readonly [enthalpyKcal: number, entropyCal: number]

// Biopython Bio.SeqUtils.MeltingTemp.DNA_NN3.
const DNA_NN3: Record<string, ThermodynamicPair> = {
  "AA/TT": [-7.9, -22.2],
  "AT/TA": [-7.2, -20.4],
  "TA/AT": [-7.2, -21.3],
  "CA/GT": [-8.5, -22.7],
  "GT/CA": [-8.4, -22.4],
  "CT/GA": [-7.8, -21.0],
  "GA/CT": [-8.2, -22.2],
  "CG/GC": [-10.6, -27.2],
  "GC/CG": [-9.8, -24.4],
  "GG/CC": [-8.0, -19.9],
}

const INIT_GENERAL: ThermodynamicPair = [0, 0]
const INIT_AT: ThermodynamicPair = [2.3, 4.1]
const INIT_GC: ThermodynamicPair = [0.1, -2.8]
const INIT_5T_A: ThermodynamicPair = [0, 0]
const SYMMETRY: ThermodynamicPair = [0, -1.4]

function addPair(current: ThermodynamicPair, addition: ThermodynamicPair): [number, number] {
  return [current[0] + addition[0], current[1] + addition[1]]
}

function validateOptions(options: Required<Omit<TmNearestNeighborOptions, "selfComplement">>): void {
  const values = [
    ["oligoConcentrationNM", options.oligoConcentrationNM],
    ["monovalentMM", options.monovalentMM],
    ["magnesiumMM", options.magnesiumMM],
    ["dntpMM", options.dntpMM],
  ] as const

  for (const [name, value] of values) {
    if (!Number.isFinite(value)) {
      throw new RangeError(`${name} must be a finite number`)
    }
  }
  if (options.oligoConcentrationNM <= 0) {
    throw new RangeError("oligoConcentrationNM must be greater than zero")
  }
  if (options.monovalentMM < 0 || options.magnesiumMM < 0 || options.dntpMM < 0) {
    throw new RangeError("ion concentrations must not be negative")
  }
}

/** Return whether a sequence equals its reverse complement. */
export function isSelfComplementary(seq: string): boolean {
  return seq === reverseComplement(seq)
}

/**
 * Calculate DNA/DNA Tm using the SantaLucia nearest-neighbor model.
 *
 * `oligoConcentrationNM` is the total concentration of the two strands.  For
 * a non-self-complementary duplex the equilibrium concentration is Ct/4; for
 * a self-complementary duplex it is Ct.  The salt correction follows
 * SantaLucia (1998), with the von Ahsen sodium-equivalent approximation for
 * Mg2+ and dNTPs.
 */
export function tmNearestNeighbor(
  seq: string,
  options: TmNearestNeighborOptions = {},
): number {
  if (typeof seq !== "string") {
    throw new TypeError("sequence must be a string")
  }

  const sequence = seq.toUpperCase()
  if (!/^[ACGT]+$/.test(sequence)) {
    throw new TypeError("sequence must contain only A, C, G and T")
  }
  if (sequence.length < 2) {
    throw new RangeError("sequence must contain at least two bases")
  }

  const merged: Required<Omit<TmNearestNeighborOptions, "selfComplement">> = {
    oligoConcentrationNM: options.oligoConcentrationNM ?? DEFAULT_TM_NEAREST_NEIGHBOR_OPTIONS.oligoConcentrationNM,
    monovalentMM: options.monovalentMM ?? DEFAULT_TM_NEAREST_NEIGHBOR_OPTIONS.monovalentMM,
    magnesiumMM: options.magnesiumMM ?? DEFAULT_TM_NEAREST_NEIGHBOR_OPTIONS.magnesiumMM,
    dntpMM: options.dntpMM ?? DEFAULT_TM_NEAREST_NEIGHBOR_OPTIONS.dntpMM,
  }
  validateOptions(merged)

  const selfComplement = options.selfComplement ?? isSelfComplementary(sequence)
  // The reference implementation uses the complement in 3'→5' orientation,
  // while self-complementarity is detected with the reverse complement.
  const complementaryStrand = complement(sequence)
  let deltaH = INIT_GENERAL[0]
  let deltaS = INIT_GENERAL[1]

  // The initiation terms match Biopython's DNA_NN3 implementation.
  const terminalAT = Number(/[AT]/.test(sequence[0])) + Number(/[AT]/.test(sequence[sequence.length - 1]))
  const terminalGC = 2 - terminalAT
  // DNA_NN3's all-A/T and one-G/C initiation terms are both zero; the
  // terminal A/T and G/C terms below carry the actual end correction.
  const init: ThermodynamicPair = [0, 0]
  ;[deltaH, deltaS] = addPair([deltaH, deltaS], init)
  ;[deltaH, deltaS] = addPair([deltaH, deltaS], [INIT_AT[0] * terminalAT, INIT_AT[1] * terminalAT])
  ;[deltaH, deltaS] = addPair([deltaH, deltaS], [INIT_GC[0] * terminalGC, INIT_GC[1] * terminalGC])

  // DNA_NN3 has zero-valued 5'-T/A terminal terms, but keep the condition
  // explicit so this follows the reference implementation exactly.
  if (sequence.startsWith("T")) {
    ;[deltaH, deltaS] = addPair([deltaH, deltaS], INIT_5T_A)
  }
  if (sequence.endsWith("A")) {
    ;[deltaH, deltaS] = addPair([deltaH, deltaS], INIT_5T_A)
  }

  for (let i = 0; i < sequence.length - 1; i++) {
    const neighbors = `${sequence.slice(i, i + 2)}/${complementaryStrand.slice(i, i + 2)}`
    const reversedNeighbors = neighbors.split("").reverse().join("")
    const pair = DNA_NN3[neighbors] ?? DNA_NN3[reversedNeighbors]
    if (!pair) {
      throw new Error(`no thermodynamic data for neighbors ${neighbors}`)
    }
    ;[deltaH, deltaS] = addPair([deltaH, deltaS], pair)
  }

  if (selfComplement) {
    ;[deltaH, deltaS] = addPair([deltaH, deltaS], SYMMETRY)
  }

  const effectiveMonovalentMM = merged.monovalentMM +
    120 * Math.sqrt(Math.max(merged.magnesiumMM - merged.dntpMM, 0))
  if (!(effectiveMonovalentMM > 0)) {
    throw new RangeError("effective monovalent ion concentration must be greater than zero")
  }

  // SantaLucia salt correction (method 5), with concentrations converted mM→M.
  deltaS += 0.368 * (sequence.length - 1) * Math.log(effectiveMonovalentMM / 1000)

  const equilibriumConcentrationM = (selfComplement
    ? merged.oligoConcentrationNM
    : merged.oligoConcentrationNM / 4) * 1e-9
  const gasConstant = 1.987 // cal / (K mol)
  return (1000 * deltaH) /
    (deltaS + gasConstant * Math.log(equilibriumConcentrationM)) - 273.15
}
