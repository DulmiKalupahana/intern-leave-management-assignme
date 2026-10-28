import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ToastContext } from './ToastContext'

const AUTO_DISMISS_MS = 4500

let nextToastId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }

    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((message, type = 'success') => {
    const id = nextToastId
    nextToastId += 1

    setToasts((current) => [...current, { id, message, type }])

    const timer = window.setTimeout(() => {
      timers.current.delete(id)
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, AUTO_DISMISS_MS)

    timers.current.set(id, timer)
  }, [])

  useEffect(() => {
    const activeTimers = timers.current

    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer))
      activeTimers.clear()
    }
  }, [])

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast--${toast.type}`}
            role={toast.type === 'error' ? 'alert' : 'status'}
          >
            <span className="toast__message">{toast.message}</span>
            <button
              type="button"
              className="toast__close"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
