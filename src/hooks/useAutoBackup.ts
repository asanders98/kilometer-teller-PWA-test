import { useEffect, useRef } from 'react'
import { useKmStore } from '../store/kmStore'

const DEBOUNCE_MS = 5_000

export function useAutoBackup() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const enabled = useKmStore((s) => s.googleDrive.enabled)
  const entries = useKmStore((s) => s.entries)
  const settings = useKmStore((s) => s.settings)
  const triggerBackup = useKmStore((s) => s.triggerBackup)
  const pendingBackup = useKmStore((s) => s.googleDrive.pendingBackup)

  // Track previous values to detect changes
  const prevRef = useRef({ entries, settings })

  useEffect(() => {
    if (!enabled) return

    // Check if entries or settings actually changed
    const prev = prevRef.current
    if (prev.entries === entries && prev.settings === settings) return
    prevRef.current = { entries, settings }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (navigator.onLine) {
        triggerBackup()
      } else {
        useKmStore.getState().setGoogleDriveState({ pendingBackup: true })
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [enabled, entries, settings, triggerBackup])

  // Retry pending backups when coming back online
  useEffect(() => {
    const handleOnline = () => {
      const state = useKmStore.getState()
      if (state.googleDrive.enabled && state.googleDrive.pendingBackup) {
        state.triggerBackup()
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  // Also retry pending on mount if online
  useEffect(() => {
    if (enabled && pendingBackup && navigator.onLine) {
      triggerBackup()
    }
  }, [enabled, pendingBackup, triggerBackup])
}
