import { useRef, useState, useEffect } from 'react'
import { CameraIcon, LoaderCircleIcon } from 'lucide-react'
import { useKmStore } from '../../store/kmStore'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { readOdometerFromImage } from '../../lib/geminiOcr'
import { showToast } from '../ui/Toast'

interface CameraOcrButtonProps {
  onResult: (value: number) => void
  disabled?: boolean
}

type State = 'idle' | 'processing' | 'confirming'

export function CameraOcrButton({ onResult, disabled = false }: CameraOcrButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isOnline = useOnlineStatus()
  const geminiApiKey = useKmStore((s) => s.settings.geminiApiKey)

  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<number | null>(null)
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null)

  // Check if currently rate limited
  const isRateLimited = rateLimitedUntil != null && Date.now() < rateLimitedUntil

  // Clear rate limit when it expires
  useEffect(() => {
    if (!rateLimitedUntil) return
    const remaining = rateLimitedUntil - Date.now()
    if (remaining <= 0) {
      setRateLimitedUntil(null)
      return
    }
    const timer = setTimeout(() => setRateLimitedUntil(null), remaining)
    return () => clearTimeout(timer)
  }, [rateLimitedUntil])

  const isButtonDisabled = disabled || !isOnline || !geminiApiKey || isRateLimited || state === 'processing'

  const handleTap = () => {
    if (!isOnline) {
      showToast('Geen internetverbinding')
      return
    }
    if (!geminiApiKey) {
      showToast('Stel je API-sleutel in bij Instellingen')
      return
    }
    if (isRateLimited) {
      showToast('Limiet bereikt. Probeer later opnieuw.')
      return
    }
    if (state === 'processing') return

    inputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset so same file can be selected again
    e.target.value = ''
    if (!file) return

    setState('processing')
    setResult(null)

    const ocrResult = await readOdometerFromImage(file, geminiApiKey)

    if (ocrResult.success) {
      setResult(ocrResult.value)
      setState('confirming')
    } else {
      if (ocrResult.rateLimited) {
        const retryMs = (ocrResult.retryAfter ?? 60) * 1000
        setRateLimitedUntil(Date.now() + retryMs)
      }
      showToast(ocrResult.error)
      setState('idle')
    }
  }

  const handleConfirm = () => {
    if (result != null) {
      onResult(result)
    }
    setResult(null)
    setState('idle')
  }

  const handleCancel = () => {
    setResult(null)
    setState('idle')
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
      />

      <button
        type="button"
        aria-label="Foto van kilometerteller"
        onClick={handleTap}
        className={`flex items-center justify-center w-12 h-12 rounded-lg border border-input bg-background transition-colors ${
          isButtonDisabled
            ? 'opacity-40 text-muted-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
      >
        {state === 'processing' ? (
          <LoaderCircleIcon size={20} className="animate-spin" />
        ) : (
          <CameraIcon size={20} />
        )}
      </button>

      {/* Bottom sheet confirmation */}
      {state === 'confirming' && result != null && (
        <div
          className="fixed inset-0 z-[90] bg-black/50 flex items-end"
          onClick={handleCancel}
        >
          <div
            className="w-full bg-card border-t border-border rounded-t-2xl px-5 pt-4 pb-10 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-5" />
            <p className="text-sm text-muted-foreground mb-1">Herkend</p>
            <p className="text-2xl font-bold text-foreground mb-5">
              {result.toLocaleString('nl-BE')} km
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 text-base font-medium rounded-xl border border-input bg-background text-foreground hover:bg-accent transition-colors"
              >
                Annuleer
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-3 text-base font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Bevestig
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
