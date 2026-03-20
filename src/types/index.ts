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
  kmLimiet: number        // annual km limit (default 25000)
  leaseStartDatum: string // lease start date "YYYY-MM-DD"
}

export type TabId = 'home' | 'car' | 'export' | 'settings'

export interface BackupData {
  version: 1
  exportedAt: number
  entries: Record<string, KmEntry>
  settings: AppSettings
}

export interface GoogleDriveState {
  enabled: boolean
  lastBackupAt: number | null
  accountEmail: string | null
  pendingBackup: boolean
}

export interface KmStore {
  entries: Record<string, KmEntry>
  selectedDate: string | null
  settings: AppSettings
  googleDrive: GoogleDriveState

  setSelectedDate: (date: string | null) => void
  upsertEntry: (date: string, readings: Partial<KmReading>) => void
  deleteEntry: (date: string) => void
  getEntry: (date: string) => KmEntry | undefined
  getMonthEntries: (year: number, month: number) => KmEntry[]
  updateSettings: (settings: Partial<AppSettings>) => void
  setGoogleDriveState: (state: Partial<GoogleDriveState>) => void
  triggerBackup: () => Promise<void>
  restoreFromBackup: (data: BackupData) => void
}
