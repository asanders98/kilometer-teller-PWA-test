import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeProvider } from './components/layout/ThemeProvider'
import { AppShell } from './components/layout/AppShell'
import { initGoogleAuth, isSignedIn, getStoredEmail } from './lib/googleAuth'
import { useKmStore } from './store/kmStore'

// Initialize Google auth — picks up token from URL hash after redirect
initGoogleAuth().then(() => {
  if (isSignedIn()) {
    useKmStore.getState().setGoogleDriveState({
      enabled: true,
      accountEmail: getStoredEmail(),
    })
  }
}).catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  </StrictMode>,
)
