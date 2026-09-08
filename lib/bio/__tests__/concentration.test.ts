import { describe, expect, it } from "vitest"
import { calculateConcentration } from "../concentration"

describe("concentration conversion", () => {
  it("keeps g/L and mg/mL numerically equivalent", () => {
    const result = calculateConcentration({
      mass: 1,
      massUnit: "mg",
      volume: 1,
      volumeUnit: "mL",
      molecularWeight: 1000,
      includeCopies: false,
    })
    expect(result?.concentration).toBeCloseTo(1)
    expect(result?.molarity).toBeCloseTo(0.001)
    expect(result?.copies).toBeNull()
  })

  it("allows zero mass but rejects non-positive volume or molecular weight", () => {
    expect(calculateConcentration({ mass: 0, massUnit: "mg", volume: 1, volumeUnit: "mL", molecularWeight: 1000 })?.concentration).toBe(0)
    expect(calculateConcentration({ mass: 1, massUnit: "mg", volume: 0, volumeUnit: "mL", molecularWeight: 1000 })).toBeNull()
    expect(calculateConcentration({ mass: 1, massUnit: "mg", volume: 1, volumeUnit: "mL", molecularWeight: 0 })).toBeNull()
  })
})
