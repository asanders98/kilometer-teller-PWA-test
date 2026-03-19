const CLIENT_ID = '686288945131-hhqr00inum01oatgns12sllo7jljns7h.apps.googleusercontent.com'
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata'
const TOKEN_KEY = 'km-teller-google-token'

interface StoredToken {
  accessToken: string
  expiresAt: number
  email: string | null
}

let tokenClient: google.accounts.oauth2.TokenClient | null = null
let resolveAuth: ((token: string) => void) | null = null
let rejectAuth: ((err: Error) => void) | null = null

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof google !== 'undefined' && google.accounts) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })
}

export async function initGoogleAuth(): Promise<void> {
  await loadGisScript()

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: (response) => {
      if (response.error) {
        rejectAuth?.(new Error(response.error))
        rejectAuth = null
        resolveAuth = null
        return
      }
      const expiresAt = Date.now() + (response.expires_in ?? 3600) * 1000
      const stored: StoredToken = {
        accessToken: response.access_token,
        expiresAt,
        email: null,
      }
      // Fetch email in background
      fetchUserEmail(response.access_token).then((email) => {
        stored.email = email
        localStorage.setItem(TOKEN_KEY, JSON.stringify(stored))
      })
      localStorage.setItem(TOKEN_KEY, JSON.stringify(stored))
      resolveAuth?.(response.access_token)
      resolveAuth = null
      rejectAuth = null
    },
  })
}

async function fetchUserEmail(token: string): Promise<string | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.email ?? null
  } catch {
    return null
  }
}

export async function signIn(): Promise<{ token: string; email: string | null }> {
  if (!tokenClient) {
    await initGoogleAuth()
  }
  return new Promise((resolve, reject) => {
    resolveAuth = async (token) => {
      const email = await fetchUserEmail(token)
      const stored = getStoredToken()
      if (stored) {
        stored.email = email
        localStorage.setItem(TOKEN_KEY, JSON.stringify(stored))
      }
      resolve({ token, email })
    }
    rejectAuth = reject
    tokenClient!.requestAccessToken()
  })
}

export function signOut(): void {
  const stored = getStoredToken()
  if (stored?.accessToken) {
    google.accounts.oauth2.revoke(stored.accessToken, () => {
      // Revoke callback - token is revoked
    })
  }
  localStorage.removeItem(TOKEN_KEY)
}

function getStoredToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredToken
  } catch {
    return null
  }
}

export function getAccessToken(): string | null {
  const stored = getStoredToken()
  if (!stored) return null
  if (Date.now() >= stored.expiresAt) {
    localStorage.removeItem(TOKEN_KEY)
    return null
  }
  return stored.accessToken
}

export function isSignedIn(): boolean {
  return getAccessToken() !== null
}

export function getStoredEmail(): string | null {
  const stored = getStoredToken()
  return stored?.email ?? null
}
