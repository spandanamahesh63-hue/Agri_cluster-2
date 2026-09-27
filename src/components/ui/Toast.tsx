import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CircleCheck, X } from "lucide-react";

interface ToastMessage {
  id: number;
  text: string;
  action?: { label: string; onClick: () => void };
}

type ShowToast = (text: string, action?: ToastMessage["action"]) => void;

const ToastContext = createContext<ShowToast | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback<ShowToast>((text, action) => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), text, action });
    timer.current = window.setTimeout(() => setToast(null), 5000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 lg:bottom-6">
        {toast && (
          <div
            key={toast.id}
            className="pointer-events-auto flex max-w-md items-center gap-3 rounded-lg bg-ink px-4 py-2.5 text-sm text-white shadow-pop"
          >
            <CircleCheck aria-hidden className="size-4 shrink-0 text-brand-200" />
            <span>{toast.text}</span>
            {toast.action && (
              <button
                type="button"
                className="font-semibold text-brand-200 hover:text-white"
                onClick={() => {
                  toast.action?.onClick();
                  setToast(null);
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button type="button" aria-label="Dismiss" className="text-white/60 hover:text-white" onClick={() => setToast(null)}>
              <X aria-hidden className="size-4" />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}
