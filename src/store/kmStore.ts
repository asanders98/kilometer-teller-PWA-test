import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { KmStore, KmEntry, KmReading } from '../types'

export const useKmStore = create<KmStore>()(
  persist(
    (set, get) => ({
      entries: {},
      selectedDate: null,
      settings: {
        werknemer: '',
        klant: '',
        theme: 'system',
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
    }),
    {
      name: 'km-teller-storage',
    }
  )
)
