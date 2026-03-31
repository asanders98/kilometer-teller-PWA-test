import Tesseract from 'tesseract.js'

let worker: Tesseract.Worker | null = null
let idleTimer: ReturnType<typeof setTimeout> | null = null

const IDLE_TIMEOUT = 30_000
const MAX_IMAGE_WIDTH = 1500

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    terminateOcr()
  }, IDLE_TIMEOUT)
}

async function getWorker(): Promise<Tesseract.Worker> {
  if (worker) {
    resetIdleTimer()
    return worker
  }

  const basePath = import.meta.env.BASE_URL

  worker = await Tesseract.createWorker('eng', Tesseract.OEM.LSTM_ONLY, {
    workerPath: `${basePath}tesseract/worker.min.js`,
    corePath: `${basePath}tesseract/tesseract-core-simd-lstm.wasm.js`,
    langPath: `${basePath}tesseract/lang`,
    gzip: false,
  })

  await worker.setParameters({
    tessedit_char_whitelist: '0123456789',
    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
  })

  resetIdleTimer()
  return worker
}

export async function terminateOcr(): Promise<void> {
  if (idleTimer) {
    clearTimeout(idleTimer)
    idleTimer = null
  }
  if (worker) {
    await worker.terminate()
    worker = null
  }
}

function preprocessImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width > MAX_IMAGE_WIDTH) {
        const scale = MAX_IMAGE_WIDTH / width
        width = MAX_IMAGE_WIDTH
        height = Math.round(height * scale)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!

      // Draw original
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to grayscale + boost contrast
      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        // Luminance grayscale
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        // Simple contrast stretch
        const stretched = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128))
        data[i] = data[i + 1] = data[i + 2] = stretched
      }
      ctx.putImageData(imageData, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Canvas toBlob failed'))
        },
        'image/png',
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

export function extractOdometerValue(rawText: string, minValue?: number | null): number | null {
  // Find all digit sequences of length >= 4
  const matches = rawText.match(/\d{4,}/g)
  if (!matches) return null

  const candidates = matches
    .map((m) => parseInt(m, 10))
    .filter((n) => n <= 9_999_999)
    .sort((a, b) => String(b).length - String(a).length) // longest first

  if (candidates.length === 0) return null

  // If minValue provided, prefer candidates >= minValue
  if (minValue != null) {
    const valid = candidates.filter((n) => n >= minValue)
    if (valid.length > 0) return valid[0]
  }

  return candidates[0]
}

export async function recognizeOdometer(
  file: File,
  minValue?: number | null,
): Promise<{ value: number | null; rawText: string }> {
  const preprocessed = await preprocessImage(file)
  const w = await getWorker()
  const { data } = await w.recognize(preprocessed)
  const value = extractOdometerValue(data.text, minValue)
  return { value, rawText: data.text }
}
