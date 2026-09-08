import { describe, expect, it } from "vitest"
import { proteinIsoelectricPoint } from "../protein-analysis"

describe("protein pI", () => {
  it("uses an anionic charge for ionized Cys and Tyr", () => {
    expect(proteinIsoelectricPoint("KCCCC")).toBeCloseTo(7.69, 1)
    expect(proteinIsoelectricPoint("KYYYY")).toBeLessThan(10)
  })
})
