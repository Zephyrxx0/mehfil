import type { Paise } from './types'

/**
 * Format paise into Indian rupee notation.
 * @param paise - integer paise value
 * @param options.compact - if true, use lakh/crore shorthand (₹25L, ₹2.5Cr)
 */
export function formatINR(paise: Paise, options?: { compact?: boolean }): string {
  // Display as whole rupees (round to nearest)
  const rupees = Math.round(paise / 100)

  if (options?.compact) {
    // Compact Indian notation
    if (rupees >= 10_000_000) {
      // >= 1 crore
      const crores = rupees / 10_000_000
      // Use 1 decimal if not whole, otherwise no decimal
      const formatted = crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(1)
      return `₹${formatted}Cr`
    } else if (rupees >= 100_000) {
      // >= 1 lakh
      const lakhs = rupees / 100_000
      const formatted = lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)
      return `₹${formatted}L`
    } else {
      return `₹${formatIndianNumber(rupees)}`
    }
  }

  return `₹${formatIndianNumber(rupees)}`
}

/**
 * Format a number using the Indian numbering system.
 * Groups: last 3 digits, then groups of 2.
 * e.g., 1234567 → "12,34,567"
 */
function formatIndianNumber(n: number): string {
  const s = Math.abs(n).toString()
  if (s.length <= 3) return (n < 0 ? '-' : '') + s

  // Last 3 digits
  const lastThree = s.slice(-3)
  const rest = s.slice(0, -3)

  // Group rest in pairs from right
  const groups: string[] = []
  let remaining = rest
  while (remaining.length > 0) {
    groups.unshift(remaining.slice(-2))
    remaining = remaining.slice(0, -2)
  }

  // Combine (remove empty groups from leading slices)
  const allGroups = groups.filter((g) => g.length > 0)
  const result = allGroups.join(',') + ',' + lastThree
  return (n < 0 ? '-' : '') + result
}

/** Parse a numeric string, scale it by `rupeesPerUnit`, and convert to integer paise. */
function parseScaledINR(numeric: string, rupeesPerUnit: number, original: string): Paise {
  const num = parseFloat(numeric)
  if (isNaN(num)) throw new Error(`Invalid INR input: ${original}`)
  return Math.round(num * rupeesPerUnit * 100)
}

/**
 * Parse Indian rupee string into integer paise.
 * Accepts: "25L", "2.5Cr", "2500000", "₹25,00,000", "25000000"
 * Returns integer paise.
 */
export function parseINRInput(str: string): Paise {
  // Strip ₹ prefix and commas
  const s = str.trim().replace(/₹/g, '').replace(/,/g, '').trim()

  // Check for Cr suffix (crore) then L suffix (lakh); num units → rupees → paise
  if (/cr$/i.test(s)) return parseScaledINR(s.replace(/cr$/i, ''), 10_000_000, str)
  if (/l$/i.test(s)) return parseScaledINR(s.replace(/l$/i, ''), 100_000, str)

  // Plain number (in rupees)
  return parseScaledINR(s, 1, str)
}
