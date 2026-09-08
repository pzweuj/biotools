export interface CtObservation {
  sample: string
  target: string
  ct: number
  group: string
}

export interface DeltaCtResult {
  sample: string
  target: string
  group: string
  targetCt: number | null
  referenceCt: number | null
  technicalReplicates: number
  referenceReplicates: number
  deltaCt: number | null
  controlMeanDeltaCt: number | null
  deltaDeltaCt: number | null
  foldChange: number | null
  reason?: string
}

export function normalizeGroup(value: string): string {
  return value.trim().toLocaleLowerCase()
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

interface Aggregate {
  sample: string
  target: string
  group: string
  values: number[]
}

/**
 * Aggregate technical wells by group + sample + target, then calculate
 * equal-efficiency 2^-ΔΔCt.  Control samples are weighted equally when the
 * control ΔCt baseline is formed; wells within a sample are averaged first.
 */
export function calculateDeltaDeltaCt(
  observations: readonly CtObservation[],
  referenceGene: string,
  controlGroup: string,
): DeltaCtResult[] {
  const reference = referenceGene.trim().toLocaleLowerCase()
  if (!reference) return []
  const control = normalizeGroup(controlGroup)
  const aggregates = new Map<string, Aggregate>()

  for (const observation of observations) {
    const sample = observation.sample.trim()
    const target = observation.target.trim()
    const group = observation.group.trim()
    if (!sample || !target || !group || !Number.isFinite(observation.ct)) continue
    const targetKey = target.toLocaleLowerCase()
    const key = `${normalizeGroup(group)}\u0000${sample}\u0000${targetKey}`
    const aggregate = aggregates.get(key) ?? { sample, target: targetKey, group, values: [] }
    aggregate.values.push(observation.ct)
    aggregates.set(key, aggregate)
  }

  const targetNames = [...new Set([...aggregates.values()]
    .map((aggregate) => aggregate.target)
    .filter((target) => target !== reference))].sort()
  const sampleGroups = [...new Set([...aggregates.values()]
    .map((aggregate) => `${normalizeGroup(aggregate.group)}\u0000${aggregate.sample}`))]
    .sort((left, right) => left.localeCompare(right))
  const getAggregate = (group: string, sample: string, target: string): Aggregate | undefined =>
    aggregates.get(`${normalizeGroup(group)}\u0000${sample}\u0000${target}`)

  const rows: DeltaCtResult[] = []
  for (const target of targetNames) {
    const completeRows: DeltaCtResult[] = []
    for (const sampleGroup of sampleGroups) {
      const separator = sampleGroup.indexOf("\u0000")
      const normalizedGroup = sampleGroup.slice(0, separator)
      const sample = sampleGroup.slice(separator + 1)
      const targetAggregate = getAggregate(normalizedGroup, sample, target)
      const referenceAggregate = getAggregate(normalizedGroup, sample, reference)
      const displayGroup = targetAggregate?.group ?? referenceAggregate?.group ?? normalizedGroup
      const targetCt = targetAggregate ? mean(targetAggregate.values) : null
      const referenceCt = referenceAggregate ? mean(referenceAggregate.values) : null
      const base: DeltaCtResult = {
        sample,
        target,
        group: displayGroup,
        targetCt,
        referenceCt,
        technicalReplicates: targetAggregate?.values.length ?? 0,
        referenceReplicates: referenceAggregate?.values.length ?? 0,
        deltaCt: targetCt != null && referenceCt != null ? targetCt - referenceCt : null,
        controlMeanDeltaCt: null,
        deltaDeltaCt: null,
        foldChange: null,
      }
      if (!targetAggregate) {
        rows.push({ ...base, reason: "Target Ct is missing" })
      } else if (!referenceAggregate) {
        rows.push({ ...base, reason: "Reference Ct is missing" })
      } else {
        completeRows.push(base)
      }
    }

    // Each complete control sample contributes one ΔCt, regardless of its
    // technical-well count.
    const controls = completeRows
      .filter((row) => normalizeGroup(row.group) === control && row.deltaCt != null)
      .map((row) => row.deltaCt as number)
    const baseline = controls.length > 0 ? mean(controls) : null
    rows.push(...completeRows.map((row) => {
      if (baseline == null || row.deltaCt == null) {
        return { ...row, reason: "No control-group ΔCt is available" }
      }
      const deltaDeltaCt = row.deltaCt - baseline
      return {
        ...row,
        controlMeanDeltaCt: baseline,
        deltaDeltaCt,
        foldChange: 2 ** -deltaDeltaCt,
      }
    }))
  }

  return rows
}
