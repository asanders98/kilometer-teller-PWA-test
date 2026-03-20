import { useKmStore } from '../../store/kmStore'
import { cn } from '../../lib/utils'
import type { AppSettings } from '../../types'
import { GoogleDriveBackup } from './GoogleDriveBackup'

const THEME_OPTIONS: { value: AppSettings['theme']; label: string; icon: string }[] = [
  { value: 'light', label: 'Licht', icon: '☀️' },
  { value: 'dark', label: 'Donker', icon: '🌙' },
  { value: 'system', label: 'Systeem', icon: '💻' },
]

export function SettingsView() {
  const settings = useKmStore((s) => s.settings)
  const updateSettings = useKmStore((s) => s.updateSettings)

  return (
    <div className="flex flex-col gap-6 px-4 py-5 max-w-lg mx-auto">
      <div>
        <h2 className="text-xl font-bold text-foreground">Instellingen</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Deze gegevens worden gebruikt in het Excel-bestand.
        </p>
      </div>

      {/* Profile info */}
      <div className="flex flex-col bg-card rounded-xl border border-border divide-y divide-border">
        <div className="px-4 pt-4 pb-3">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Werknemer (jouw naam)
          </label>
          <input
            type="text"
            value={settings.werknemer}
            onChange={(e) => updateSettings({ werknemer: e.target.value })}
            placeholder="Voornaam Achternaam"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring text-base transition-shadow"
          />
        </div>

        <div className="px-4 pt-3 pb-4">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Klant
          </label>
          <input
            type="text"
            value={settings.klant}
            onChange={(e) => updateSettings({ klant: e.target.value })}
            placeholder="Naam van de klant"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring text-base transition-shadow"
          />
        </div>
      </div>

      {/* Lease / km budget */}
      <div className="flex flex-col bg-card rounded-xl border border-border divide-y divide-border">
        <div className="px-4 pt-4 pb-3">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Km limiet per jaar
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={settings.kmLimiet || 25000}
            onChange={(e) => updateSettings({ kmLimiet: parseInt(e.target.value) || 25000 })}
            placeholder="25000"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring text-base transition-shadow"
          />
        </div>

        <div className="px-4 pt-3 pb-4">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Startdatum lease
          </label>
          <input
            type="date"
            value={settings.leaseStartDatum || ''}
            onChange={(e) => updateSettings({ leaseStartDatum: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring text-base transition-shadow"
          />
        </div>
      </div>

      {/* Theme toggle */}
      <div className="flex flex-col bg-card rounded-xl border border-border px-4 py-4 gap-3">
        <label className="text-sm font-medium text-foreground">Weergave</label>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateSettings({ theme: opt.value })}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors',
                settings.theme === opt.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Google Drive Backup */}
      <GoogleDriveBackup />

      <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-sm text-primary">
        Gegevens worden automatisch opgeslagen op dit apparaat.
      </div>

      <p className="text-center text-xs text-muted-foreground/50">
        v{__APP_VERSION__} — {new Date(__BUILD_TIME__).toLocaleString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  )
}
