import { useRef, useEffect } from 'react'
import { CameraIcon, LoaderCircleIcon } from 'lucide-react'
import { useOdometerOcr } from '../../hooks/useOdometerOcr'

interface CameraOcrButtonProps {
  onValue: (value: number) => void
  minValue?: number | null
  disabled?: boolean
}

export function CameraOcrButton({ onValue, minValue, disabled = false }: CameraOcrButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { isProcessing, error, result, triggerOcr, clearResult, clearError } = useOdometerOcr()

  // Auto-clear error after 3 seconds
  useEffect(() => {
    if (!error) return
    const t = setTimeout(clearError, 3000)
    return () => clearTimeout(t)
  }, [error, clearError])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      triggerOcr(file, minValue)
    }
    // Reset so same file can be selected again
    e.target.value = ''
  }

  const handleConfirm = () => {
    if (result != null) {
      onValue(result)
      clearResult()
    }
  }

  const handleCancel = () => {
    clearResult()
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isProcessing}
      />

      <button
        type="button"
        aria-label="Foto van kilometerteller"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isProcessing}
        className="flex items-center justify-center w-12 h-12 rounded-lg border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
        {isProcessing ? (
          <LoaderCircleIcon size={20} className="animate-spin" />
        ) : (
          <CameraIcon size={20} />
        )}
      </button>

      {/* Confirmation popover */}
      {result != null && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
          <p className="text-sm text-muted-foreground mb-1">Herkend:</p>
          <p className="text-lg font-semibold text-foreground mb-2">
            {result.toLocaleString('nl-BE')} km
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Bevestig
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-3 py-1.5 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent transition-colors"
            >
              Annuleer
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 min-w-[200px]">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}
