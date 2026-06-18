// 核酸/IUPAC 字母表与互补关系
// 仅纯数据 / 表查找；无副作用，可在 worker 中使用

/** DNA 互补：含 IUPAC 简并 */
export const DNA_COMPLEMENT_IUPAC: Readonly<Record<string, string>> = Object.freeze({
  A: "T", T: "A", G: "C", C: "G", U: "A",
  R: "Y", Y: "R", S: "S", W: "W", K: "M", M: "K",
  B: "V", V: "B", D: "H", H: "D",
  N: "N", "-": "-", ".": ".",
})

/** RNA 互补：含 IUPAC 简并 */
export const RNA_COMPLEMENT_IUPAC: Readonly<Record<string, string>> = Object.freeze({
  A: "U", U: "A", G: "C", C: "G", T: "A",
  R: "Y", Y: "R", S: "S", W: "W", K: "M", M: "K",
  B: "V", V: "B", D: "H", H: "D",
  N: "N", "-": "-", ".": ".",
})

/** 核苷酸字母表：标准 + 简并 */
export const NUCLEOTIDE_ALPHABET = "ACGTU"
export const IUPAC_NUCLEOTIDES = "ACGTURYSWKMBDHVN"

/** 单字母 → 三字母氨基酸 */
export const AA_ONE_TO_THREE: Readonly<Record<string, string>> = Object.freeze({
  A: "Ala", R: "Arg", N: "Asn", D: "Asp", C: "Cys",
  E: "Glu", Q: "Gln", G: "Gly", H: "His", I: "Ile",
  L: "Leu", K: "Lys", M: "Met", F: "Phe", P: "Pro",
  S: "Ser", T: "Thr", W: "Trp", Y: "Tyr", V: "Val",
  U: "Sec", O: "Pyl", "*": "Stop", X: "Xaa",
})

export const AA_THREE_TO_ONE: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(
    Object.entries(AA_ONE_TO_THREE).map(([one, three]) => [three.toUpperCase(), one]),
  ) as Record<string, string>,
)

/** 检查字符是否为有效 IUPAC 核苷酸 */
export const isNucleotide = (ch: string): boolean =>
  ch.length === 1 && IUPAC_NUCLEOTIDES.includes(ch.toUpperCase())
