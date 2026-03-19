import { useState, useMemo } from 'react'
import { DayPicker } from 'react-day-picker'
import { useKmStore } from '../../store/kmStore'
import { isEntryComplete, isEntryPartial } from '../../lib/calculations'
import { formatDateKey } from '../../lib/dateUtils'
import 'react-day-picker/style.css'

const DUTCH_WEEKDAYS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']
const DUTCH_MONTHS_FULL = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
]

interface CalendarViewProps {
  onDaySelect: (dateKey: string) => void
}

export function CalendarView({ onDaySelect }: CalendarViewProps) {
  const [month, setMonth] = useState(new Date())
  const entries = useKmStore((s) => s.entries)
  const selectedDate = useKmStore((s) => s.selectedDate)

  const { completeDays, partialDays } = useMemo(() => {
    const complete: Date[] = []
    const partial: Date[] = []
    Object.values(entries).forEach((entry) => {
      const date = new Date(entry.date + 'T00:00:00')
      if (isEntryComplete(entry.readings)) {
        complete.push(date)
      } else if (isEntryPartial(entry.readings)) {
        partial.push(date)
      }
    })
    return { completeDays: complete, partialDays: partial }
  }, [entries])

  const selected = selectedDate ? new Date(selectedDate + 'T00:00:00') : undefined

  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    const key = formatDateKey(date)
    onDaySelect(key)
  }

  const caption = `${DUTCH_MONTHS_FULL[month.getMonth()] ?? ''} ${month.getFullYear()}`

  return (
    <div className="flex flex-col items-center px-2 py-4">
      {/* Custom month header */}
      <div className="flex items-center justify-between w-full max-w-sm mb-2 px-2">
        <button
          onClick={() => setMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() - 1); return d })}
          className="w-10 h-10 flex items-center justify-center rounded-lg active:bg-gray-100 text-xl text-gray-600"
        >
          ‹
        </button>
        <span className="font-semibold text-gray-800 capitalize">{caption}</span>
        <button
          onClick={() => setMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() + 1); return d })}
          className="w-10 h-10 flex items-center justify-center rounded-lg active:bg-gray-100 text-xl text-gray-600"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 w-full max-w-sm mb-1">
        {DUTCH_WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      <DayPicker
        mode="single"
        selected={selected}
        onSelect={handleSelect}
        month={month}
        onMonthChange={setMonth}
        weekStartsOn={1}
        hideNavigation
        hideWeekdays
        components={{ MonthCaption: () => <></> }}
        modifiers={{
          complete: completeDays,
          partial: partialDays,
        }}
        modifiersClassNames={{
          complete: 'day-complete',
          partial: 'day-partial',
        }}
        className="w-full max-w-sm"
      />

      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Volledig
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          Gedeeltelijk
        </span>
      </div>
    </div>
  )
}
