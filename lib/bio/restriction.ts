export interface RestrictionEnzymeDefinition {
  name: string
  site: string
  cuts: { top: number; bottom: number }
  overhang: "5'" | "3'" | "blunt"
}

export interface RestrictionCutSite {
  enzyme: string
  /** Recognition-site start on the supplied strand, 0-based. */
  start: number
  /** Recognition-site end (0-based exclusive; circular sites wrap modulo length). */
  end: number
  /** Cut coordinates are 0-based positions between bases. */
  topCut: number
  bottomCut: number
  strand: "+" | "-"
  overhang: "5'" | "3'" | "blunt"
}

/** IUPAC symbols accepted in DNA input and recognition sites. */
export const DNA_IUPAC: Readonly<Record<string, string>> = Object.freeze({
  A: "A", C: "C", G: "G", T: "T", R: "AG", Y: "CT", S: "GC", W: "AT",
  K: "GT", M: "AC", B: "CGT", D: "AGT", H: "ACT", V: "ACG", N: "ACGT",
})

const COMPLEMENT: Readonly<Record<string, string>> = Object.freeze({
  A: "T", T: "A", C: "G", G: "C", R: "Y", Y: "R", S: "S", W: "W",
  K: "M", M: "K", B: "V", V: "B", D: "H", H: "D", N: "N",
})

function reverseComplementSite(site: string): string {
  return [...site.toUpperCase()].reverse().map((base) => COMPLEMENT[base] ?? base).join("")
}

function isConcreteDna(base: string): boolean {
  return base === "A" || base === "C" || base === "G" || base === "T"
}

function matchesAt(sequence: string, start: number, pattern: string): boolean {
  for (let i = 0; i < pattern.length; i++) {
    const base = sequence[start + i]
    const allowed = DNA_IUPAC[pattern[i]]
    // An ambiguous/unknown input base is never treated as a determined match.
    if (!isConcreteDna(base) || !allowed?.includes(base)) return false
  }
  return true
}

function validateSite(site: string): string {
  const normalized = site.toUpperCase().replace(/\s+/g, "")
  if (!normalized || ![...normalized].every((base) => Boolean(DNA_IUPAC[base]))) {
    throw new TypeError("restriction recognition sites must use DNA/IUPAC symbols")
  }
  return normalized
}

/** Scan one enzyme and return each physical recognition/cut site once. */
export function findRestrictionSites(
  sequence: string,
  enzyme: RestrictionEnzymeDefinition,
  circular = false,
): RestrictionCutSite[] {
  const clean = sequence.toUpperCase().replace(/\s+/g, "")
  if (!clean || ![...clean].every((base) => Boolean(DNA_IUPAC[base]))) {
    throw new TypeError("restriction sequence must contain DNA/IUPAC symbols")
  }
  const site = validateSite(enzyme.site)
  const length = clean.length
  const siteLength = site.length
  if (siteLength === 0 || (!circular && siteLength > length)) return []

  // Repeat the template as many times as necessary to inspect a site crossing
  // the origin, including recognition sites longer than the template itself.
  const scanSequence = circular
    ? clean + Array.from({ length: siteLength - 1 }, (_, i) => clean[i % length]).join("")
    : clean
  const patterns: Array<{ pattern: string; strand: "+" | "-" }> = [{ pattern: site, strand: "+" }]
  const reversePattern = reverseComplementSite(site)
  if (reversePattern !== site) patterns.push({ pattern: reversePattern, strand: "-" })

  const seen = new Set<number>()
  const sites: RestrictionCutSite[] = []
  for (const { pattern, strand } of patterns) {
    for (let rawStart = 0; rawStart <= scanSequence.length - siteLength; rawStart++) {
      if (rawStart >= length) break
      if (!matchesAt(scanSequence, rawStart, pattern)) continue
      const start = rawStart % length
      if (seen.has(start)) continue
      seen.add(start)

      const topCutOffset = strand === "+" ? enzyme.cuts.top : siteLength - enzyme.cuts.bottom
      const bottomCutOffset = strand === "+" ? enzyme.cuts.bottom : siteLength - enzyme.cuts.top
      const mapCoordinate = (coordinate: number) => circular
        ? ((coordinate % length) + length) % length
        : coordinate
      sites.push({
        enzyme: enzyme.name,
        start,
        end: circular ? mapCoordinate(start + siteLength) : start + siteLength,
        topCut: mapCoordinate(start + topCutOffset),
        bottomCut: mapCoordinate(start + bottomCutOffset),
        strand,
        overhang: enzyme.overhang,
      })
    }
  }
  return sites.sort((a, b) => a.topCut - b.topCut || a.start - b.start)
}

export interface RestrictionFragment {
  start: number
  end: number
  length: number
}

/** Convert unique 0-based cut coordinates to linear or circular fragments. */
export function restrictionFragments(templateLength: number, cutCoordinates: readonly number[], circular: boolean): RestrictionFragment[] {
  if (!Number.isInteger(templateLength) || templateLength <= 0) return []
  const cuts = [...new Set(cutCoordinates.map((cut) => ((cut % templateLength) + templateLength) % templateLength))].sort((a, b) => a - b)
  if (cuts.length === 0) return [{ start: 0, end: templateLength, length: templateLength }]
  if (circular) {
    return cuts.map((start, index) => {
      const end = cuts[(index + 1) % cuts.length]
      const length = (end - start + templateLength) % templateLength || templateLength
      return { start, end, length }
    }).sort((a, b) => b.length - a.length)
  }
  const fragments: RestrictionFragment[] = []
  if (cuts[0] > 0) fragments.push({ start: 0, end: cuts[0], length: cuts[0] })
  for (let index = 0; index < cuts.length - 1; index++) {
    const length = cuts[index + 1] - cuts[index]
    if (length > 0) fragments.push({ start: cuts[index], end: cuts[index + 1], length })
  }
  const lastLength = templateLength - cuts[cuts.length - 1]
  if (lastLength > 0) fragments.push({ start: cuts[cuts.length - 1], end: templateLength, length: lastLength })
  return fragments.sort((a, b) => b.length - a.length)
}
