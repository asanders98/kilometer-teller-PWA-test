import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { KmStore, KmEntry, KmReading, BackupData } from '../types'
import { getAccessToken } from '../lib/googleAuth'
import { uploadBackup } from '../lib/googleDrive'
import { formatDateKey } from '../lib/dateUtils'

export const useKmStore = create<KmStore>()(
  persist(
    (set, get) => ({
      entries: {},
      selectedDate: null,
      settings: {
        werknemer: '',
        klant: '',
        theme: 'system',
        kmLimiet: 25000,
        leaseStartDatum: formatDateKey(new Date()),
        geminiApiKey: '',
      },
      googleDrive: {
        enabled: false,
        lastBackupAt: null,
        accountEmail: null,
        pendingBackup: false,
      },

      setSelectedDate: (date) => set({ selectedDate: date }),

      upsertEntry: (date, readings) => {
        const existing = get().entries[date]
        const currentReadings: KmReading = existing?.readings ?? {
          leaveHome: null,
          arriveFirstClient: null,
          arriveLastClient: null,
          arriveHome: null,
        }
        const updated: KmEntry = {
          date,
          readings: { ...currentReadings, ...readings },
          updatedAt: Date.now(),
        }
        set((state) => ({
          entries: { ...state.entries, [date]: updated },
        }))
      },

      deleteEntry: (date) => {
        set((state) => {
          const entries = { ...state.entries }
          delete entries[date]
          return { entries }
        })
      },

      getEntry: (date) => get().entries[date],

      getMonthEntries: (year, month) => {
        const entries = get().entries
        return Object.values(entries).filter((entry) => {
          const d = new Date(entry.date)
          return d.getFullYear() === year && d.getMonth() + 1 === month
        })
      },

      updateSettings: (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }))
      },

      setGoogleDriveState: (driveState) => {
        set((state) => ({
          googleDrive: { ...state.googleDrive, ...driveState },
        }))
      },

      triggerBackup: async () => {
        const token = getAccessToken()
        if (!token) {
          set((state) => ({
            googleDrive: { ...state.googleDrive, enabled: false, pendingBackup: true },
          }))
          throw new Error('Geen geldige token. Log opnieuw in.')
        }

        const { entries, settings } = get()
        const backupData: BackupData = {
          version: 1,
          exportedAt: Date.now(),
          entries,
          settings,
        }

        await uploadBackup(backupData, token)
        set((state) => ({
          googleDrive: {
            ...state.googleDrive,
            lastBackupAt: Date.now(),
            pendingBackup: false,
          },
        }))
      },

      restoreFromBackup: (data) => {
        set({
          entries: data.entries,
          settings: {
            ...get().settings,
            ...data.settings,
          },
        })
      },
    }),
    {
      name: 'km-teller-storage',
    }
  )
)
