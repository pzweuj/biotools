const AMINO_ACID_MAP: Readonly<Record<string, { three: string; one: string }>> = {
  Ala: { three: "Ala", one: "A" },
  Arg: { three: "Arg", one: "R" },
  Asn: { three: "Asn", one: "N" },
  Asp: { three: "Asp", one: "D" },
  Cys: { three: "Cys", one: "C" },
  Gln: { three: "Gln", one: "Q" },
  Glu: { three: "Glu", one: "E" },
  Gly: { three: "Gly", one: "G" },
  His: { three: "His", one: "H" },
  Ile: { three: "Ile", one: "I" },
  Leu: { three: "Leu", one: "L" },
  Lys: { three: "Lys", one: "K" },
  Met: { three: "Met", one: "M" },
  Phe: { three: "Phe", one: "F" },
  Pro: { three: "Pro", one: "P" },
  Ser: { three: "Ser", one: "S" },
  Thr: { three: "Thr", one: "T" },
  Trp: { three: "Trp", one: "W" },
  Tyr: { three: "Tyr", one: "Y" },
  Val: { three: "Val", one: "V" },
}

const STOP_CODON_MAP: Readonly<Record<string, readonly string[]>> = {
  Ter: ["Ter", "*", "X"],
  "*": ["Ter", "*", "X"],
  X: ["Ter", "*", "X"],
}

const ONE_TO_THREE_MAP: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(AMINO_ACID_MAP).map(([three, { one }]) => [one, three]),
) as Record<string, string>

export type AminoAcidConversionMode = "toOne" | "toThree"
export type StopCodonFormat = "Ter" | "*" | "X"

function convertOneLetterSequence(sequence: string, stopCodonFormat: StopCodonFormat): string {
  return [...sequence]
    .map((aminoAcid) => {
      if (aminoAcid === "*" || aminoAcid === "X") return stopCodonFormat
      return ONE_TO_THREE_MAP[aminoAcid] || aminoAcid
    })
    .join("")
}

/** Convert one HGVS protein variant between one- and three-letter notation. */
export function convertAminoAcidVariant(
  variant: string,
  conversionMode: AminoAcidConversionMode,
  stopCodonFormat: StopCodonFormat,
): string {
  const trimmedVariant = variant.trim()
  if (!trimmedVariant) return ""

  const hasPrefix = /^p\./i.test(trimmedVariant)
  const prefix = hasPrefix ? "p." : ""
  const cleanVariant = trimmedVariant.replace(/^p\./i, "")

  if (conversionMode === "toOne") {
    let result = cleanVariant

    Object.keys(STOP_CODON_MAP).forEach((stop) => {
      const escapedStop = stop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      result = result.replace(new RegExp(escapedStop, "g"), stopCodonFormat)
    })

    Object.entries(AMINO_ACID_MAP).forEach(([three, { one }]) => {
      result = result.replace(new RegExp(three, "g"), one)
    })

    return prefix + result
  }

  // Match a full residue sequence after del/ins/delins/dup instead of only
  // the first residue (for example, delELREA -> delGluLeuArgGluAla).
  const variantPattern = /([A-Z])(\d+)(?:_([A-Z])(\d+))?(delins|del|ins|dup|fs|ext)?([A-Z*X]+)?/g
  return prefix + cleanVariant.replace(
    variantPattern,
    (
      _match: string,
      aa1: string,
      pos1: string,
      aa2: string | undefined,
      pos2: string | undefined,
      variantType: string | undefined,
      targetSequence: string | undefined,
    ) => {
      const firstAminoAcid = ONE_TO_THREE_MAP[aa1] || aa1
      const target = targetSequence
        ? convertOneLetterSequence(targetSequence, stopCodonFormat)
        : ""

      if (aa2 && pos2) {
        const secondAminoAcid = ONE_TO_THREE_MAP[aa2] || aa2
        return `${firstAminoAcid}${pos1}_${secondAminoAcid}${pos2}${variantType || ""}${target}`
      }

      return `${firstAminoAcid}${pos1}${variantType || ""}${target}`
    },
  )
}
