import { reverseComplement } from "./sequence"

export type IndexMode = "single" | "combinatorial" | "udi"

export interface IndexEntry {
  row: number
  name: string
  index1: string
  index2?: string
}

export interface IndexValidationIssue {
  type: "duplicate" | "reverse-complement" | "reverse" | "similar"
  severity: "error" | "warning"
  indices: number[]
  description: string
  sequences: string[]
}

export interface IndexValidationResult {
  mode: IndexMode
  allowedMismatches: number
  entries: IndexEntry[]
  issues: IndexValidationIssue[]
  isValid: boolean
  totalChecked: number
}

function hammingDistance(left: string, right: string): number {
  if (left.length !== right.length) return Infinity
  let distance = 0
  for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) distance++
  return distance
}

function splitRows(text: string): string[][] {
  return text.split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/[\t,\s]+/).filter(Boolean))
}

/** Parse one index per row; dual modes require a second column on every row. */
export function parseIndexInput(text: string, mode: IndexMode): IndexEntry[] {
  const rows = splitRows(text)
  if (rows.length === 0) throw new RangeError("No index rows were found")
  const entries: IndexEntry[] = []
  rows.forEach((parts, rowIndex) => {
    if (parts.length < 2 || parts.length > 3) {
      throw new TypeError(`Row ${rowIndex + 1}: expected name, index1 and optional index2`)
    }
    const index1 = parts[1].toUpperCase()
    const index2 = parts[2]?.toUpperCase()
    if (!/^[ACGT]+$/.test(index1) || (index2 !== undefined && !/^[ACGT]+$/.test(index2))) {
      throw new TypeError(`Row ${rowIndex + 1}: indexes must contain only A, C, G and T`)
    }
    if (mode === "single" && index2 !== undefined) {
      throw new TypeError(`Row ${rowIndex + 1}: single-index mode accepts one index column`)
    }
    if (mode !== "single" && index2 === undefined) {
      throw new TypeError(`Row ${rowIndex + 1}: two index columns are required in ${mode} mode`)
    }
    entries.push({ row: rowIndex + 1, name: parts[0], index1, index2 })
  })
  return entries
}

export function resolveIndexMode(text: string): IndexMode {
  const rows = splitRows(text)
  if (rows.length === 0) throw new RangeError("No index rows were found")
  const hasSecond = rows.map((parts) => parts.length >= 3)
  if (hasSecond.some(Boolean) && hasSecond.some((value) => !value)) {
    throw new TypeError("Every row must contain the same number of index columns")
  }
  return hasSecond[0] ? "combinatorial" : "single"
}

function addDuplicateIssues(
  entries: readonly IndexEntry[],
  field: "index1" | "index2",
  issues: IndexValidationIssue[],
): void {
  const seen = new Map<string, number[]>()
  entries.forEach((entry, index) => {
    const sequence = field === "index1" ? entry.index1 : entry.index2
    if (!sequence) return
    const indices = seen.get(sequence) ?? []
    indices.push(index)
    seen.set(sequence, indices)
  })
  seen.forEach((indices, sequence) => {
    if (indices.length > 1) {
      issues.push({
        type: "duplicate",
        severity: "error",
        indices,
        description: `${field}: ${sequence}`,
        sequences: [sequence],
      })
    }
  })
}

function addOrientationWarnings(
  entries: readonly IndexEntry[],
  field: "index1" | "index2",
  issues: IndexValidationIssue[],
): void {
  const getSequence = (entry: IndexEntry) => field === "index1" ? entry.index1 : entry.index2
  for (let i = 0; i < entries.length; i++) {
    const first = getSequence(entries[i])
    if (!first) continue
    const reverse = [...first].reverse().join("")
    const reverseComp = reverseComplement(first)
    for (let j = i + 1; j < entries.length; j++) {
      const second = getSequence(entries[j])
      if (!second) continue
      const label = field === "index1" ? "index1" : "index2"
      if (first === reverseComplement(second)) {
        issues.push({ type: "reverse-complement", severity: "warning", indices: [i, j], description: `${label}: reverse-complement relationship`, sequences: [first, second] })
      } else if (first === [...second].reverse().join("")) {
        issues.push({ type: "reverse", severity: "warning", indices: [i, j], description: `${label}: reverse relationship`, sequences: [first, second] })
      } else if (reverseComp === second || reverse === second) {
        // The symmetric relationships above are normally caught by the first
        // comparison; retaining this branch makes the warning explicit for
        // callers that provide mixed orientation spellings.
        issues.push({ type: reverseComp === second ? "reverse-complement" : "reverse", severity: "warning", indices: [i, j], description: `${label}: orientation relationship`, sequences: [first, second] })
      }
    }
  }
}

function addSimilarIssues(
  entries: readonly IndexEntry[],
  mode: IndexMode,
  allowedMismatches: number,
  issues: IndexValidationIssue[],
): void {
  const threshold = allowedMismatches * 2
  if (threshold === 0) return
  if (mode === "single") {
    for (let i = 0; i < entries.length; i++) for (let j = i + 1; j < entries.length; j++) {
      const distance = hammingDistance(entries[i].index1, entries[j].index1)
      if (distance > 0 && distance <= threshold) {
        issues.push({ type: "similar", severity: "warning", indices: [i, j], description: `index1: Hamming distance ${distance}`, sequences: [entries[i].index1, entries[j].index1] })
      }
    }
    return
  }
  for (let i = 0; i < entries.length; i++) for (let j = i + 1; j < entries.length; j++) {
    const left = entries[i]
    const right = entries[j]
    const d1 = hammingDistance(left.index1, right.index1)
    const d2 = hammingDistance(left.index2 ?? "", right.index2 ?? "")
    // A dual-index collision is possible only when both sides are within the
    // two-sided error envelope. Exact duplicates are reported separately.
    if ((d1 > 0 || d2 > 0) && d1 <= threshold && d2 <= threshold) {
      issues.push({ type: "similar", severity: "warning", indices: [i, j], description: `index pair may be ambiguous within ${allowedMismatches} mismatches per side`, sequences: [`${left.index1}+${left.index2}`, `${right.index1}+${right.index2}`] })
    }
  }
}

export function validateIndexEntries(
  entries: readonly IndexEntry[],
  mode: IndexMode,
  allowedMismatches = 1,
): IndexValidationResult {
  if (!Number.isInteger(allowedMismatches) || allowedMismatches < 0 || allowedMismatches > 2) {
    throw new RangeError("allowed mismatches must be an integer from 0 to 2")
  }
  if (entries.length === 0) throw new RangeError("No index rows were found")
  if (entries.some((entry) => !/^[ACGT]+$/.test(entry.index1))) {
    throw new TypeError("index1 values must contain only A, C, G and T")
  }
  if (mode !== "single" && entries.some((entry) => !entry.index2 || !/^[ACGT]+$/.test(entry.index2))) {
    throw new TypeError("two index columns are required and must contain only A, C, G and T")
  }
  const index1Lengths = new Set(entries.map((entry) => entry.index1.length))
  const index2Lengths = new Set(entries.map((entry) => entry.index2?.length).filter((length): length is number => length != null))
  if (index1Lengths.size !== 1 || (mode !== "single" && index2Lengths.size !== 1)) {
    throw new RangeError("Index lengths must be consistent within each column")
  }

  const issues: IndexValidationIssue[] = []
  if (mode === "single") {
    addDuplicateIssues(entries, "index1", issues)
  } else {
    const pairs = new Map<string, number[]>()
    entries.forEach((entry, index) => {
      const key = `${entry.index1}+${entry.index2}`
      const indices = pairs.get(key) ?? []
      indices.push(index)
      pairs.set(key, indices)
    })
    pairs.forEach((indices, key) => {
      if (indices.length > 1) issues.push({ type: "duplicate", severity: "error", indices, description: `duplicate index pair: ${key}`, sequences: key.split("+") })
    })
    if (mode === "udi") {
      addDuplicateIssues(entries, "index1", issues)
      addDuplicateIssues(entries, "index2", issues)
    }
  }
  addOrientationWarnings(entries, "index1", issues)
  if (mode !== "single") addOrientationWarnings(entries, "index2", issues)
  addSimilarIssues(entries, mode, allowedMismatches, issues)
  issues.sort((left, right) => (left.severity === right.severity ? left.indices[0] - right.indices[0] : left.severity === "error" ? -1 : 1))
  return {
    mode,
    allowedMismatches,
    entries: [...entries],
    issues,
    isValid: !issues.some((issue) => issue.severity === "error"),
    totalChecked: entries.length,
  }
}

export function parseAndValidateIndices(text: string, mode: IndexMode, allowedMismatches = 1): IndexValidationResult {
  return validateIndexEntries(parseIndexInput(text, mode), mode, allowedMismatches)
}
