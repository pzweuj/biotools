// 同时在一条序列中查找 query 的正向、反向、互补和反向互补形式。
// 坐标约定：1-based inclusive，相对传入序列的起点。
// 仅做字面精确匹配（不展开 IUPAC 简并），纯函数、无副作用，可在 Worker 中复用。

import { complement, reverse, reverseComplement } from "./sequence"

export const SEQUENCE_FINDER_MIN_QUERY_LENGTH = 8

export const SEQUENCE_MATCH_TYPES = [
  "forward",
  "reverse",
  "complement",
  "reverse-complement",
] as const

export type SequenceMatchType = (typeof SEQUENCE_MATCH_TYPES)[number]

const TYPE_ORDER: Record<SequenceMatchType, number> = {
  forward: 0,
  reverse: 1,
  complement: 2,
  "reverse-complement": 3,
}

const VARIANTS: Record<SequenceMatchType, (sequence: string) => string> = {
  forward: (sequence) => sequence,
  reverse,
  complement,
  "reverse-complement": reverseComplement,
}

export interface SequenceMatch {
  /** 命中的形式（正向 / 反向 / 互补 / 反向互补） */
  type: SequenceMatchType
  /** 0-based 起始索引（序列内） */
  index: number
  /** 1-based 起始（序列内，inclusive） */
  start: number
  /** 1-based 终止（序列内，inclusive） */
  end: number
  length: number
  /** 该形式实际用于查找的序列 */
  pattern: string
  /** 序列上匹配到的片段（正链方向） */
  matchedSequence: string
}

export interface SequenceSearchResult {
  query: string
  matches: SequenceMatch[]
  counts: Record<SequenceMatchType, number>
}

/**
 * 校验并规范化查询序列：去除空白、转大写，要求仅含 ACGT 且长度不少于 8 bp。
 */
export function normalizeSequenceFinderQuery(input: string): string {
  if (typeof input !== "string") {
    throw new TypeError("query must be a string")
  }
  const cleaned = input.replace(/\s+/g, "").toUpperCase()
  if (cleaned.length === 0) {
    throw new RangeError("query is required")
  }
  if (!/^[ACGT]+$/.test(cleaned)) {
    throw new TypeError("query must contain only A, C, G and T")
  }
  if (cleaned.length < SEQUENCE_FINDER_MIN_QUERY_LENGTH) {
    throw new RangeError(`query must be at least ${SEQUENCE_FINDER_MIN_QUERY_LENGTH} bases`)
  }
  return cleaned
}

/**
 * 在 sequence 中同时查找 query 的四种形式，返回所有（含重叠）命中。
 *
 * 坐标是相对传入序列起点的 1-based inclusive；四种形式都按字面序列在
 * 同一条序列上查找，因此互补/反向互补命中不代表链向信息。
 */
export function findSequenceMatches(sequence: string, query: string): SequenceSearchResult {
  if (typeof sequence !== "string") {
    throw new TypeError("sequence must be a string")
  }

  const normalizedQuery = normalizeSequenceFinderQuery(query)
  const template = sequence.replace(/\s+/g, "").toUpperCase()
  const counts: Record<SequenceMatchType, number> = {
    forward: 0,
    reverse: 0,
    complement: 0,
    "reverse-complement": 0,
  }
  const matches: SequenceMatch[] = []

  for (const type of SEQUENCE_MATCH_TYPES) {
    const pattern = VARIANTS[type](normalizedQuery)
    if (pattern.length > template.length) continue

    let from = 0
    let index = template.indexOf(pattern, from)
    while (index !== -1) {
      matches.push({
        type,
        index,
        start: index + 1,
        end: index + pattern.length,
        length: pattern.length,
        pattern,
        matchedSequence: template.slice(index, index + pattern.length),
      })
      counts[type]++
      from = index + 1
      index = template.indexOf(pattern, from)
    }
  }

  matches.sort((a, b) => a.index - b.index || TYPE_ORDER[a.type] - TYPE_ORDER[b.type])

  return { query: normalizedQuery, matches, counts }
}
