import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeProvider } from './components/layout/ThemeProvider'
import { AppShell } from './components/layout/AppShell'
import { initGoogleAuth } from './lib/googleAuth'

// Initialize Google auth (non-blocking)
initGoogleAuth().catch(() => {
  // GIS script failed to load - Google Drive features won't be available
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  </StrictMode>,
)
