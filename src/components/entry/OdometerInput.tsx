import React, { useId } from 'react'
import { CopyIcon, CircleXIcon } from 'lucide-react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { cn } from '../../lib/utils'

interface OdometerInputProps {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  minValue?: number | null
  disabled?: boolean
}

export function OdometerInput({
  label,
  value,
  onChange,
  minValue,
  disabled = false,
}: OdometerInputProps) {
  const id = useId()
  const displayValue = value != null ? String(value) : ''
  const isInvalid = value != null && minValue != null && value < minValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw === '') { onChange(null); return }
    const num = parseInt(raw, 10)
    if (!isNaN(num) && num <= 9999999) onChange(num)
  }

  const handleCopy = () => {
    if (value != null) void navigator.clipboard.writeText(String(value))
  }

  const handleClear = () => onChange(null)

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-foreground">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder="0"
          className={cn(
            'text-base h-12 pr-16',
            isInvalid && 'border-destructive bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/20',
          )}
        />
        {value != null && !disabled && (
          <div className="absolute inset-y-0 right-0 flex items-center gap-0.5 pr-1.5">
            <button
              type="button"
              aria-label="Kopieer waarde"
              onClick={handleCopy}
              className="p-1.5 text-muted-foreground/70 hover:text-foreground transition-colors rounded"
            >
              <CopyIcon size={15} />
            </button>
            <button
              type="button"
              aria-label="Wis waarde"
              onClick={handleClear}
              className="p-1.5 text-muted-foreground/70 hover:text-foreground transition-colors rounded"
            >
              <CircleXIcon size={15} />
            </button>
          </div>
        )}
      </div>
      {isInvalid && (
        <p className="text-xs text-destructive">
          Moet ≥ {minValue?.toLocaleString('nl-BE')} zijn
        </p>
      )}
    </div>
  )
}
