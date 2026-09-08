// 标准遗传密码（NCBI table 1）+ 脊椎动物线粒体（table 2）
// 输出符号：氨基酸单字母；终止子用 '*'

export type CodonTable = Readonly<Record<string, string>>

/** 标准遗传密码 (DNA, T 而非 U) */
export const STANDARD_CODE: CodonTable = Object.freeze({
  TTT: "F", TTC: "F", TTA: "L", TTG: "L",
  CTT: "L", CTC: "L", CTA: "L", CTG: "L",
  ATT: "I", ATC: "I", ATA: "I", ATG: "M",
  GTT: "V", GTC: "V", GTA: "V", GTG: "V",
  TCT: "S", TCC: "S", TCA: "S", TCG: "S",
  CCT: "P", CCC: "P", CCA: "P", CCG: "P",
  ACT: "T", ACC: "T", ACA: "T", ACG: "T",
  GCT: "A", GCC: "A", GCA: "A", GCG: "A",
  TAT: "Y", TAC: "Y", TAA: "*", TAG: "*",
  CAT: "H", CAC: "H", CAA: "Q", CAG: "Q",
  AAT: "N", AAC: "N", AAA: "K", AAG: "K",
  GAT: "D", GAC: "D", GAA: "E", GAG: "E",
  TGT: "C", TGC: "C", TGA: "*", TGG: "W",
  CGT: "R", CGC: "R", CGA: "R", CGG: "R",
  AGT: "S", AGC: "S", AGA: "R", AGG: "R",
  GGT: "G", GGC: "G", GGA: "G", GGG: "G",
})

/** 脊椎动物线粒体 (NCBI table 2) */
export const VERT_MITO_CODE: CodonTable = Object.freeze({
  ...STANDARD_CODE,
  ATA: "M",
  TGA: "W",
  AGA: "*",
  AGG: "*",
})

export const CODON_TABLES: Readonly<Record<string, CodonTable>> = Object.freeze({
  standard: STANDARD_CODE,
  vertebrate_mito: VERT_MITO_CODE,
})

/** 游离氨基酸平均质量 (Da；形成肽键前的单体质量)。
 *
 * 保留足够的小数位，避免在扣除肽键失水后把 AA/MM 等短肽舍入到错误的
 * 百分位。展示层再按需要舍入到两位小数。
 */
export const AMINO_ACID_FREE_MASS: Readonly<Record<string, number>> = Object.freeze({
  A: 89.0935, R: 174.2017, N: 132.1179, D: 133.1027, C: 121.1596,
  E: 147.1293, Q: 146.1445, G: 75.0669, H: 155.1546, I: 131.1750,
  L: 131.1750, K: 146.1893, M: 149.2113, F: 165.1900, P: 115.1326,
  S: 105.0930, T: 119.1197, W: 204.2252, Y: 181.1885, V: 117.1469,
})

/** @deprecated Use AMINO_ACID_FREE_MASS. */
export const AMINO_ACID_WEIGHT = AMINO_ACID_FREE_MASS

/** 翻译 DNA 序列为氨基酸；非 3 倍数尾部丢弃；未知三联体记为 'X' */
export function translateDna(seq: string, table: CodonTable = STANDARD_CODE): string {
  const dna = seq.toUpperCase().replace(/\s+/g, "").replace(/U/g, "T")
  const len = dna.length - (dna.length % 3)
  let out = ""
  for (let i = 0; i < len; i += 3) {
    const codon = dna.slice(i, i + 3)
    out += table[codon] ?? "X"
  }
  return out
}
