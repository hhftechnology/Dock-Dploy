import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "success" | "error" | "warning"
  duration?: number
}

type ToastContextType = {
  toasts: Toast[]
  toast: (props: Omit<Toast, "id">) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((props: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = { id, ...props }

    setToasts((prev) => [...prev, newToast])

    const duration = props.duration ?? 3000
    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}

function ToastContainer() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const variantStyles = {
    default: "bg-background border-border",
    success: "bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400",
    error: "bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-400",
    warning: "bg-yellow-500/10 border-yellow-500/50 text-yellow-700 dark:text-yellow-400",
  }

  return (
    <div
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full",
        "data-[state=open]:slide-in-from-bottom-full data-[state=open]:sm:slide-in-from-top-full",
        variantStyles[toast.variant ?? "default"]
      )}
      data-state="open"
    >
      <div className="grid gap-1 flex-1">
        {toast.title && (
          <div className="text-sm font-semibold">{toast.title}</div>
        )}
        {toast.description && (
          <div className="text-sm opacity-90">{toast.description}</div>
        )}
      </div>
      {toast.action}
      <button
        onClick={() => onDismiss(toast.id)}
        className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
