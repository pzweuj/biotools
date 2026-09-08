import { describe, expect, it } from "vitest"
import { calculateMediaRecipe } from "../media"

describe("media recipe", () => {
  it("uses a 100% FBS stock and fills base medium to final volume", () => {
    const recipe = calculateMediaRecipe(500, [
      { name: "FBS", stock: "100%", final: "10%" },
      { name: "antibiotic", stock: "100×", final: "1×" },
      { name: "glutamine", stock: "200mM", final: "2mM" },
    ])
    expect(recipe.valid).toBe(true)
    expect(recipe.components.map((component) => component.volume)).toEqual([50, 5, 5])
    expect(recipe.baseMediumVolume).toBe(440)
  })

  it("does not return a recipe when components exceed final volume", () => {
    expect(calculateMediaRecipe(10, [{ name: "FBS", stock: "10%", final: "100%" }]).valid).toBe(false)
  })
})
