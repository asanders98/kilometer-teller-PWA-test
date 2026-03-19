import { useEffect } from 'react'
import { useKmStore } from '../../store/kmStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useKmStore((s) => s.settings.theme)

  useEffect(() => {
    const root = document.documentElement

    if (theme === 'dark') {
      root.classList.add('dark')
      return
    }

    if (theme === 'light') {
      root.classList.remove('dark')
      return
    }

    // System preference
    const apply = (dark: boolean) => {
      if (dark) root.classList.add('dark')
      else root.classList.remove('dark')
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    apply(mq.matches)

    const handler = (e: MediaQueryListEvent) => apply(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return <>{children}</>
}
