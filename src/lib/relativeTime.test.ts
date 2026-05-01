import { describe, it, expect, vi, afterEach } from 'vitest'
import { relativeTime } from './relativeTime'

const NOW = new Date('2026-05-01T12:00:00Z').getTime()

function msAgo(ms: number) {
  return new Date(NOW - ms).toISOString()
}

describe('relativeTime', () => {
  beforeEach(() => {
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "gerade eben" for timestamps less than 1 minute ago', () => {
    expect(relativeTime(msAgo(30_000))).toBe('gerade eben')
    expect(relativeTime(msAgo(0))).toBe('gerade eben')
  })

  it('returns minutes ago for 1–59 minutes', () => {
    const result = relativeTime(msAgo(5 * 60_000))
    expect(result).toContain('5')
    expect(result).toContain('Minute')
  })

  it('returns hours ago for 1–23 hours', () => {
    const result = relativeTime(msAgo(3 * 60 * 60_000))
    expect(result).toContain('3')
    expect(result).toContain('Stunde')
  })

  it('returns days ago for 24+ hours', () => {
    const result = relativeTime(msAgo(3 * 24 * 60 * 60_000))
    expect(result).toContain('3')
    expect(result).toContain('Tag')
  })

  it('returns "gerade eben" at exactly 59 seconds ago', () => {
    expect(relativeTime(msAgo(59_000))).toBe('gerade eben')
  })

  it('returns minutes for exactly 60 minutes', () => {
    const result = relativeTime(msAgo(60 * 60_000))
    expect(result).toContain('Stunde')
  })
})
