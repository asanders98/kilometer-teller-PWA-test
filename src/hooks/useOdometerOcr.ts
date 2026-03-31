import { useState, useCallback } from 'react'
import { recognizeOdometer } from '../lib/ocrEngine'

interface UseOdometerOcrReturn {
  isProcessing: boolean
  error: string | null
  result: number | null
  rawText: string | null
  triggerOcr: (file: File, minValue?: number | null) => Promise<void>
  clearResult: () => void
  clearError: () => void
}

export function useOdometerOcr(): UseOdometerOcrReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<number | null>(null)
  const [rawText, setRawText] = useState<string | null>(null)

  const triggerOcr = useCallback(async (file: File, minValue?: number | null) => {
    if (isProcessing) return

    setIsProcessing(true)
    setError(null)
    setResult(null)
    setRawText(null)

    try {
      const { value, rawText: text } = await recognizeOdometer(file, minValue)
      setRawText(text)

      if (value != null) {
        setResult(value)
      } else {
        setError('Geen getal herkend. Vul handmatig in.')
      }
    } catch {
      setError('Fout bij het lezen van de foto.')
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing])

  const clearResult = useCallback(() => {
    setResult(null)
    setRawText(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { isProcessing, error, result, rawText, triggerOcr, clearResult, clearError }
}
