import type { Paise } from '../types'

/**
 * Hare-Niemeyer largest-remainder apportionment.
 * Distributes totalPaise across lines according to ratios.
 * INVARIANT: sum(returned values) === totalPaise exactly.
 *
 * @param totalPaise - integer paise to distribute
 * @param ratios - fractions for each line (must sum to 1.0)
 * @returns integer paise for each line
 */
export function apportionRupees(totalPaise: Paise, ratios: number[]): Paise[] {
  if (ratios.length === 0) return []

  // Work in whole rupees for apportionment, then convert back
  const totalRupees = Math.round(totalPaise / 100)

  // Compute quotas (floating point OK here — only for computing remainders)
  const quotas = ratios.map((r) => r * totalRupees)

  // Take floors
  const floors = quotas.map((q) => Math.floor(q))
  const remainders = quotas.map((q, i) => q - floors[i])

  // How many extra rupees to distribute?
  const sumFloors = floors.reduce((a, b) => a + b, 0)
  const extra = totalRupees - sumFloors

  // Largest-remainder: sort by remainder descending, give extra to top N
  const indices = remainders.map((r, i) => ({ r, i })).sort((a, b) => b.r - a.r)

  const rupees = [...floors]
  for (let k = 0; k < extra; k++) {
    rupees[indices[k].i] += 1
  }

  // Convert to paise
  const paises = rupees.map((r) => r * 100)

  // Verify invariant
  const sum = paises.reduce((a, b) => a + b, 0)
  if (sum !== totalPaise) {
    // Adjust last element to fix any paise-level rounding from totalPaise not being divisible by 100
    paises[paises.length - 1] += totalPaise - sum
  }

  return paises
}
