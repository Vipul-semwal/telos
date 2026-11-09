"use client";

import * as React from "react";
import { CheckCircle, Info, WarningCircle, X } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, { icon: React.ReactNode; className: string }> = {
  success: {
    icon: <CheckCircle size={18} weight="fill" />,
    className: "text-status-success",
  },
  error: {
    icon: <WarningCircle size={18} weight="fill" />,
    className: "text-status-error",
  },
  info: {
    icon: <Info size={18} weight="fill" />,
    className: "text-accent",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const nextId = React.useRef(0);

  const dismiss = React.useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = React.useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = nextId.current++;
      setItems((current) => [...current.slice(-2), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(22rem,calc(100vw-2.5rem))] flex-col gap-2"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className="glass-thick pointer-events-auto flex animate-slide-up items-start gap-3 rounded-2xl px-4 py-3"
          >
            <span className={cn("mt-0.5 shrink-0", toneStyles[item.tone].className)}>
              {toneStyles[item.tone].icon}
            </span>
            <p className="flex-1 text-small text-foreground-primary">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground-primary"
            >
              <X size={12} weight="bold" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
