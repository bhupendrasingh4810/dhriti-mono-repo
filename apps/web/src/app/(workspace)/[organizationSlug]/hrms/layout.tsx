"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { HrmsSidebar } from "@/features/hrms/hrms-sidebar";

type HrmsToast = (message: string) => void;

const HrmsToastContext = createContext<HrmsToast | null>(null);

export function useHrmsToast(): HrmsToast {
  const showToast = useContext(HrmsToastContext);

  if (!showToast) {
    throw new Error("useHrmsToast must be used within HrmsLayout");
  }

  return showToast;
}

export default function HrmsLayout({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState("");
  const timeoutRef = useRef<number | undefined>(undefined);

  const showToast = useCallback((message: string) => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    setToast(message);
    timeoutRef.current = window.setTimeout(() => setToast(""), 3200);
  }, []);

  useEffect(() => () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
  }, []);

  return (
    <HrmsToastContext.Provider value={showToast}>
      <div className="flex h-full min-h-0 gap-3 overflow-hidden bg-background p-4">
        <HrmsSidebar />
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1500px] px-2 md:px-2">{children}</div>
        </div>
      </div>
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-[60] rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </HrmsToastContext.Provider>
  );
}
