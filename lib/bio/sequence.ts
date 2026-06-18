// 序列处理工具：清洗 / 互补 / GC 含量 / FASTA 解析
// 设计原则：纯函数、单次扫描、O(n)；可在 Web Worker 中复用

import { DNA_COMPLEMENT_IUPAC, RNA_COMPLEMENT_IUPAC } from "./alphabet"

/** 清洗序列：保留 ACGTU 与 IUPAC 简并字符；去除空白与非法符号 */
export function cleanSequence(seq: string, options?: { keepIupac?: boolean }): string {
  const allow = options?.keepIupac
    ? /[^ACGTURYSWKMBDHVN]/gi
    : /[^ACGTU]/gi
  return seq.toUpperCase().replace(allow, "")
}

/** 仅保留 DNA（ACGT，去除 U 与简并） */
export function cleanDnaStrict(seq: string): string {
  return seq.toUpperCase().replace(/[^ACGT]/g, "")
}

/** 互补（不反转）：默认 DNA；rna=true 则使用 RNA 互补表 */
export function complement(seq: string, opts?: { rna?: boolean }): string {
  const table = opts?.rna ? RNA_COMPLEMENT_IUPAC : DNA_COMPLEMENT_IUPAC
  let out = ""
  for (let i = 0; i < seq.length; i++) {
    const ch = seq[i]
    const upper = ch.toUpperCase()
    const mapped = table[upper] ?? ch
    // 保持原始大小写
    out += ch === upper ? mapped : mapped.toLowerCase()
  }
  return out
}

/** 反向序列 */
export function reverse(seq: string): string {
  // 比 split('').reverse().join('') 更快、更省内存
  let out = ""
  for (let i = seq.length - 1; i >= 0; i--) out += seq[i]
  return out
}

/** 反向互补 */
export function reverseComplement(seq: string, opts?: { rna?: boolean }): string {
  return reverse(complement(seq, opts))
}

export interface BaseCounts {
  A: number
  C: number
  G: number
  T: number
  U: number
  N: number
  other: number
  total: number
}

/** 单次扫描碱基计数（比多次正则 match 快 4-10 倍） */
export function countBases(seq: string): BaseCounts {
  let A = 0, C = 0, G = 0, T = 0, U = 0, N = 0, other = 0
  for (let i = 0; i < seq.length; i++) {
    const c = seq.charCodeAt(i)
    // 65=A 67=C 71=G 84=T 85=U 78=N（大写）；小写差 32
    const uc = c >= 97 && c <= 122 ? c - 32 : c
    switch (uc) {
      case 65: A++; break
      case 67: C++; break
      case 71: G++; break
      case 84: T++; break
      case 85: U++; break
      case 78: N++; break
      default: other++
    }
  }
  return { A, C, G, T, U, N, other, total: seq.length }
}

/** GC 含量（0-1）。只对 A/C/G/T 计入；N 与 other 不计入分母 */
export function gcContent(seq: string): number {
  const c = countBases(seq)
  const denom = c.A + c.C + c.G + c.T + c.U
  if (denom === 0) return 0
  return (c.C + c.G) / denom
}

/** AT 含量（0-1） */
export function atContent(seq: string): number {
  const c = countBases(seq)
  const denom = c.A + c.C + c.G + c.T + c.U
  if (denom === 0) return 0
  return (c.A + c.T + c.U) / denom
}

/** Shannon 熵（基于 ACGT 频率，bits/base，最大值 2） */
export function shannonEntropy(seq: string): number {
  const c = countBases(seq)
  const n = c.A + c.C + c.G + c.T + c.U
  if (n === 0) return 0
  let entropy = 0
  for (const k of [c.A, c.C, c.G, c.T + c.U] as const) {
    if (k > 0) {
      const p = k / n
      entropy -= p * Math.log2(p)
    }
  }
  return entropy
}

export interface FastaRecord {
  /** > 后的标识（首个空白前的部分） */
  id: string
  /** 描述行剩余部分（首个空白后的部分） */
  description: string
  /** 序列体（已去除换行；保留原始大小写） */
  sequence: string
}

/** 解析 FASTA 文本；可包含多条记录。
 * 容错：忽略以 ; 开头的注释行；序列内换行/空格全部丢弃。
 */
export function parseFasta(text: string): FastaRecord[] {
  const records: FastaRecord[] = []
  let current: { header: string; chunks: string[] } | null = null

  const lines = text.split(/\r?\n/)
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith(";")) continue
    if (line.startsWith(">")) {
      if (current) {
        records.push(buildRecord(current))
      }
      current = { header: line.slice(1).trim(), chunks: [] }
    } else if (current) {
      current.chunks.push(line.replace(/\s+/g, ""))
    } else {
      // 没有 header 的孤立序列行 —— 包装成匿名记录
      current = { header: "", chunks: [line.replace(/\s+/g, "")] }
    }
  }
  if (current) records.push(buildRecord(current))
  return records
}

function buildRecord(c: { header: string; chunks: string[] }): FastaRecord {
  const idx = c.header.indexOf(" ")
  const id = idx === -1 ? c.header : c.header.slice(0, idx)
  const description = idx === -1 ? "" : c.header.slice(idx + 1).trim()
  return {
    id,
    description,
    sequence: c.chunks.join(""),
  }
}

/** 把序列序列化为 FASTA 文本 */
export function toFasta(records: FastaRecord[], wrap = 80): string {
  const out: string[] = []
  for (const r of records) {
    const head = r.description ? `>${r.id} ${r.description}` : `>${r.id || ""}`
    out.push(head)
    if (wrap > 0) {
      for (let i = 0; i < r.sequence.length; i += wrap) {
        out.push(r.sequence.slice(i, i + wrap))
      }
    } else {
      out.push(r.sequence)
    }
  }
  return out.join("\n")
}
