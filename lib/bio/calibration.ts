import { linearRegression, type LinearRegressionPoint } from "./linear-regression"

export type CalibrationFitType = "linear" | "logarithmic" | "exponential" | "power"

export interface CalibrationPoint {
  x: number
  y: number
}

export interface ParsedCalibrationData {
  points: CalibrationPoint[]
  error: string | null
}

export interface CalibrationFit {
  type: CalibrationFitType
  /** y = a + b*x, y = a + b*ln(x), y = a*e^(b*x), or y = a*x^b. */
  parameters: { a: number; b: number }
  equation: string
  rSquared: number | null
  predicted: number[]
}

/** Parse finite X/Y pairs without accepting parseFloat prefixes such as "1x". */
export function parseCalibrationData(text: string): ParsedCalibrationData {
  const points: CalibrationPoint[] = []
  let error: string | null = null
  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const parts = line.split(/[\t,;\s]+/).filter(Boolean)
    if (parts.length < 2) {
      error ??= `Invalid data row ${index + 1}: ${rawLine}`
      continue
    }
    const x = Number(parts[0])
    const y = Number(parts[1])
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      error ??= `Invalid data row ${index + 1}: ${rawLine}`
      continue
    }
    points.push({ x, y })
  }
  return { points, error }
}

function rSquared(points: readonly CalibrationPoint[], predicted: readonly number[]): number | null {
  if (points.length !== predicted.length || points.length < 2 || !predicted.every(Number.isFinite)) return null
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length
  const total = points.reduce((sum, point) => sum + (point.y - meanY) ** 2, 0)
  if (total === 0) return null
  const residual = points.reduce((sum, point, index) => sum + (point.y - predicted[index]) ** 2, 0)
  return 1 - residual / total
}

function transformedPoints(points: readonly CalibrationPoint[], type: CalibrationFitType): LinearRegressionPoint[] {
  if (type === "logarithmic" && points.some((point) => point.x <= 0)) {
    throw new RangeError("logarithmic fitting requires x > 0")
  }
  if (type === "exponential" && points.some((point) => point.y <= 0)) {
    throw new RangeError("exponential fitting requires y > 0")
  }
  if (type === "power" && points.some((point) => point.x <= 0 || point.y <= 0)) {
    throw new RangeError("power fitting requires x > 0 and y > 0")
  }
  if (type === "logarithmic") return points.map((point) => ({ x: Math.log(point.x), y: point.y }))
  if (type === "exponential") return points.map((point) => ({ x: point.x, y: Math.log(point.y) }))
  if (type === "power") return points.map((point) => ({ x: Math.log(point.x), y: Math.log(point.y) }))
  return points.map((point) => ({ x: point.x, y: point.y }))
}

function predictValues(type: CalibrationFitType, a: number, b: number, points: readonly CalibrationPoint[]): number[] {
  return points.map((point) => {
    if (type === "linear") return a + b * point.x
    if (type === "logarithmic") return point.x > 0 ? a + b * Math.log(point.x) : Number.NaN
    if (type === "exponential") return a * Math.exp(b * point.x)
    return point.x > 0 ? a * point.x ** b : Number.NaN
  })
}

function equationFor(type: CalibrationFitType, a: number, b: number): string {
  const sign = b >= 0 ? "+" : ""
  if (type === "linear") return `y = ${a.toFixed(4)} ${sign} ${b.toFixed(4)}x`
  if (type === "logarithmic") return `y = ${a.toFixed(4)} ${sign} ${b.toFixed(4)}*ln(x)`
  if (type === "exponential") return `y = ${a.toFixed(4)} * e^(${b.toFixed(4)}x)`
  return `y = ${a.toFixed(4)} * x^${b.toFixed(4)}`
}

/** Fit one of the page's calibration models using centered ordinary least squares. */
export function fitCalibration(points: readonly CalibrationPoint[], type: CalibrationFitType): CalibrationFit {
  if (points.length < 2) throw new RangeError("at least two points are required")
  const fit = linearRegression(transformedPoints(points, type))
  const a = type === "exponential" || type === "power" ? Math.exp(fit.intercept) : fit.intercept
  const b = fit.slope
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new RangeError("fit result is not finite")
  const predicted = predictValues(type, a, b, points)
  if (!predicted.every(Number.isFinite)) throw new RangeError("fit prediction is not finite")
  return { type, parameters: { a, b }, equation: equationFor(type, a, b), rSquared: rSquared(points, predicted), predicted }
}

/** Predict Y from X. The calibration API intentionally has no inverse operation. */
export function predictCalibration(fit: CalibrationFit, x: number): number | null {
  if (!Number.isFinite(x)) return null
  const { a, b } = fit.parameters
  if (![a, b].every(Number.isFinite)) return null
  if (fit.type === "logarithmic" && x <= 0) return null
  if (fit.type === "power" && x <= 0) return null
  const y = fit.type === "linear"
    ? a + b * x
    : fit.type === "logarithmic"
      ? a + b * Math.log(x)
      : fit.type === "exponential"
        ? a * Math.exp(b * x)
        : a * x ** b
  return Number.isFinite(y) ? y : null
}

export interface GelStandardBand {
  size: number
  distance: number
}

export interface ParsedGelStandardData {
  bands: GelStandardBand[]
  error: string | null
}

export interface ParsedIntensityData {
  standards: IntensityStandard[]
  error: string | null
}

export function parseGelStandardData(text: string): ParsedGelStandardData {
  const parsed = parseCalibrationData(text)
  const invalidDomain = parsed.points.find((point) => point.x <= 0 || point.y < 0)
  return {
    bands: parsed.points.map((point) => ({ size: point.x, distance: point.y })).filter((band) => band.size > 0 && band.distance >= 0).sort((left, right) => right.size - left.size),
    error: parsed.error ?? (invalidDomain ? "Standard sizes must be positive and migration distances must be non-negative" : null),
  }
}

export function parseIntensityData(text: string): ParsedIntensityData {
  const parsed = parseCalibrationData(text)
  return {
    standards: parsed.points.map((point) => ({ concentration: point.x, intensity: point.y })),
    error: parsed.error,
  }
}

export interface GelStandardCurve {
  slope: number
  intercept: number
  rSquared: number | null
}

/** Fit log10(size) against measured migration distance for a gel ladder. */
export function fitGelStandardCurve(bands: readonly GelStandardBand[]): GelStandardCurve | null {
  if (bands.length < 2 || !bands.every((band) => Number.isFinite(band.size) && band.size > 0 && Number.isFinite(band.distance) && band.distance >= 0)) return null
  try {
    const fit = linearRegression(bands.map((band) => ({ x: band.distance, y: Math.log10(band.size) })))
    return { slope: fit.slope, intercept: fit.intercept, rSquared: fit.rSquared }
  } catch {
    return null
  }
}

export function predictGelSize(distance: number, curve: GelStandardCurve | null): number | null {
  if (!curve || !Number.isFinite(distance) || distance < 0 || !Number.isFinite(curve.slope) || !Number.isFinite(curve.intercept) || curve.slope === 0) return null
  const size = 10 ** (curve.slope * distance + curve.intercept)
  return Number.isFinite(size) ? size : null
}

export interface IntensityStandard {
  concentration: number
  intensity: number
}

/** Invert an intensity = slope*concentration + intercept fit when the slope is usable. */
export function predictConcentration(intensity: number, standards: readonly IntensityStandard[]): number | null {
  if (!Number.isFinite(intensity) || standards.length < 2 || !standards.every((point) => Number.isFinite(point.concentration) && Number.isFinite(point.intensity))) return null
  try {
    const fit = linearRegression(standards.map((point) => ({ x: point.concentration, y: point.intensity })))
    if (fit.slope === 0) return null
    const concentration = (intensity - fit.intercept) / fit.slope
    return Number.isFinite(concentration) ? concentration : null
  } catch {
    return null
  }
}
