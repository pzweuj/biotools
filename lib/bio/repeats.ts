// 重复序列检测 —— 基于哈希的非重叠重复查找
// O(n²) 最坏情况但通常远低于此（取决于序列重复度）
// 可在 Web Worker 中复用

export interface RepeatInfo {
  /** 重复单元序列 */
  sequence: string
  /** 非重叠出现次数 */
  count: number
  /** 每次出现的起始位置（1-based） */
  positions: number[]
  /** 重复单元长度 */
  length: number
  /** 是否为串联重复（相邻出现） */
  isTandem: boolean
}

export interface FindRepeatsOptions {
  /** 最小重复单元长度（默认 3） */
  minLength?: number
  /** 最大重复单元长度（默认 20） */
  maxLength?: number
  /** 最少出现次数（默认 2） */
  minCount?: number
  /** 只报告"极大"重复（不报告已是更长重复子串的单元），默认 true */
  maximalOnly?: boolean
}

/**
 * 查找序列中的非重叠重复。
 *
 * 算法说明：
 * 1. 对所有长度范围 [minLength, maxLength] 的窗口子串建哈希索引（Map）
 * 2. 每个子串收齐所有出现位置
 * 3. 过滤：去除同聚物（poly-A/T/G/C）、去除非极大重复
 * 4. 按 (count × length) 降序排列 — 即"生物学显著性"
 */
export function findRepeats(
  seq: string,
  options: FindRepeatsOptions = {},
): RepeatInfo[] {
  const {
    minLength = 3,
    maxLength = Math.min(20, Math.floor(seq.length / 2)),
    minCount = 2,
    maximalOnly = true,
  } = options

  if (seq.length < minLength) return []

  // 单次扫描收集所有子串位置
  const posMap = new Map<string, number[]>()

  for (let len = minLength; len <= maxLength; len++) {
    for (let i = 0; i <= seq.length - len; i++) {
      const sub = seq.slice(i, i + len)
      // 跳过多余碱基（N / non-ACGT）
      if (/[^ACGT]/i.test(sub)) continue
      if (!posMap.has(sub)) posMap.set(sub, [])
      posMap.get(sub)!.push(i + 1) // 1-based
    }
  }

  const results: RepeatInfo[] = []

  for (const [sub, allPositions] of posMap) {
    if (allPositions.length < minCount) continue
    // 跳过多余碱基重复（同聚物）
    if (new Set(sub).size === 1) continue

    // 计算非重叠出现次数（取最大不相交集）
    const nonOverlapPositions = greedilySelectNonOverlapping(allPositions, sub.length)
    if (nonOverlapPositions.length < minCount) continue

    const isTandem = isTandemRepeat(nonOverlapPositions, sub.length)

    results.push({
      sequence: sub,
      count: nonOverlapPositions.length,
      positions: nonOverlapPositions,
      length: sub.length,
      isTandem,
    })
  }

  // 去掉"非极大"重复：如果某重复的序列是另一个更长重复的子串，且两者位置高度重叠 → 丢弃短的
  let filtered = results
  if (maximalOnly && results.length > 1) {
    filtered = filterToMaximal(results)
  }

  // 按 (count × length) 降序排列 — 生物意义优先，其次按序列长度 → 字母序
  filtered.sort((a, b) => {
    const scoreA = a.count * a.length
    const scoreB = b.count * b.length
    if (scoreB !== scoreA) return scoreB - scoreA
    if (b.length !== a.length) return b.length - a.length
    return a.sequence.localeCompare(b.sequence)
  })

  return filtered
}

/** 贪心选择非重叠位置（按起始位置排序后取极大独立集） */
function greedilySelectNonOverlapping(positions: number[], unitLen: number): number[] {
  if (positions.length <= 1) return positions
  const sorted = [...positions].sort((a, b) => a - b)
  const selected = [sorted[0]]
  let lastEnd = sorted[0] + unitLen - 1
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] > lastEnd) {
      selected.push(sorted[i])
      lastEnd = sorted[i] + unitLen - 1
    }
  }
  return selected
}

/** 判断是否为串联重复：相邻出现之间间隔 ≤ unitLen 且连续至少 minCount 次 */
function isTandemRepeat(positions: number[], unitLen: number): boolean {
  if (positions.length < 2) return false
  const sorted = [...positions].sort((a, b) => a - b)
  let maxRun = 1
  let currentRun = 1
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1]
    if (gap === unitLen) {
      currentRun++
      maxRun = Math.max(maxRun, currentRun)
    } else {
      currentRun = 1
    }
  }
  return maxRun >= 2
}

/** 过滤到"极大"重复：只保留不包含于更长重复中的 */
function filterToMaximal(repeats: RepeatInfo[]): RepeatInfo[] {
  // 按长度降序 → 长的先占据"领地"
  const sorted = [...repeats].sort((a, b) => b.length - a.length)
  const kept: RepeatInfo[] = []

  for (const candidate of sorted) {
    let subsumed = false
    for (const longer of kept) {
      // candidate 的序列是否是 longer 的子串？
      if (longer.sequence.includes(candidate.sequence)) {
        // 且 candidate 所有 positions 都"贴近" longer 的位置（提示是同一重复区域）
        if (positionsAreSubsumed(candidate.positions, longer.positions, candidate.length, longer.length)) {
          subsumed = true
          break
        }
      }
    }
    if (!subsumed) kept.push(candidate)
  }

  return kept
}

/** 判断短重复的所有出现是否都落在长重复的出现窗口内 */
function positionsAreSubsumed(
  shortPos: number[],
  longPos: number[],
  shortLen: number,
  longLen: number,
): boolean {
  const longSet = new Set(longPos)
  for (const sp of shortPos) {
    // 检查 sp 附近是否有一个 longer 的位置，使得 longer 窗口覆盖 sp..sp+shortLen-1
    let covered = false
    for (const lp of longPos) {
      if (lp <= sp && lp + longLen - 1 >= sp + shortLen - 1) {
        covered = true
        break
      }
    }
    if (!covered) return false
  }
  return true
}
