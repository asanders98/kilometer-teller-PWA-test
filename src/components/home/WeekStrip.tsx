import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import {
  formatDateKey,
  getWeekDays,
  WEEK_DAY_LABELS,
  isSameDay,
  getDutchMonthName,
} from '../../lib/dateUtils'
import { useKmStore } from '../../store/kmStore'
import { isEntryComplete, isEntryPartial } from '../../lib/calculations'

interface WeekStripProps {
  weekStart: Date
  onPrevWeek: () => void
  onNextWeek: () => void
  onDaySelect: (dateKey: string) => void
  onExpand: () => void
}

export function WeekStrip({
  weekStart,
  onPrevWeek,
  onNextWeek,
  onDaySelect,
  onExpand,
}: WeekStripProps) {
  const selectedDate = useKmStore((s) => s.selectedDate)
  const entries = useKmStore((s) => s.entries)
  const days = getWeekDays(weekStart)
  const today = new Date()

  const monthLabel = useMemo(() => {
    const first = days[0]!
    const last = days[6]!
    const m1 = getDutchMonthName(first.getMonth() + 1)
    const m2 = getDutchMonthName(last.getMonth() + 1)
    const year = last.getFullYear()
    if (first.getMonth() === last.getMonth()) {
      return `${m1.charAt(0).toUpperCase() + m1.slice(1)} ${year}`
    }
    return `${m1.charAt(0).toUpperCase() + m1.slice(1)} – ${m2.charAt(0).toUpperCase() + m2.slice(1)} ${year}`
  }, [days])

  return (
    <div className="px-3 pt-3 pb-2 bg-card">
      {/* Header row: prev | month label | next */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onPrevWeek}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Vorige week"
        >
          <ChevronLeft size={18} />
        </button>

        <span className="text-sm font-semibold text-foreground">{monthLabel}</span>

        <button
          onClick={onNextWeek}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Volgende week"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          const key = formatDateKey(day)
          const isSelected = selectedDate === key
          const isToday = isSameDay(day, today)
          const entry = entries[key]
          const complete = entry ? isEntryComplete(entry.readings) : false
          const partial = entry ? isEntryPartial(entry.readings) : false
          const isWeekend = i >= 5 // Sa, Zo

          return (
            <button
              key={key}
              onClick={() => onDaySelect(key)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-colors',
                isSelected
                  ? 'bg-primary'
                  : isToday
                  ? 'bg-primary/10'
                  : 'hover:bg-secondary',
                isWeekend && !isSelected && 'opacity-60',
              )}
            >
              <span
                className={cn(
                  'text-[10px] font-medium leading-none',
                  isSelected ? 'text-primary-foreground' : 'text-muted-foreground',
                )}
              >
                {WEEK_DAY_LABELS[i]}
              </span>
              <span
                className={cn(
                  'text-sm font-semibold leading-none',
                  isSelected
                    ? 'text-primary-foreground'
                    : isToday
                    ? 'text-primary'
                    : 'text-foreground',
                )}
              >
                {day.getDate()}
              </span>
              {/* Status dot */}
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  complete
                    ? 'bg-success'
                    : partial
                    ? 'bg-warning'
                    : 'bg-transparent',
                  isSelected && complete && 'bg-primary-foreground',
                  isSelected && partial && 'bg-primary-foreground/60',
                )}
              />
            </button>
          )
        })}
      </div>

      {/* Expand button — bottom center */}
      <div className="flex justify-center mt-1">
        <button
          onClick={onExpand}
          aria-label="Maandoverzicht"
          className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  )
}
