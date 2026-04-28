import { describe, it, expect } from 'vitest'
import { selectEntriesForExport } from './excelExport'
import type { KmEntry } from '../types'

function makeEntry(date: string): KmEntry {
  return {
    date,
    readings: {
      leaveHome: 1000,
      arriveFirstClient: 1010,
      arriveLastClient: 1050,
      arriveHome: 1060,
    },
    updatedAt: 0,
  }
}

describe('selectEntriesForExport', () => {
  it('sorts entries chronologically by date', () => {
    const result = selectEntriesForExport(
      [makeEntry('2026-04-15'), makeEntry('2026-04-01'), makeEntry('2026-04-08')],
      29,
    )
    expect(result.map((e) => e.date)).toEqual([
      '2026-04-01',
      '2026-04-08',
      '2026-04-15',
    ])
  })

  it('includes weekend entries (regression: weekends were dropped)', () => {
    // 2026-04-04 = Saturday, 2026-04-05 = Sunday, 2026-04-06 = Monday
    const monday = makeEntry('2026-04-06')
    const saturday = makeEntry('2026-04-04')
    const sunday = makeEntry('2026-04-05')
    const result = selectEntriesForExport([monday, saturday, sunday], 29)
    expect(result.map((e) => e.date)).toEqual([
      '2026-04-04',
      '2026-04-05',
      '2026-04-06',
    ])
  })

  it('caps at maxRows, keeping the chronologically earliest entries', () => {
    const dates = [
      '2026-04-01',
      '2026-04-02',
      '2026-04-03',
      '2026-04-04',
      '2026-04-05',
      '2026-04-06',
    ]
    const result = selectEntriesForExport(dates.map(makeEntry), 3)
    expect(result.map((e) => e.date)).toEqual([
      '2026-04-01',
      '2026-04-02',
      '2026-04-03',
    ])
  })

  it('does not mutate the input array', () => {
    const input = [makeEntry('2026-04-15'), makeEntry('2026-04-01')]
    const snapshot = input.map((e) => e.date)
    selectEntriesForExport(input, 29)
    expect(input.map((e) => e.date)).toEqual(snapshot)
  })

  it('returns an empty array for empty input', () => {
    expect(selectEntriesForExport([], 29)).toEqual([])
  })
})
