// 引物坐标计算：在模板序列上定位引物结合区，并映射到基因组坐标
// 约定：
// - 坐标 1-based inclusive（UCSC / Ensembl / hgvs 通用约定）
// - 模板假定与基因组正链同向：模板第 1 个碱基 = 基因组起始坐标
// - 模板内位置 i (1-based) -> 基因组坐标 = genomicStart + i - 1
// 纯函数、无副作用；不依赖 React / DOM，可被 worker / Node 测试直接 import

import { reverseComplement } from "./sequence"

export type PrimerStrand = "+" | "-"

export interface PrimerHit {
  /** 0-based 起始索引（模板序列内） */
  index: number
  /** 1-based 起始（模板内，inclusive） */
  templateStart: number
  /** 1-based 终止（模板内，inclusive） */
  templateEnd: number
  /** 基因组起始坐标（1-based inclusive） */
  genomicStart: number
  /** 基因组终止坐标（1-based inclusive） */
  genomicEnd: number
  /** 引物 5' 端基因组坐标（+链在低坐标，-链在高坐标） */
  fivePrimeGenomic: number
  /** 引物 3' 端基因组坐标（+链在高坐标，-链在低坐标） */
  threePrimeGenomic: number
  /** 实际匹配链向：+ 表示引物直接与模板正链匹配；- 表示匹配的是引物的反向互补 */
  strand: PrimerStrand
  /** 模板上匹配到的序列（正链方向，与基因组同向） */
  matchedSequence: string
  length: number
}

export interface LocateOptions {
  /** 基因组起始坐标（1-based inclusive），默认 1 */
  genomicStart?: number
}

/** 在模板中查找 query 的所有精确匹配位置（返回 0-based 索引数组）。
 * 用 indexOf 滚动扫描，比逐位比较省事且足够快；处理串联重复时报告所有命中。 */
export function findAllMatches(template: string, query: string): number[] {
  const hits: number[] = []
  if (!query || query.length === 0 || query.length > template.length) return hits
  let from = 0
  let idx = template.indexOf(query, from)
  while (idx !== -1) {
    hits.push(idx)
    from = idx + 1
    idx = template.indexOf(query, from)
  }
  return hits
}

function buildHit(index: number, length: number, genomicStart: number, strand: PrimerStrand, matchedSequence: string): PrimerHit {
  const genomicStartPos = genomicStart + index
  const genomicEndPos = genomicStart + index + length - 1
  return {
    index,
    templateStart: index + 1,
    templateEnd: index + length,
    genomicStart: genomicStartPos,
    genomicEnd: genomicEndPos,
    // +链 5' 在低坐标、3' 在高坐标；-链 5' 在高坐标、3' 在低坐标
    fivePrimeGenomic: strand === "+" ? genomicStartPos : genomicEndPos,
    threePrimeGenomic: strand === "+" ? genomicEndPos : genomicStartPos,
    strand,
    matchedSequence,
    length,
  }
}

/** 定位正向引物：直接在模板正链上搜索 primer（5'->3'，与模板同向） */
export function locateForwardPrimer(template: string, primer: string, opts: LocateOptions = {}): PrimerHit[] {
  const g = opts.genomicStart ?? 1
  return findAllMatches(template, primer).map((i) =>
    buildHit(i, primer.length, g, "+", template.slice(i, i + primer.length)),
  )
}

/** 定位反向引物：在模板正链上搜索 primer 的反向互补
 * （primer 本身是 5'->3' 的负链序列，其结合区在正链上表现为 RC(primer)） */
export function locateReversePrimer(template: string, primer: string, opts: LocateOptions = {}): PrimerHit[] {
  const g = opts.genomicStart ?? 1
  const rc = reverseComplement(primer)
  return findAllMatches(template, rc).map((i) =>
    buildHit(i, primer.length, g, "-", template.slice(i, i + rc.length)),
  )
}

export interface PrimerLocation {
  /** 输入的引物序列 */
  primer: string
  /** 期望链向（F=+, R=-） */
  expectedStrand: PrimerStrand
  /** 实际命中链向；无命中时回退为 expectedStrand */
  strand: PrimerStrand
  /** 实际匹配链向是否与期望一致（false = 仅在反向搜索中命中，提示用户方向可能填反） */
  orientationMatches: boolean
  hits: PrimerHit[]
}

/** 高层定位 API：先按期望链向搜索；若 0 命中则回退到反向搜索。
 * 兼容用户把引物粘成另一种方向的情况（如把 R 引物粘成了正链序列）。 */
export function locatePrimer(
  template: string,
  primer: string,
  expectedStrand: PrimerStrand,
  genomicStart = 1,
): PrimerLocation {
  const primary =
    expectedStrand === "+"
      ? locateForwardPrimer(template, primer, { genomicStart })
      : locateReversePrimer(template, primer, { genomicStart })
  if (primary.length > 0) {
    return { primer, expectedStrand, strand: expectedStrand, orientationMatches: true, hits: primary }
  }
  // 回退：尝试反向搜索
  const fallback =
    expectedStrand === "+"
      ? locateReversePrimer(template, primer, { genomicStart })
      : locateForwardPrimer(template, primer, { genomicStart })
  if (fallback.length === 0) {
    return { primer, expectedStrand, strand: expectedStrand, orientationMatches: true, hits: [] }
  }
  return { primer, expectedStrand, strand: fallback[0].strand, orientationMatches: false, hits: fallback }
}

export interface Amplicon {
  /** 扩增子基因组起始（低坐标） */
  genomicStart: number
  /** 扩增子基因组终止（高坐标） */
  genomicEnd: number
  /** 扩增子大小 (bp) */
  size: number
  /** F 在上游、R 在下游且不重叠时为 true */
  valid: boolean
  /** 无效原因（valid=false 时给出，便于 UI 提示） */
  reason?: "overlap" | "order"
}

/** 由一对命中计算扩增子跨度。
 *  - valid: F 起始 <= R 起始 且 F 终止 < R 起始（F 在上游、不重叠）
 *  - 传入任意链向的命中均可：按基因组坐标 min/max 计算跨度 */
export function computeAmplicon(fHit: PrimerHit, rHit: PrimerHit): Amplicon {
  const genomicStart = Math.min(fHit.genomicStart, rHit.genomicStart)
  const genomicEnd = Math.max(fHit.genomicEnd, rHit.genomicEnd)
  const size = genomicEnd - genomicStart + 1
  // F 应在上游（更低坐标）且与 R 不重叠
  const fUpstream = fHit.genomicStart <= rHit.genomicStart
  const noOverlap = fHit.genomicEnd < rHit.genomicStart
  let valid = true
  let reason: Amplicon["reason"] | undefined
  if (!fUpstream) {
    valid = false
    reason = "order"
  } else if (!noOverlap) {
    valid = false
    reason = "overlap"
  }
  return { genomicStart, genomicEnd, size, valid, reason }
}
