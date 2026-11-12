"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
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
  const isSettingsPage = pathname.includes("/hrms/settings");

  return (
    <HrmsToastContext.Provider value={showToast}>
      <div className={`flex gap-3 bg-background p-2 lg:p-4 ${isSettingsPage ? "min-h-full" : "h-full min-h-0 overflow-hidden"}`}>
        {!isSettingsPage ? <HrmsSidebar /> : null}
        <div className={`min-w-0 flex-1 ${isSettingsPage ? "" : "overflow-y-auto"}`}>
          <div className={isSettingsPage ? "h-full" : "mx-auto max-w-[1500px] px-0 lg:px-2"}>{children}</div>
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
