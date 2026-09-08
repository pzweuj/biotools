import { describe, expect, it } from "vitest"
import {
  fitCalibration,
  fitGelStandardCurve,
  parseCalibrationData,
  predictConcentration,
  predictGelSize,
} from "../calibration"

describe("calibration helpers", () => {
  it("parses strict finite pairs and rejects parseFloat prefixes", () => {
    expect(parseCalibrationData("0 1\n1x 2\n2 3")).toEqual({
      points: [{ x: 0, y: 1 }, { x: 2, y: 3 }],
      error: "Invalid data row 2: 1x 2",
    })
  })

  it("uses centered regression for linear and transformed fits", () => {
    const linear = fitCalibration([{ x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 5 }], "linear")
    expect(linear.parameters).toEqual({ a: 1, b: 2 })
    expect(linear.rSquared).toBeCloseTo(1)
    const exponential = fitCalibration([{ x: 0, y: 2 }, { x: 1, y: 4 }, { x: 2, y: 8 }], "exponential")
    expect(exponential.parameters.a).toBeCloseTo(2)
    expect(exponential.parameters.b).toBeCloseTo(Math.log(2))
  })

  it("rejects invalid domains and constant X instead of producing pseudo-results", () => {
    expect(() => fitCalibration([{ x: 1, y: 1 }, { x: 1, y: 2 }], "linear")).toThrow()
    expect(() => fitCalibration([{ x: 0, y: 1 }, { x: 1, y: 2 }], "logarithmic")).toThrow()
    expect(() => fitCalibration([{ x: 1, y: 0 }, { x: 2, y: 2 }], "power")).toThrow()
  })

  it("keeps constant Y R² undefined and blocks zero-slope inversion", () => {
    const curve = fitGelStandardCurve([{ size: 100, distance: 1 }, { size: 100, distance: 2 }])
    expect(curve?.rSquared).toBeNull()
    expect(predictGelSize(3, curve)).toBeNull()
    expect(predictConcentration(10, [{ concentration: 1, intensity: 5 }, { concentration: 2, intensity: 5 }])).toBeNull()
  })
})
