const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent'

const PROMPT = `Look at this car dashboard photo. Find the TOTAL odometer reading (total km driven).
Ignore other numbers like trip counter, range, fuel consumption, temperature, time, or speed.
The odometer is usually the largest km value shown (typically 5-6 digits).
Return ONLY the number, no units, no spaces, no dots, no commas.
If you cannot find the odometer, respond with exactly: ERROR`

const MAX_IMAGE_WIDTH = 512
const JPEG_QUALITY = 0.6
const TIMEOUT_MS = 15_000

export type GeminiOcrResult =
  | { success: true; value: number }
  | { success: false; error: string; rateLimited?: boolean; retryAfter?: number }

/**
 * Resize an image file to reduce payload size before sending to the API.
 * Returns base64 string (without data URI prefix) and mime type.
 */
function resizeImage(file: File): Promise<{ base64: string; mimeType: string }> {
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
      ctx.drawImage(img, 0, 0, width, height)

      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
      // Strip "data:image/jpeg;base64," prefix
      const base64 = dataUrl.split(',')[1]
      resolve({ base64, mimeType: 'image/jpeg' })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Kan afbeelding niet laden'))
    }

    img.src = url
  })
}

/**
 * Send an image to Gemini Vision API and extract the odometer reading.
 */
export async function readOdometerFromImage(
  file: File,
  apiKey: string,
): Promise<GeminiOcrResult> {
  // Resize image
  let base64: string
  let mimeType: string
  try {
    const resized = await resizeImage(file)
    base64 = resized.base64
    mimeType = resized.mimeType
  } catch {
    return { success: false, error: 'Kan foto niet verwerken' }
  }

  // Build request
  const body = {
    contents: [
      {
        parts: [
          {
            inlineData: { mimeType, data: base64 },
          },
          {
            text: PROMPT,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 20,
    },
  }

  // Send request with timeout
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, error: 'Verzoek verlopen. Probeer opnieuw.' }
    }
    return { success: false, error: 'Geen internetverbinding' }
  } finally {
    clearTimeout(timer)
  }

  // Handle HTTP errors
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10)
    return {
      success: false,
      error: 'Limiet bereikt. Probeer later opnieuw.',
      rateLimited: true,
      retryAfter,
    }
  }

  if (response.status === 400 || response.status === 403) {
    return { success: false, error: 'Ongeldige API-sleutel' }
  }

  if (!response.ok) {
    return { success: false, error: 'Er ging iets mis. Probeer opnieuw.' }
  }

  // Parse response
  let data: unknown
  try {
    data = await response.json()
  } catch {
    return { success: false, error: 'Ongeldig antwoord van server' }
  }

  const text = (
    data as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
  )?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

  if (!text || text.toUpperCase() === 'ERROR') {
    return { success: false, error: 'Kan kilometerteller niet lezen' }
  }

  // Extract digits and parse
  const digits = text.replace(/\D/g, '')
  if (!digits) {
    return { success: false, error: 'Geen getal herkend' }
  }

  const value = parseInt(digits, 10)
  if (isNaN(value) || value > 9_999_999) {
    return { success: false, error: 'Ongeldig getal herkend' }
  }

  return { success: true, value }
}
