export type MassUnit = "g" | "mg" | "μg" | "ng" | "pg"
export type VolumeUnit = "L" | "mL" | "μL" | "nL"

export interface ConcentrationInput {
  mass: number
  massUnit: MassUnit
  volume: number
  volumeUnit: VolumeUnit
  molecularWeight: number
  includeCopies?: boolean
}

export interface ConcentrationResult {
  mass: number
  volume: number
  massInGrams: number
  volumeInLiters: number
  /** Numerically equal to mg/mL and g/L. */
  concentration: number
  molarity: number
  copies: number | null
}

const MASS_TO_GRAMS: Readonly<Record<MassUnit, number>> = Object.freeze({
  g: 1,
  mg: 1e-3,
  μg: 1e-6,
  ng: 1e-9,
  pg: 1e-12,
})

const VOLUME_TO_LITERS: Readonly<Record<VolumeUnit, number>> = Object.freeze({
  L: 1,
  mL: 1e-3,
  μL: 1e-6,
  nL: 1e-9,
})

export const AVOGADRO_CONSTANT = 6.022e23

/** Calculate mass concentration, molarity and (optionally) molecule copies. */
export function calculateConcentration(input: ConcentrationInput): ConcentrationResult | null {
  const { mass, massUnit, volume, volumeUnit, molecularWeight } = input
  if (!Number.isFinite(mass) || mass < 0) return null
  if (!Number.isFinite(volume) || volume <= 0) return null
  if (!Number.isFinite(molecularWeight) || molecularWeight <= 0) return null
  const massInGrams = mass * MASS_TO_GRAMS[massUnit]
  const volumeInLiters = volume * VOLUME_TO_LITERS[volumeUnit]
  if (!Number.isFinite(massInGrams) || !Number.isFinite(volumeInLiters) || volumeInLiters <= 0) return null

  const moles = massInGrams / molecularWeight
  const molarity = moles / volumeInLiters
  const concentration = massInGrams / volumeInLiters
  const copies = input.includeCopies === false ? null : moles * AVOGADRO_CONSTANT
  if (![concentration, molarity, ...(copies == null ? [] : [copies])].every(Number.isFinite)) return null
  return { mass, volume, massInGrams, volumeInLiters, concentration, molarity, copies }
}
