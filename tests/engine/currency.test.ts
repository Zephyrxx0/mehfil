import { describe, it, expect } from 'vitest'
import { formatINR, parseINRInput } from '@/lib/engine/currency'

describe('formatINR', () => {
  it('formats whole rupees in Indian numbering', () => {
    expect(formatINR(250_000_000)).toBe('₹25,00,000') // ₹25 lakh
    expect(formatINR(50_000_000)).toBe('₹5,00,000') // ₹5 lakh
    expect(formatINR(10_000_000)).toBe('₹1,00,000') // ₹1 lakh
    expect(formatINR(100_000)).toBe('₹1,000') // ₹1000
    expect(formatINR(500)).toBe('₹5') // ₹5
  })

  it('formats compact lakh notation', () => {
    expect(formatINR(250_000_000, { compact: true })).toBe('₹25L')
    expect(formatINR(50_000_000, { compact: true })).toBe('₹5L')
    expect(formatINR(125_000_000, { compact: true })).toBe('₹12.5L')
  })

  it('formats compact crore notation', () => {
    expect(formatINR(1_000_000_000, { compact: true })).toBe('₹1Cr')
    expect(formatINR(2_500_000_000, { compact: true })).toBe('₹2.5Cr')
    expect(formatINR(10_000_000_000, { compact: true })).toBe('₹10Cr')
  })

  it('rounds paise to nearest rupee', () => {
    expect(formatINR(150)).toBe('₹2') // 1.5 rupees rounds to 2
    expect(formatINR(149)).toBe('₹1') // 1.49 rounds to 1
    expect(formatINR(0)).toBe('₹0')
  })
})

describe('parseINRInput', () => {
  it('parses plain numbers as rupees to paise', () => {
    expect(parseINRInput('2500000')).toBe(250_000_000)
    expect(parseINRInput('500000')).toBe(50_000_000)
  })

  it('parses lakh notation', () => {
    expect(parseINRInput('25L')).toBe(250_000_000)
    expect(parseINRInput('25l')).toBe(250_000_000)
    expect(parseINRInput('5L')).toBe(50_000_000)
    expect(parseINRInput('2.5L')).toBe(25_000_000)
  })

  it('parses crore notation', () => {
    expect(parseINRInput('1Cr')).toBe(1_000_000_000) // 1 crore in paise
    expect(parseINRInput('2.5Cr')).toBe(2_500_000_000) // 2.5 crore in paise
  })

  it('parses ₹ prefix and commas', () => {
    expect(parseINRInput('₹25,00,000')).toBe(250_000_000)
    expect(parseINRInput('₹5,00,000')).toBe(50_000_000)
  })
})
