export interface MediaComponentInput {
  name: string
  stock: string
  final: string
}

export interface MediaComponentVolume extends MediaComponentInput {
  volume: number
}

export interface MediaRecipe {
  components: MediaComponentVolume[]
  componentsVolume: number
  baseMediumVolume: number
  valid: boolean
  reason?: string
}

function concentrationValue(value: string, suffix: string): number | null {
  const match = value.trim().match(new RegExp(`^([0-9]+(?:\\.[0-9]+)?)\\s*${suffix}$`, "i"))
  return match ? Number(match[1]) : null
}

function componentVolume(stock: string, final: string, totalVolume: number): number | null {
  const pairs: Array<[string, string]> = [["%", "%"], ["×", "×"], ["mM", "mM"]]
  for (const [stockSuffix, finalSuffix] of pairs) {
    const stockValue = concentrationValue(stock, stockSuffix)
    const finalValue = concentrationValue(final, finalSuffix)
    if (stockValue != null || finalValue != null) {
      if (stockValue == null || finalValue == null || stockValue <= 0 || finalValue < 0) return null
      return totalVolume * finalValue / stockValue
    }
  }
  return null
}

export function calculateMediaRecipe(totalVolume: number, inputs: readonly MediaComponentInput[]): MediaRecipe {
  if (!Number.isFinite(totalVolume) || totalVolume <= 0) {
    return { components: [], componentsVolume: 0, baseMediumVolume: 0, valid: false, reason: "final volume must be positive" }
  }
  const components: MediaComponentVolume[] = []
  for (const input of inputs) {
    const volume = componentVolume(input.stock, input.final, totalVolume)
    if (volume == null || !Number.isFinite(volume)) {
      return { components: [], componentsVolume: 0, baseMediumVolume: 0, valid: false, reason: `invalid concentration for ${input.name}` }
    }
    components.push({ ...input, volume })
  }
  const componentsVolume = components.reduce((sum, component) => sum + component.volume, 0)
  const baseMediumVolume = totalVolume - componentsVolume
  if (baseMediumVolume < -1e-9) {
    return { components, componentsVolume, baseMediumVolume, valid: false, reason: "component volumes exceed final volume" }
  }
  return { components, componentsVolume, baseMediumVolume: Math.max(0, baseMediumVolume), valid: true }
}
