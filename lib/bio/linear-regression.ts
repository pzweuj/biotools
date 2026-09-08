export interface LinearRegressionPoint {
  x: number
  y: number
}

export interface LinearRegressionResult {
  slope: number
  intercept: number
  rSquared: number | null
  predicted: number[]
}

/** Ordinary least squares with explicit diagnostics for degenerate inputs. */
export function linearRegression(points: readonly LinearRegressionPoint[]): LinearRegressionResult {
  if (points.length < 2) throw new RangeError("at least two points are required")
  if (!points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))) {
    throw new TypeError("regression points must be finite")
  }
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length
  const ssXX = points.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0)
  const xScale = points.reduce((maximum, point) => Math.max(maximum, Math.abs(point.x - meanX)), 0)
  // Compare against the scale of X itself. Using `max(1, ...)` here rejects
  // valid measurements whose values are small but distinct (for example
  // concentrations in the 1e-10 range).
  const scaledTolerance = Number.EPSILON * points.length * xScale * xScale
  if (ssXX === 0 || ssXX <= scaledTolerance) {
    throw new RangeError("x values must not all be identical")
  }
  const covariance = points.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0)
  const slope = covariance / ssXX
  const intercept = meanY - slope * meanX
  const predicted = points.map((point) => intercept + slope * point.x)
  const ssTotal = points.reduce((sum, point) => sum + (point.y - meanY) ** 2, 0)
  const ssResidual = points.reduce((sum, point, index) => sum + (point.y - predicted[index]) ** 2, 0)
  if (!Number.isFinite(slope) || !Number.isFinite(intercept) || !predicted.every(Number.isFinite)) {
    throw new RangeError("regression result is not finite")
  }
  return {
    slope,
    intercept,
    rSquared: ssTotal === 0 ? null : 1 - ssResidual / ssTotal,
    predicted,
  }
}
