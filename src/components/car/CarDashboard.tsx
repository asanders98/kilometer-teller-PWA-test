import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, TrendingUp, Briefcase, User, Calendar, Construction } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'

type Period = 'D' | 'W' | 'M' | '6M' | 'J'

const DAY_NAMES = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const MONTH_SHORT = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function generateBars(period: Period, offset: number) {
  const seed = (offset + 1000) * 100 + (period === 'W' ? 1 : period === 'M' ? 2 : period === '6M' ? 3 : period === 'J' ? 4 : 0) * 10000
  switch (period) {
    case 'D':
      return [{
        label: '',
        business: Math.round(seededRandom(seed) * 40 + 20),
        private: Math.round(seededRandom(seed + 1) * 20 + 5),
      }]
    case 'W':
      return DAY_NAMES.map((d, i) => ({
        label: d,
        business: Math.round(seededRandom(seed + i) * 50 + 10),
        private: Math.round(seededRandom(seed + i + 7) * 20),
      }))
    case 'M':
      return Array.from({ length: 30 }, (_, i) => ({
        label: (i + 1) % 5 === 1 ? `${i + 1}` : '',
        business: Math.round(seededRandom(seed + i) * 50 + 10),
        private: Math.round(seededRandom(seed + i + 30) * 20),
      }))
    case '6M':
      return MONTH_SHORT.slice(0, 6).map((m, i) => ({
        label: m,
        business: Math.round(seededRandom(seed + i) * 600 + 300),
        private: Math.round(seededRandom(seed + i + 6) * 250 + 100),
      }))
    case 'J':
      return MONTH_SHORT.map((m, i) => ({
        label: m,
        business: Math.round(seededRandom(seed + i) * 600 + 300),
        private: Math.round(seededRandom(seed + i + 12) * 250 + 100),
      }))
  }
}

function getPeriodTitle(period: Period, offset: number): string {
  const now = new Date()
  switch (period) {
    case 'D': {
      const d = new Date(now)
      d.setDate(d.getDate() + offset)
      if (offset === 0) return 'Vandaag'
      if (offset === -1) return 'Gisteren'
      return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
    }
    case 'W': {
      const start = new Date(now)
      const dow = (start.getDay() + 6) % 7
      start.setDate(start.getDate() - dow + offset * 7)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return `${start.getDate()} ${MONTH_SHORT[start.getMonth()]} – ${end.getDate()} ${MONTH_SHORT[end.getMonth()]} ${end.getFullYear()}`
    }
    case 'M': {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
      return `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
    }
    case '6M': {
      const endMonth = new Date(now.getFullYear(), now.getMonth() + offset * 6, 1)
      const startMonth = new Date(endMonth.getFullYear(), endMonth.getMonth() - 5, 1)
      return `${MONTH_SHORT[startMonth.getMonth()]} ${startMonth.getFullYear()} – ${MONTH_SHORT[endMonth.getMonth()]} ${endMonth.getFullYear()}`
    }
    case 'J':
      return `${now.getFullYear() + offset}`
  }
}

function getBarLabel(period: Period, offset: number, index: number): string {
  const now = new Date()
  switch (period) {
    case 'W': {
      const start = new Date(now)
      const dow = (start.getDay() + 6) % 7
      start.setDate(start.getDate() - dow + offset * 7 + index)
      return `${DAY_NAMES[index]} ${start.getDate()} ${MONTH_SHORT[start.getMonth()]}`
    }
    case 'M': {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, index + 1)
      return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
    }
    case '6M':
    case 'J':
      return MONTH_SHORT[index % 12]
    default:
      return ''
  }
}

function formatKm(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.', ',')}k`
  return value.toString()
}

function niceMax(value: number): number {
  if (value <= 50) return Math.ceil(value / 10) * 10
  if (value <= 100) return Math.ceil(value / 25) * 25
  if (value <= 500) return Math.ceil(value / 100) * 100
  if (value <= 2000) return Math.ceil(value / 500) * 500
  return Math.ceil(value / 1000) * 1000
}

// --- Components ---

function ProgressBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min((used / limit) * 100, 100)
  const remaining = Math.max(limit - used, 0)
  const color = pct < 60 ? 'bg-success' : pct < 85 ? 'bg-warning' : 'bg-destructive'
  const status = pct < 60 ? 'Op schema' : pct < 85 ? 'Let op' : 'Over budget'
  const statusColor = pct < 60 ? 'text-success' : pct < 85 ? 'text-warning' : 'text-destructive'

  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const projected = Math.round((used / Math.max(dayOfYear, 1)) * 365)

  return (
    <div className="bg-card rounded-2xl p-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="text-xs text-muted-foreground">Jaarlijks km budget</div>
          <div className="text-lg font-bold text-foreground">
            {used.toLocaleString('nl-NL')} <span className="text-sm font-normal text-muted-foreground">/ {limit.toLocaleString('nl-NL')} km</span>
          </div>
        </div>
        <span className={`text-xs font-semibold ${statusColor} bg-card border border-border rounded-full px-2.5 py-1`}>{status}</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Nog {remaining.toLocaleString('nl-NL')} km over</span>
        <span>Prognose: ~{projected.toLocaleString('nl-NL')} km</span>
      </div>
    </div>
  )
}

function PeriodTabs({ selected, onChange }: { selected: Period; onChange: (p: Period) => void }) {
  const periods: Period[] = ['D', 'W', 'M', '6M', 'J']
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 rounded-2xl border border-border shadow-lg bg-card backdrop-blur-lg">
      {periods.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`relative flex-1 py-2 text-xs font-semibold rounded-xl transition-colors ${
            selected === p
              ? 'bg-accent text-primary'
              : 'text-muted-foreground hover:bg-secondary'
          }`}
        >
          {p}
          {selected === p && (
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
          )}
        </button>
      ))}
    </div>
  )
}

function HealthChart({
  data,
  period,
  selectedBar,
  onSelectBar,
}: {
  data: { label: string; business: number; private: number }[]
  period: Period
  selectedBar: number | null
  onSelectBar: (i: number | null) => void
}) {
  const maxRaw = Math.max(...data.map((d) => d.business + d.private), 1)
  const maxVal = niceMax(maxRaw)
  const ticks = 4
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => Math.round((maxVal / ticks) * i))

  const avg = Math.round(data.reduce((s, d) => s + d.business + d.private, 0) / data.length)
  const avgPct = (avg / maxVal) * 100

  const barGap = period === 'W' ? 'gap-3' : period === 'J' || period === '6M' ? 'gap-2' : 'gap-[2px]'

  return (
    <div className="bg-card rounded-2xl p-4 pt-3">
      <div className="relative">
        <div className="relative h-44 ml-0 mr-10">
          {tickValues.map((val, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-t border-border/40 pointer-events-none"
              style={{ bottom: `${(val / maxVal) * 100}%` }}
            />
          ))}

          <div
            className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/50 pointer-events-none"
            style={{ bottom: `${avgPct}%` }}
          />

          <div className={`flex items-end ${barGap} h-full relative z-10`}>
            {data.map((d, i) => {
              const total = d.business + d.private
              const height = (total / maxVal) * 100
              const bizPct = total > 0 ? (d.business / total) * 100 : 0
              const isSelected = selectedBar === i

              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer"
                  onClick={() => onSelectBar(isSelected ? null : i)}
                >
                  <div
                    className={`w-full rounded-t-sm overflow-hidden transition-opacity ${
                      selectedBar !== null && !isSelected ? 'opacity-40' : ''
                    }`}
                    style={{ height: `${Math.max(height, 1)}%` }}
                  >
                    <div className="bg-primary w-full" style={{ height: `${bizPct}%` }} />
                    <div className="bg-primary/30 w-full" style={{ height: `${100 - bizPct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-10 flex flex-col justify-between items-end pointer-events-none" style={{ height: '176px' }}>
          {[...tickValues].reverse().map((val, i) => (
            <span key={i} className="text-[10px] text-muted-foreground leading-none -translate-y-1">
              {formatKm(val)}
            </span>
          ))}
        </div>

        <div className={`flex ${barGap} mt-1 mr-10`}>
          {data.map((d, i) => (
            <div key={i} className="flex-1 text-center">
              <span className={`text-[10px] ${selectedBar === i ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HighlightCard({
  icon: Icon,
  label,
  value,
  unit,
  subtitle,
  color = 'text-foreground',
}: {
  icon: typeof TrendingUp
  label: string
  value: string
  unit: string
  subtitle?: string
  color?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="cursor-pointer rounded-lg"
    >
      <Card className="h-full transition-colors duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-sm font-medium text-muted-foreground !text-sm">
            {label}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
          <p className="text-xs text-muted-foreground">{unit}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// --- Main ---

export function CarDashboard() {
  const [period, setPeriod] = useState<Period>('W')
  const [offset, setOffset] = useState(0)
  const [selectedBar, setSelectedBar] = useState<number | null>(null)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const bars = generateBars(period, offset)
  const totalBiz = bars.reduce((s, d) => s + d.business, 0)
  const totalPriv = bars.reduce((s, d) => s + d.private, 0)
  const total = totalBiz + totalPriv
  const avg = period === 'D' ? total : Math.round(total / bars.length)

  const handlePeriodChange = (p: Period) => {
    setPeriod(p)
    setOffset(0)
    setSelectedBar(null)
  }

  const navigate = useCallback((dir: 1 | -1) => {
    if (dir === 1 && offset >= 0) return
    setOffset((o) => o + dir)
    setSelectedBar(null)
  }, [offset])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      navigate(dx > 0 ? -1 : 1)
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const selectedData = selectedBar !== null ? bars[selectedBar] : null
  const headerLabel = selectedData ? 'TOTAAL' : (period === 'D' ? 'TOTAAL' : 'GEMIDDELD')
  const headerValue = selectedData
    ? (selectedData.business + selectedData.private)
    : (period === 'D' ? total : avg)
  const headerSubtitle = selectedData && selectedBar !== null
    ? getBarLabel(period, offset, selectedBar)
    : getPeriodTitle(period, offset)

  const unitLabel = period === 'J' || period === '6M' ? 'km/mnd' : 'km/dag'
  const avgPerDay = period === 'D' ? total : period === 'W' ? Math.round(total / 7) : period === 'M' ? Math.round(total / 30) : period === '6M' ? Math.round(total / 182) : Math.round(total / 365)

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 pb-6 space-y-3">
        {/* Demo banner */}
        <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-3 py-2">
          <Construction className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-xs text-primary font-medium">Demo — dit dashboard wordt binnenkort gekoppeld aan je echte ritten</span>
        </div>

        <ProgressBar used={12450} limit={25000} />

        <PeriodTabs selected={period} onChange={handlePeriodChange} />

        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-muted-foreground font-semibold tracking-wide uppercase">{headerLabel}</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-foreground">{headerValue.toLocaleString('nl-NL')}</span>
              <span className="text-base text-muted-foreground">{period === 'D' || selectedData ? 'km' : unitLabel}</span>
            </div>
            <div className="text-xs text-muted-foreground">{headerSubtitle}</div>
          </div>
          {offset < 0 && (
            <button
              onClick={() => { setOffset(0); setSelectedBar(null) }}
              className="text-xs text-primary font-medium"
            >
              Vandaag
            </button>
          )}
        </div>

        {period === 'D' ? (
          <div
            className="bg-card rounded-2xl p-6"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{bars[0].business} km</div>
                <div className="text-xs text-muted-foreground mt-1">zakelijk</div>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">{bars[0].private} km</div>
                <div className="text-xs text-muted-foreground mt-1">privé</div>
              </div>
            </div>
          </div>
        ) : (
          <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <HealthChart
              data={bars}
              period={period}
              selectedBar={selectedBar}
              onSelectBar={setSelectedBar}
            />
          </div>
        )}

        <div className="flex items-center justify-between px-1">
          <button onClick={() => navigate(-1)} className="text-muted-foreground p-1">
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
              <span className="text-[11px] text-muted-foreground">Zakelijk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary/30" />
              <span className="text-[11px] text-muted-foreground">Privé</span>
            </div>
          </div>
          <button
            onClick={() => navigate(1)}
            className={`p-1 ${offset < 0 ? 'text-muted-foreground' : 'text-transparent pointer-events-none'}`}
          >
            <ChevronLeft size={18} className="rotate-180" />
          </button>
        </div>

        <div className="pt-1">
          <div className="grid grid-cols-2 gap-3">
            <HighlightCard
              icon={Briefcase}
              label="Zakelijk"
              value={(selectedData ? selectedData.business : totalBiz).toLocaleString('nl-NL')}
              unit="km"
              subtitle={selectedData && selectedBar !== null ? getBarLabel(period, offset, selectedBar) : getPeriodTitle(period, offset)}
              color="text-primary"
            />
            <HighlightCard
              icon={User}
              label="Privé"
              value={(selectedData ? selectedData.private : totalPriv).toLocaleString('nl-NL')}
              unit="km"
              subtitle={selectedData && selectedBar !== null ? getBarLabel(period, offset, selectedBar) : getPeriodTitle(period, offset)}
            />
            <HighlightCard
              icon={TrendingUp}
              label="Totaal"
              value={total.toLocaleString('nl-NL')}
              unit="km"
              subtitle={getPeriodTitle(period, offset)}
            />
            <HighlightCard
              icon={Calendar}
              label="Gemiddeld"
              value={avgPerDay.toLocaleString('nl-NL')}
              unit="km/dag"
              subtitle={getPeriodTitle(period, offset)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
