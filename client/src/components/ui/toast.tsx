import * as React from "react"
import { X } from "lucide-react"

// Toast type definitions
export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

// Context for toast state management
type ToastContextValue = {
  toasts: Toast[];
  toast: (props: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
};

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

// Hook to use toast functionality
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Provider component that wraps the app
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  // Add a new toast
  const toast = React.useCallback(
    (props: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, ...props }]);
      
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  // Remove a specific toast
  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Remove all toasts
  const dismissAll = React.useCallback(() => {
    setToasts([]);
  }, []);

  const value = React.useMemo(
    () => ({ toasts, toast, dismiss, dismissAll }),
    [toasts, toast, dismiss, dismissAll]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-0 right-0 z-50 flex flex-col p-4 gap-2 max-w-md">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`
                relative flex w-full items-center justify-between overflow-hidden rounded-md border p-4 pr-8 shadow-lg
                ${toast.variant === "destructive" ? "border-red-500 bg-red-500/10 text-red-600" : "border-border bg-background text-foreground"}
              `}
            >
              <div className="grid gap-1">
                {toast.title && <div className="text-sm font-semibold">{toast.title}</div>}
                {toast.description && (
                  <div className="text-sm opacity-90">{toast.description}</div>
                )}
              </div>
              <button
                className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 hover:text-foreground"
                onClick={() => dismiss(toast.id)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
} 