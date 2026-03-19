export interface KmReading {
  leaveHome: number | null
  arriveFirstClient: number | null
  arriveLastClient: number | null
  arriveHome: number | null
}

export interface KmEntry {
  date: string // "YYYY-MM-DD"
  readings: KmReading
  updatedAt: number
}

export interface CalculatedKm {
  totaal: number | null       // arriveHome - leaveHome
  beroepsmatig: number | null // arriveLastClient - arriveFirstClient
}

export interface AppSettings {
  werknemer: string
  klant: string
  theme: 'light' | 'dark' | 'system'
}

export type TabId = 'home' | 'export' | 'settings'

export interface KmStore {
  entries: Record<string, KmEntry>
  selectedDate: string | null
  settings: AppSettings

  setSelectedDate: (date: string | null) => void
  upsertEntry: (date: string, readings: Partial<KmReading>) => void
  deleteEntry: (date: string) => void
  getEntry: (date: string) => KmEntry | undefined
  getMonthEntries: (year: number, month: number) => KmEntry[]
  updateSettings: (settings: Partial<AppSettings>) => void
}
