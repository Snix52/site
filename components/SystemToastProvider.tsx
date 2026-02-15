"use client";

import {
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type SystemToastTone = "success" | "error" | "info";

type SystemToastItem = {
  id: number;
  message: string;
  tone: SystemToastTone;
};

type SystemToastContextValue = {
  pushToast: (message: string, tone?: SystemToastTone, durationMs?: number) => void;
};

const toneStyle: Record<SystemToastTone, string> = {
  success: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
  error: "border-red-400/40 bg-red-500/15 text-red-100",
  info: "border-cyan-400/40 bg-cyan-500/15 text-cyan-100",
};

const toneIcon: Record<SystemToastTone, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const SystemToastContext = createContext<SystemToastContextValue | null>(null);

export function useSystemToast() {
  const ctx = useContext(SystemToastContext);
  if (!ctx) {
    throw new Error("useSystemToast must be used within SystemToastProvider.");
  }
  return ctx;
}

export default function SystemToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<SystemToastItem[]>([]);
  const timeoutMapRef = useRef<Record<number, number>>({});

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));

    const timer = timeoutMapRef.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete timeoutMapRef.current[id];
    }
  }, []);

  const pushToast = useCallback(
    (message: string, tone: SystemToastTone = "info", durationMs = 4200) => {
      const normalized = message.trim();
      if (!normalized) return;

      const id = Date.now() + Math.floor(Math.random() * 10000);
      setToasts((prev) => [...prev, { id, tone, message: normalized }]);

      timeoutMapRef.current[id] = window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
        delete timeoutMapRef.current[id];
      }, durationMs);
    },
    [],
  );

  useEffect(() => {
    return () => {
      Object.values(timeoutMapRef.current).forEach((timer) => window.clearTimeout(timer));
      timeoutMapRef.current = {};
    };
  }, []);

  const value = useMemo<SystemToastContextValue>(() => ({ pushToast }), [pushToast]);

  return (
    <SystemToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-24 z-[360] w-[min(360px,calc(100%-2rem))] space-y-2">
        {toasts.map((toast) => {
          const Icon = toneIcon[toast.tone];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-xl border px-3 py-2 text-sm shadow-lg backdrop-blur ${toneStyle[toast.tone]}`}
            >
              <div className="flex items-start gap-2">
                <Icon size={16} className="mt-0.5 shrink-0" />
                <p className="flex-1 whitespace-pre-wrap leading-snug">{toast.message}</p>
                <button
                  type="button"
                  aria-label="Mesaji kapat"
                  className="rounded p-0.5 opacity-75 transition hover:opacity-100"
                  onClick={() => removeToast(toast.id)}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </SystemToastContext.Provider>
  );
}
