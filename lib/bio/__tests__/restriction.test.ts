import { describe, expect, it } from "vitest"
import { findRestrictionSites, restrictionFragments } from "../restriction"

const ecoRI = { name: "EcoRI", site: "GAATTC", cuts: { top: 1, bottom: 5 }, overhang: "5'" as const }

describe("restriction site scanning", () => {
  it("deduplicates a palindromic site", () => {
    const sites = findRestrictionSites("AAAAGAATTCAAAA", ecoRI, true)
    expect(sites).toHaveLength(1)
    expect(sites[0].topCut).toBe(5)
  })

  it("finds a circular site crossing the origin", () => {
    const sites = findRestrictionSites("AATTCAAAAG", ecoRI, true)
    expect(sites).toHaveLength(1)
    expect(sites[0].topCut).toBe(0)
  })

  it("keeps linear end coordinates at the template boundary", () => {
    const enzyme = { name: "end", site: "AAA", cuts: { top: 3, bottom: 3 }, overhang: "blunt" as const }
    const sites = findRestrictionSites("AAAAA", enzyme, false)
    expect(sites[0]).toMatchObject({ start: 0, end: 3, topCut: 3, bottomCut: 3 })
  })

  it("does not treat an unknown base as a confirmed site", () => {
    expect(findRestrictionSites("AAAANGATTC", ecoRI, true)).toHaveLength(0)
  })

  it("supports recognition patterns longer than a circular template", () => {
    const longSite = { name: "long", site: "AATAAT", cuts: { top: 1, bottom: 5 }, overhang: "5'" as const }
    expect(findRestrictionSites("AAT", longSite, true)).toHaveLength(1)
  })

  it("uses one full fragment for a circular single cut and omits linear zero lengths", () => {
    expect(restrictionFragments(14, [5], true)).toEqual([{ start: 5, end: 5, length: 14 }])
    expect(restrictionFragments(14, [0, 14], false).map((fragment) => fragment.length)).toEqual([14])
    expect(restrictionFragments(14, [5], false).map((fragment) => fragment.length)).toEqual([9, 5])
  })
})
