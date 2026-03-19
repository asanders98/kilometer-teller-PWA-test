import type { CalculatedKm } from '../../types'
import { cn } from '../../lib/utils'

interface CalculatedSummaryProps {
  calc: CalculatedKm
}

function KmRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number | null
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'flex justify-between items-center py-2 px-3 rounded-lg',
        highlight ? 'bg-primary/10 border border-primary/20' : 'bg-muted',
      )}
    >
      <span className={cn('text-sm', highlight ? 'font-semibold text-primary' : 'text-muted-foreground')}>
        {label}
      </span>
      <span
        className={cn(
          'font-mono text-base',
          highlight ? 'font-bold text-primary' : value != null ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {value != null ? `${value.toLocaleString('nl-BE')} km` : '—'}
      </span>
    </div>
  )
}

export function CalculatedSummary({ calc }: CalculatedSummaryProps) {
  if (calc.totaal == null && calc.beroepsmatig == null) return null

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Berekening
      </h3>
      <div className="flex flex-col gap-1.5">
        <KmRow label="Totaal dag" value={calc.totaal} />
        <KmRow label="Beroepsmatig" value={calc.beroepsmatig} highlight />
      </div>
    </div>
  )
}
