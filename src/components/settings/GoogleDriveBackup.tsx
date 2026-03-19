import { useState } from 'react'
import { useKmStore } from '../../store/kmStore'
import { signIn, signOut, getAccessToken } from '../../lib/googleAuth'
import { downloadBackup } from '../../lib/googleDrive'
import type { BackupData } from '../../types'

export function GoogleDriveBackup() {
  const googleDrive = useKmStore((s) => s.googleDrive)
  const setGoogleDriveState = useKmStore((s) => s.setGoogleDriveState)
  const triggerBackup = useKmStore((s) => s.triggerBackup)
  const restoreFromBackup = useKmStore((s) => s.restoreFromBackup)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [restoreData, setRestoreData] = useState<BackupData | null>(null)

  const handleSignIn = () => {
    signIn() // Redirects to Google — app reloads with token in URL hash
  }

  const handleSignOut = () => {
    signOut()
    setGoogleDriveState({
      enabled: false,
      accountEmail: null,
      lastBackupAt: null,
      pendingBackup: false,
    })
  }

  const handleBackupNow = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getAccessToken()
      if (!token) {
        setError('Sessie verlopen. Log opnieuw in met Google.')
        setGoogleDriveState({ enabled: false })
        return
      }
      await triggerBackup()
      const state = useKmStore.getState().googleDrive
      if (!state.lastBackupAt || state.pendingBackup) {
        setError('Backup lijkt niet gelukt. Token mogelijk verlopen.')
      }
    } catch (err) {
      setError(`Backup mislukt: ${err instanceof Error ? err.message : 'Onbekende fout'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getAccessToken()
      if (!token) {
        setError('Sessie verlopen. Log opnieuw in.')
        setGoogleDriveState({ enabled: false })
        return
      }
      const data = await downloadBackup(token)
      if (!data) {
        setError('Geen backup gevonden op Google Drive.')
        return
      }
      setRestoreData(data)
      setShowConfirm(true)
    } catch (err) {
      if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
        setError('Sessie verlopen. Log opnieuw in.')
        setGoogleDriveState({ enabled: false })
      } else {
        setError('Herstel mislukt. Probeer het opnieuw.')
      }
    } finally {
      setLoading(false)
    }
  }

  const confirmRestore = () => {
    if (restoreData) {
      restoreFromBackup(restoreData)
      setShowConfirm(false)
      setRestoreData(null)
    }
  }

  const cancelRestore = () => {
    setShowConfirm(false)
    setRestoreData(null)
  }

  const formatDate = (ts: number | null) => {
    if (!ts) return 'Nog geen backup'
    return new Date(ts).toLocaleString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col bg-card rounded-xl border border-border">
      <div className="px-4 pt-4 pb-3">
        <h3 className="text-sm font-medium text-foreground">Google Drive Backup</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Sla je gegevens automatisch op in Google Drive.
        </p>
      </div>

      {error && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

      {!googleDrive.enabled ? (
        <div className="px-4 pb-4">
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Inloggen met Google
          </button>
        </div>
      ) : (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {/* Account info */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {googleDrive.accountEmail ?? 'Verbonden'}
            </div>
            <button
              onClick={handleSignOut}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Uitloggen
            </button>
          </div>

          {/* Last backup */}
          <div className="text-xs text-muted-foreground">
            Laatste backup: {formatDate(googleDrive.lastBackupAt)}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleBackupNow}
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Bezig...' : 'Backup nu'}
            </button>
            <button
              onClick={handleRestore}
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground font-medium text-sm hover:bg-muted transition-colors disabled:opacity-50"
            >
              Herstel van backup
            </button>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-card rounded-xl border border-border p-5 max-w-sm w-full shadow-lg">
            <h3 className="text-base font-bold text-foreground mb-2">Backup herstellen?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Dit overschrijft al je huidige gegevens. Doorgaan?
            </p>
            {restoreData && (
              <p className="text-xs text-muted-foreground mb-4">
                Backup van: {formatDate(restoreData.exportedAt)}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={cancelRestore}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground font-medium text-sm hover:bg-muted transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={confirmRestore}
                className="flex-1 px-3 py-2 rounded-lg bg-destructive text-destructive-foreground font-medium text-sm hover:bg-destructive/90 transition-colors"
              >
                Overschrijven
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
