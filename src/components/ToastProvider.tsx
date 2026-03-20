import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type ToastTone = 'neutral' | 'success'

type ToastRecord = {
  id: string
  title: string
  description: string
  tone: ToastTone
}

type ToastContextValue = {
  pushToast: (toast: Omit<ToastRecord, 'id' | 'tone'> & { tone?: ToastTone }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const timers = useRef(new Map<string, number>())
  const nextId = useRef(0)

  const dismissToast = (id: string) => {
    window.clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  const pushToast: ToastContextValue['pushToast'] = ({
    title,
    description,
    tone = 'neutral',
  }) => {
    nextId.current += 1
    const id = `toast-${nextId.current}`

    setToasts((current) => [...current, { id, title, description, tone }])
    timers.current.set(
      id,
      window.setTimeout(() => {
        dismissToast(id)
      }, 3200),
    )
  }

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <ol className="toast-stack" aria-live="polite" aria-label="Notifications">
        {toasts.map((toast) => (
          <li key={toast.id} className="toast">
            <div className="toast-head">
              <strong>{toast.title}</strong>
              <button
                type="button"
                className="toast-close"
                aria-label={`Dismiss ${toast.title}`}
                onClick={() => dismissToast(toast.id)}
              >
                Close
              </button>
            </div>
            <p>{toast.description}</p>
          </li>
        ))}
      </ol>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within ToastProvider.')
  }

  return context
}
