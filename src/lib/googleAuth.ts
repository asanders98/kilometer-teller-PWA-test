const CLIENT_ID = '686288945131-hhqr00inum01oatgns12sllo7jljns7h.apps.googleusercontent.com'
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata'
const TOKEN_KEY = 'km-teller-google-token'
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

interface StoredToken {
  accessToken: string
  expiresAt: number
  email: string | null
}

/**
 * On app startup, check if the URL hash contains an OAuth token
 * (returned by Google after redirect-based auth).
 */
export async function initGoogleAuth(): Promise<void> {
  const hash = window.location.hash
  if (!hash.includes('access_token')) return

  const params = new URLSearchParams(hash.substring(1))
  const accessToken = params.get('access_token')
  const expiresIn = parseInt(params.get('expires_in') ?? '3600', 10)

  if (!accessToken) return

  // Clear the hash from the URL so it doesn't linger
  history.replaceState(null, '', window.location.pathname + window.location.search)

  const expiresAt = Date.now() + expiresIn * 1000
  const email = await fetchUserEmail(accessToken)

  const stored: StoredToken = { accessToken, expiresAt, email }
  localStorage.setItem(TOKEN_KEY, JSON.stringify(stored))
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

/**
 * Redirect to Google's OAuth page. After auth, Google redirects back
 * to the app with the access token in the URL hash.
 * Works in iOS PWA standalone mode (no popups needed).
 */
export function signIn(): void {
  const redirectUri = window.location.origin + window.location.pathname
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: SCOPE,
    include_granted_scopes: 'true',
  })
  window.location.href = `${AUTH_URL}?${params}`
}

export function signOut(): void {
  const stored = getStoredToken()
  if (stored?.accessToken) {
    // Revoke token in background (best-effort)
    fetch(`https://oauth2.googleapis.com/revoke?token=${stored.accessToken}`, {
      method: 'POST',
    }).catch(() => {})
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
