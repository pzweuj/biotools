import { describe, expect, it } from "vitest"
import { linearRegression } from "../linear-regression"

describe("linear regression diagnostics", () => {
  it("fits a line and reports R squared", () => {
    const result = linearRegression([{ x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 5 }])
    expect(result.slope).toBeCloseTo(2)
    expect(result.intercept).toBeCloseTo(1)
    expect(result.rSquared).toBeCloseTo(1)
  })

  it("rejects a constant x axis", () => {
    expect(() => linearRegression([{ x: 1, y: 1 }, { x: 1, y: 2 }])).toThrow()
  })

  it("keeps distinct small X values valid", () => {
    const result = linearRegression([
      { x: 1e-10, y: 2 },
      { x: 2e-10, y: 4 },
      { x: 3e-10, y: 6 },
    ])
    expect(result.slope).toBeCloseTo(2e10, -5)
    expect(result.intercept).toBeCloseTo(0, 10)
  })

  it("marks constant Y as undefined R squared", () => {
    expect(linearRegression([{ x: 0, y: 2 }, { x: 1, y: 2 }]).rSquared).toBeNull()
  })
})
