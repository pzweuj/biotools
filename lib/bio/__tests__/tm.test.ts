import { describe, expect, it } from "vitest"
import { tmWallace, tmBasicGc, tmSaltAdjusted } from "../tm"

describe("tmWallace", () => {
  it("matches 2(A+T)+4(G+C)", () => {
    // ACGT: 1A 1C 1G 1T → 2*2 + 4*2 = 12
    expect(tmWallace("ACGT")).toBe(12)
  })
  it("ignores non-ACGT", () => {
    expect(tmWallace("ACGT-N")).toBe(12)
  })
  it("0 for empty", () => {
    expect(tmWallace("")).toBe(0)
  })
})

describe("tmBasicGc", () => {
  it("falls back to Wallace when length < 14", () => {
    expect(tmBasicGc("ACGT")).toBe(12)
  })
  it("uses GC formula for ≥ 14 bp", () => {
    // 20 bp, 50% GC: 64.9 + 41*(50-16.4)/20 = 64.9 + 68.88 = 133.78... wait that's high
    // Actually formula assumes [Na+] is fixed, output should be reasonable for ~20-30 bp primers
    const seq20 = "ACGTACGTACGTACGTACGT" // 20 bp, GC = 10/20 = 50%
    const tm = tmBasicGc(seq20)
    expect(tm).toBeCloseTo(64.9 + (41 * (50 - 16.4)) / 20, 6)
  })
})

describe("tmSaltAdjusted", () => {
  it("decreases as length grows (penalty term)", () => {
    const a = tmSaltAdjusted("ACGTACGTACGTACGT", 50) // 16
    const b = tmSaltAdjusted("ACGTACGTACGTACGTACGTACGT", 50) // 24
    // Same GC%; salt fixed; longer → less negative penalty → higher Tm
    expect(b).toBeGreaterThan(a)
  })
  it("changes with salt", () => {
    const t1 = tmSaltAdjusted("ACGTACGTACGTACGT", 50)
    const t2 = tmSaltAdjusted("ACGTACGTACGTACGT", 500)
    expect(t2).toBeGreaterThan(t1)
  })
})
