export interface ProteinSideChainPka {
  pKa?: number
  charge: 1 | 0 | -1
}

/** Fixed pKa approximation used by the protein-analysis page. */
export const PROTEIN_SIDE_CHAIN_PKA: Readonly<Record<string, ProteinSideChainPka>> = Object.freeze({
  A: { charge: 0 }, R: { pKa: 12.48, charge: 1 }, N: { charge: 0 }, D: { pKa: 3.65, charge: -1 },
  C: { pKa: 8.18, charge: -1 }, Q: { charge: 0 }, E: { pKa: 4.25, charge: -1 }, G: { charge: 0 },
  H: { pKa: 6.00, charge: 1 }, I: { charge: 0 }, L: { charge: 0 }, K: { pKa: 10.53, charge: 1 },
  M: { charge: 0 }, F: { charge: 0 }, P: { charge: 0 }, S: { charge: 0 }, T: { charge: 0 },
  W: { charge: 0 }, Y: { pKa: 10.07, charge: -1 }, V: { charge: 0 },
})

/** Calculate pI by bisection with the fixed pKa set above. */
export function proteinIsoelectricPoint(rawSequence: string): number {
  const sequence = rawSequence.toUpperCase().replace(/\s+/g, "")
  if (!sequence || !/^[ACDEFGHIKLMNPQRSTVWY]+$/.test(sequence)) {
    throw new TypeError("protein sequence must contain standard amino-acid symbols")
  }
  const chargeAt = (pH: number): number => {
    let charge = 1 / (1 + 10 ** (pH - 9.69)) - 1 / (1 + 10 ** (2.34 - pH))
    for (const residue of sequence) {
      const sideChain = PROTEIN_SIDE_CHAIN_PKA[residue]
      if (!sideChain.pKa) continue
      charge += sideChain.charge > 0
        ? sideChain.charge / (1 + 10 ** (pH - sideChain.pKa))
        : sideChain.charge / (1 + 10 ** (sideChain.pKa - pH))
    }
    return charge
  }
  let low = 0
  let high = 14
  while (high - low > 0.01) {
    const mid = (low + high) / 2
    if (chargeAt(mid) > 0) low = mid
    else high = mid
  }
  return (low + high) / 2
}
