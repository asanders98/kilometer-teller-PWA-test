const DUTCH_MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
]

const DUTCH_DAYS_SHORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']
const DUTCH_DAYS_LONG = [
  'zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag',
]

export function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

export function formatDisplayDate(dateKey: string): string {
  const date = parseDateKey(dateKey)
  const dayName = DUTCH_DAYS_LONG[date.getDay()]!
  const day = date.getDate()
  const month = DUTCH_MONTHS[date.getMonth()]!
  const year = date.getFullYear()
  return `${dayName} ${day} ${month} ${year}`
}

export function formatShortDate(dateKey: string): string {
  const date = parseDateKey(dateKey)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function getDutchDayShort(date: Date): string {
  return DUTCH_DAYS_SHORT[date.getDay()]!.toUpperCase()
}

export function getDutchMonthName(month: number): string {
  return DUTCH_MONTHS[month - 1]!
}

export function getWorkdaysForMonth(year: number, month: number): Date[] {
  const workdays: Date[] = []
  const date = new Date(year, month - 1, 1)
  while (date.getMonth() === month - 1) {
    const dow = date.getDay()
    if (dow !== 0 && dow !== 6) {
      workdays.push(new Date(date))
    }
    date.setDate(date.getDate() + 1)
  }
  return workdays
}

export function today(): string {
  return formatDateKey(new Date())
}

export function sameMonth(dateKey: string, year: number, month: number): boolean {
  const date = parseDateKey(dateKey)
  return date.getFullYear() === year && date.getMonth() + 1 === month
}

/** Returns the Monday of the week that contains `date`. */
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Returns the 7 dates [Mon, Tue, ..., Sun] for the week starting at `weekStart`. */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
}

/** Returns "Ma" through "Zo" for day index 0=Mon..6=Sun (week-relative). */
export const WEEK_DAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'] as const

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}
