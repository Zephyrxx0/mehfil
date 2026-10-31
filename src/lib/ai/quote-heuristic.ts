import { parseAnchorNumber } from '@/lib/engine/quote-guard'
import type { QuoteExtractionInput } from './schemas'
import type { BudgetCategory } from '@/lib/engine/types'
import { QUOTE_FIXTURES } from './quote-fixtures'

type LineItem = QuoteExtractionInput['tiers'][number]['lineItems'][number]

/** Splits raw quote text into trimmed, non-empty lines. */
function splitLines(rawText: string): string[] {
  return rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

/** Returns a copy of the first known fixture whose needle appears in the quote text. */
function findFixtureQuote(rawText: string): QuoteExtractionInput | undefined {
  const norm = rawText.toUpperCase()
  const fixture = QUOTE_FIXTURES.find((f) => f.needles.some((needle) => norm.includes(needle)))
  return fixture ? structuredClone(fixture.quote) : undefined
}

/** Vendor name: the first line, stripped of markdown markers and capped at 50 characters. */
function parseVendorName(lines: string[]): string {
  return lines[0]?.replace(/^[*#\s]+|[*#\s]+$/g, '').slice(0, 50) || 'Celebration Vendor'
}

/** Parses one line into a line item, or null when it carries no positive amount. */
function parseLineItem(line: string): LineItem | null {
  const num = parseAnchorNumber(line)
  if (!num || num <= 0) return null

  const isPerGuest = /per plate|per guest|per person|\/plate|\/guest/i.test(line)
  const desc = line.split(/[:\-–—]|(?=[₹RsINR])/i)[0]?.trim() || 'Service Item'
  return {
    description: desc.slice(0, 100),
    amountStated: num,
    pricingType: isPerGuest ? 'per_guest' : 'flat',
    sourceAnchor: line.slice(0, 200),
  }
}

/** Line items for every priced line, in source order. */
function parseLineItems(lines: string[]): LineItem[] {
  return lines.map(parseLineItem).filter((item): item is LineItem => item !== null)
}

/** Placeholder item used when no line carries a price. */
function fallbackLineItem(lines: string[]): LineItem {
  const firstLine = lines[0] || 'Celebration Quote'
  return {
    description: 'Vendor Service Package',
    amountStated: 10000,
    pricingType: 'flat',
    sourceAnchor: firstLine.slice(0, 100),
  }
}

/**
 * Deterministic heuristic quote parser for Tier 3 zero-network resilience (D-02, ADR-0007).
 */
export function extractDeterministicQuote(
  rawText: string,
  category: BudgetCategory
): QuoteExtractionInput {
  const fixtureQuote = findFixtureQuote(rawText)
  if (fixtureQuote) return fixtureQuote

  // Generic heuristic fallback for arbitrary text
  const lines = splitLines(rawText)
  const parsedItems = parseLineItems(lines)
  const lineItems = parsedItems.length > 0 ? parsedItems : [fallbackLineItem(lines)]

  return {
    vendorName: parseVendorName(lines),
    category,
    statedInclusions: ['Service setup', 'Staff attendance'],
    statedExclusions: ['Taxes as applicable'],
    paymentTerms: '50% advance, balance on completion.',
    tiers: [
      {
        tierId: 'tier_standard',
        name: 'Standard Package',
        lineItems,
      },
    ],
  }
}
