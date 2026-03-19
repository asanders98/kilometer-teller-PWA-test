import { useState } from 'react'
import { useKmStore } from '../../store/kmStore'
import { exportMonthToExcel } from '../../lib/excelExport'
import { getDutchMonthName } from '../../lib/dateUtils'
import { calculateKm, isEntryComplete } from '../../lib/calculations'

export function ExportModal() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [exporting, setExporting] = useState(false)

  const getMonthEntries = useKmStore((s) => s.getMonthEntries)
  const settings = useKmStore((s) => s.settings)

  const entries = getMonthEntries(year, month)
  const completeCount = entries.filter((e) => isEntryComplete(e.readings)).length
  const totalBeroepsmatig = entries.reduce((sum, e) => {
    const calc = calculateKm(e.readings)
    return sum + (calc.beroepsmatig ?? 0)
  }, 0)

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportMonthToExcel(entries, year, month, settings)
    } finally {
      setExporting(false)
    }
  }

  const monthName = getDutchMonthName(month)
  const cap = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  return (
    <div className="flex flex-col gap-6 px-4 py-5 max-w-lg mx-auto">
      <div>
        <h2 className="text-xl font-bold text-foreground">Exporteren</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Download de km-standen als Excel-bestand.
        </p>
      </div>

      {/* Month picker */}
      <div className="flex items-center justify-between bg-card rounded-xl border border-border px-4 py-3">
        <button
          onClick={prevMonth}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary active:bg-muted text-xl text-foreground transition-colors"
        >
          ‹
        </button>
        <span className="font-semibold text-foreground">
          {cap} {year}
        </span>
        <button
          onClick={nextMonth}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary active:bg-muted text-xl text-foreground transition-colors"
        >
          ›
        </button>
      </div>

      {/* Summary */}
      <div className="bg-card rounded-xl border border-border divide-y divide-border">
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm text-muted-foreground">Dagen ingevuld</span>
          <span className="font-semibold text-foreground">
            {completeCount} {entries.length > 0 ? `/ ${entries.length}` : ''}
          </span>
        </div>
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm font-medium text-primary">Totaal beroepsmatig</span>
          <span className="font-bold text-primary">
            {totalBeroepsmatig > 0 ? `${totalBeroepsmatig.toLocaleString('nl-BE')} km` : '—'}
          </span>
        </div>
      </div>

      {entries.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-2">
          Geen gegevens voor {cap} {year}.
        </p>
      )}

      {(!settings.werknemer || !settings.klant) && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 text-sm text-foreground">
          ⚠️ Vul je naam en klant in bij <span className="font-medium">Instellingen</span> voor een volledig Excel-bestand.
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={entries.length === 0 || exporting}
        className="w-full py-4 bg-primary text-primary-foreground font-semibold rounded-xl active:opacity-90 disabled:bg-muted disabled:text-muted-foreground transition-colors"
      >
        {exporting ? 'Bezig...' : '⬇ Download Excel'}
      </button>
    </div>
  )
}
