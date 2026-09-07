// Tm 计算：经典经验公式。
// 精确的 DNA/DNA 近邻热力学模型位于 tm-nearest-neighbor.ts。

import { countBases, cleanDnaStrict } from "./sequence"

/** Wallace rule: Tm = 2(A+T) + 4(G+C)，仅适合 < 14 bp */
export function tmWallace(seq: string): number {
  const s = cleanDnaStrict(seq)
  const c = countBases(s)
  return 2 * (c.A + c.T) + 4 * (c.G + c.C)
}

/** Basic GC：< 14 bp 用 Wallace；否则用经验式 */
export function tmBasicGc(seq: string): number {
  const s = cleanDnaStrict(seq)
  if (s.length === 0) return 0
  if (s.length < 14) return tmWallace(s)
  const c = countBases(s)
  const gcCount = c.G + c.C
  return 64.9 + (41 * (gcCount - 16.4)) / s.length
}

/** Salt-adjusted（Marmur-Schildkraut 简化），salt 单位 mM */
export function tmSaltAdjusted(seq: string, saltMM: number): number {
  const s = cleanDnaStrict(seq)
  if (s.length === 0) return 0
  if (!Number.isFinite(saltMM) || saltMM <= 0) {
    throw new RangeError("saltMM must be a finite number greater than zero")
  }
  const c = countBases(s)
  const gcPercent = ((c.G + c.C) / s.length) * 100
  return 81.5 + 16.6 * Math.log10(saltMM / 1000) + 0.41 * gcPercent - 675 / s.length
}
