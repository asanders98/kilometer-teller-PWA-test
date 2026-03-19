import { useState, useEffect } from 'react'
import { useKmStore } from '../../store/kmStore'
import { calculateKm } from '../../lib/calculations'
import { formatDisplayDate, formatDateKey } from '../../lib/dateUtils'
import type { KmReading } from '../../types'
import { OdometerInput } from './OdometerInput'
import { CalculatedSummary } from './CalculatedSummary'

interface DayEntryFormProps {
  selectedDate: string
}

export function DayEntryForm({ selectedDate }: DayEntryFormProps) {
  const getEntry = useKmStore((s) => s.getEntry)
  const upsertEntry = useKmStore((s) => s.upsertEntry)
  const deleteEntry = useKmStore((s) => s.deleteEntry)
  const entries = useKmStore((s) => s.entries)

  const [readings, setReadings] = useState<KmReading>({
    leaveHome: null,
    arriveFirstClient: null,
    arriveLastClient: null,
    arriveHome: null,
  })

  useEffect(() => {
    const entry = getEntry(selectedDate)
    if (entry) {
      setReadings(entry.readings)
    } else {
      setReadings({ leaveHome: null, arriveFirstClient: null, arriveLastClient: null, arriveHome: null })
    }
  }, [selectedDate, getEntry])

  const update = (field: keyof KmReading, value: number | null) => {
    const next = { ...readings, [field]: value }
    setReadings(next)
    // Auto-save outside the state updater to avoid Zustand update mid-render
    const hasAny = Object.values(next).some((v) => v !== null)
    if (hasAny) upsertEntry(selectedDate, next)
    else deleteEntry(selectedDate)
  }

  const getPreviousDayReturn = (): { value: number; dateKey: string } | null => {
    const date = new Date(selectedDate)
    for (let i = 1; i <= 7; i++) {
      const prev = new Date(date)
      prev.setDate(date.getDate() - i)
      const key = formatDateKey(prev)
      const entry = entries[key]
      if (entry?.readings.arriveHome != null) {
        return { value: entry.readings.arriveHome, dateKey: key }
      }
    }
    return null
  }

  const prevReturn = getPreviousDayReturn()
  const calc = calculateKm(readings)

  const formatShortDate = (dateKey: string) => {
    const d = new Date(dateKey + 'T00:00:00')
    return `${d.getDate()}/${d.getMonth() + 1}`
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 pb-8 max-w-lg mx-auto">
      <h2 className="text-base font-semibold text-foreground capitalize">
        {formatDisplayDate(selectedDate)}
      </h2>

      <div className="flex flex-col gap-3">
        <div>
          <OdometerInput
            label="Km vertrek thuis"
            value={readings.leaveHome}
            onChange={(v) => update('leaveHome', v)}
            minValue={prevReturn?.value}
          />
          {prevReturn != null && readings.leaveHome == null && (
            <button
              onClick={() => update('leaveHome', prevReturn.value)}
              className="mt-1 text-xs text-primary active:opacity-60"
            >
              ↩ Kopieer {formatShortDate(prevReturn.dateKey)} ({prevReturn.value.toLocaleString('nl-BE')} km)
            </button>
          )}
        </div>

        <OdometerInput
          label="Km aankomst 1e post"
          value={readings.arriveFirstClient}
          onChange={(v) => update('arriveFirstClient', v)}
          minValue={readings.leaveHome}
        />

        <OdometerInput
          label="Km aankomst laatste post"
          value={readings.arriveLastClient}
          onChange={(v) => update('arriveLastClient', v)}
          minValue={readings.arriveFirstClient ?? readings.leaveHome}
        />

        <OdometerInput
          label="Km terug thuis"
          value={readings.arriveHome}
          onChange={(v) => update('arriveHome', v)}
          minValue={readings.arriveLastClient ?? readings.arriveFirstClient ?? readings.leaveHome}
        />
      </div>

      <CalculatedSummary calc={calc} />
    </div>
  )
}
