import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useKmStore } from '../../store/kmStore'
import { formatDateKey, getWeekStart, today, parseDateKey } from '../../lib/dateUtils'
import { WeekStrip } from './WeekStrip'
import { MonthGrid } from './MonthGrid'
import { DayEntryForm } from '../entry/DayEntryForm'

type CalendarMode = 'week' | 'month'

export function HomeView() {
  const selectedDate = useKmStore((s) => s.selectedDate) ?? today()
  const setSelectedDate = useKmStore((s) => s.setSelectedDate)

  const [calendarMode, setCalendarMode] = useState<CalendarMode>('week')
  const [weekStart, setWeekStart] = useState(() => getWeekStart(parseDateKey(selectedDate)))

  // Track swipe direction for slide animation
  const directionRef = useRef(0)

  const handleDaySelect = (dateKey: string) => {
    directionRef.current = 0
    setSelectedDate(dateKey)
    // Keep weekStart in sync so selected day is visible
    const newDate = parseDateKey(dateKey)
    setWeekStart(getWeekStart(newDate))
    if (calendarMode === 'month') setCalendarMode('week')
  }

  const navigateDay = (delta: number) => {
    directionRef.current = delta
    const current = parseDateKey(selectedDate)
    current.setDate(current.getDate() + delta)
    const newKey = formatDateKey(current)
    setSelectedDate(newKey)
    // Update weekStart if new day is outside current week
    setWeekStart(getWeekStart(current))
  }

  const prevWeek = () => {
    setWeekStart((ws) => {
      const d = new Date(ws)
      d.setDate(d.getDate() - 7)
      return d
    })
  }

  const nextWeek = () => {
    setWeekStart((ws) => {
      const d = new Date(ws)
      d.setDate(d.getDate() + 7)
      return d
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Calendar section */}
      <div className="flex-shrink-0 border-b border-border">
        <AnimatePresence mode="wait">
          {calendarMode === 'week' ? (
            <motion.div
              key="week"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <WeekStrip
                weekStart={weekStart}
                onPrevWeek={prevWeek}
                onNextWeek={nextWeek}
                onDaySelect={handleDaySelect}
                onExpand={() => setCalendarMode('month')}
              />
            </motion.div>
          ) : (
            <motion.div
              key="month"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <MonthGrid
                initialMonth={parseDateKey(selectedDate)}
                onDaySelect={handleDaySelect}
                onCollapse={() => setCalendarMode('week')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Entry form section */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selectedDate}
            initial={{ x: directionRef.current * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -directionRef.current * 60, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) navigateDay(1)
              else if (info.offset.x > 80) navigateDay(-1)
            }}
          >
            <DayEntryForm selectedDate={selectedDate} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
