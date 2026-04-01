import { useEffect, useState, useCallback } from 'react'

interface ToastMessage {
  id: number
  text: string
}

let toastId = 0
let addToastListener: ((msg: ToastMessage) => void) | null = null

/** Show a toast message from anywhere in the app */
export function showToast(text: string) {
  const msg: ToastMessage = { id: ++toastId, text }
  addToastListener?.(msg)
}

const DURATION = 3000

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    addToastListener = (msg) => setToasts((prev) => [...prev, msg])
    return () => { addToastListener = null }
  }, [])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDone={remove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDone }: { toast: ToastMessage; onDone: (id: number) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDone(toast.id), 200)
    }, DURATION)
    return () => clearTimeout(timer)
  }, [toast.id, onDone])

  return (
    <div
      className={`pointer-events-auto px-4 py-2.5 rounded-xl bg-card border border-border shadow-lg text-sm text-foreground transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      {toast.text}
    </div>
  )
}
