import { describe, expect, it } from "vitest"
import { calculateDeltaDeltaCt } from "../qpcr"

describe("qPCR delta-delta Ct", () => {
  it("averages technical replicates and honors custom group names", () => {
    const result = calculateDeltaDeltaCt([
      { sample: "C", target: "REF", ct: 20, group: "baseline" },
      { sample: "C", target: "REF", ct: 20.2, group: "baseline" },
      { sample: "C", target: "X", ct: 24, group: "baseline" },
      { sample: "T", target: "REF", ct: 20, group: "treated" },
      { sample: "T", target: "X", ct: 22, group: "treated" },
    ], "REF", "baseline")
    expect(result[0].technicalReplicates).toBe(1)
    expect(result.find((row) => row.sample === "T")?.foldChange).toBeCloseTo(3.7321319661, 6)
  })

  it("does not invent a fold change without controls", () => {
    const result = calculateDeltaDeltaCt([
      { sample: "T", target: "REF", ct: 20, group: "treated" },
      { sample: "T", target: "X", ct: 25, group: "treated" },
    ], "REF", "baseline")
    expect(result[0].foldChange).toBeNull()
  })

  it("keeps groups separate and reports missing reference replicates", () => {
    const result = calculateDeltaDeltaCt([
      { sample: "S", target: "REF", ct: 20, group: "control" },
      { sample: "S", target: "X", ct: 24, group: "control" },
      { sample: "S", target: "X", ct: 23, group: "treatment" },
    ], "REF", "control")
    const treatment = result.find((row) => row.group.toLowerCase() === "treatment")
    expect(treatment?.deltaCt).toBeNull()
    expect(treatment?.reason).toBe("Reference Ct is missing")
  })

  it("is invariant to technical-well row order", () => {
    const observations = [
      { sample: "C", target: "REF", ct: 20, group: "control" },
      { sample: "C", target: "X", ct: 24, group: "control" },
      { sample: "T", target: "REF", ct: 20, group: "treated" },
      { sample: "T", target: "X", ct: 22, group: "treated" },
    ]
    const reversed = calculateDeltaDeltaCt([...observations].reverse(), "REF", "control")
    expect(reversed).toEqual(calculateDeltaDeltaCt(observations, "REF", "control"))
  })
})
