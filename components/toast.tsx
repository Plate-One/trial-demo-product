"use client"

import { createContext, useContext, useState, useCallback } from "react"
import type React from "react"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let toastId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />,
    info: <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />,
  }

  const bgColors = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-sm",
              bgColors[toast.type],
            )}
          >
            {icons[toast.type]}
            <span className="text-sm font-medium text-gray-800">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-2 flex-shrink-0">
              <X className="h-3 w-3 text-gray-500" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
