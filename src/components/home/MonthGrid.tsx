import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import { useKmStore } from '../../store/kmStore'
import { isEntryComplete, isEntryPartial } from '../../lib/calculations'
import { formatDateKey, getDutchMonthName, isSameDay } from '../../lib/dateUtils'
import { cn } from '../../lib/utils'

const WEEKDAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

interface MonthGridProps {
  initialMonth: Date
  onDaySelect: (dateKey: string) => void
  onCollapse: () => void
}

export function MonthGrid({ initialMonth, onDaySelect, onCollapse }: MonthGridProps) {
  const [month, setMonth] = useState(initialMonth)
  const entries = useKmStore((s) => s.entries)
  const selectedDate = useKmStore((s) => s.selectedDate)
  const today = new Date()

  const caption = `${getDutchMonthName(month.getMonth() + 1).charAt(0).toUpperCase() + getDutchMonthName(month.getMonth() + 1).slice(1)} ${month.getFullYear()}`

  // Build calendar grid cells
  const cells = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    // Monday=0 offset
    const startOffset = (firstDay.getDay() + 6) % 7
    const result: (Date | null)[] = []
    for (let i = 0; i < startOffset; i++) result.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) {
      result.push(new Date(month.getFullYear(), month.getMonth(), d))
    }
    while (result.length % 7 !== 0) result.push(null)
    return result
  }, [month])

  return (
    <div className="px-3 pt-3 pb-2 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() - 1); return d })}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Vorige maand"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-foreground">{caption}</span>
        <button
          onClick={() => setMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() + 1); return d })}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Volgende maand"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />
          const key = formatDateKey(day)
          const isSelected = selectedDate === key
          const isToday = isSameDay(day, today)
          const entry = entries[key]
          const complete = entry ? isEntryComplete(entry.readings) : false
          const partial = entry ? isEntryPartial(entry.readings) : false
          const isWeekend = day.getDay() === 0 || day.getDay() === 6

          return (
            <button
              key={key}
              onClick={() => onDaySelect(key)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1 rounded-lg transition-colors',
                isSelected
                  ? 'bg-primary'
                  : isToday
                  ? 'bg-primary/10'
                  : 'hover:bg-secondary',
                isWeekend && !isSelected && 'opacity-50',
              )}
            >
              <span
                className={cn(
                  'text-sm font-medium leading-none',
                  isSelected
                    ? 'text-primary-foreground'
                    : isToday
                    ? 'text-primary'
                    : 'text-foreground',
                )}
              >
                {day.getDate()}
              </span>
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  complete
                    ? isSelected ? 'bg-primary-foreground' : 'bg-success'
                    : partial
                    ? isSelected ? 'bg-primary-foreground/60' : 'bg-warning'
                    : 'bg-transparent',
                )}
              />
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />Volledig
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-warning inline-block" />Gedeeltelijk
        </span>
      </div>

      {/* Collapse button — bottom center */}
      <div className="flex justify-center mt-1">
        <button
          onClick={onCollapse}
          aria-label="Weekoverzicht"
          className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <ChevronUp size={14} />
        </button>
      </div>
    </div>
  )
}
