import { useState } from "react";

interface Toast {
  id: string;
  variant: "success" | "error" | "warning" | "info";
  message: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
}

const variantStyles: Record<Toast["variant"], { bg: string; icon: string; color: string }> = {
  success: { bg: "#059669", icon: "✓", color: "white" },
  error: { bg: "#dc2626", icon: "✕", color: "white" },
  warning: { bg: "#d97706", icon: "⚠", color: "white" },
  info: { bg: "#2563eb", icon: "ℹ", color: "white" },
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (message: string, variant: Toast["variant"] = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, variant, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };
  const removeToast = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));
  return { toasts, addToast, removeToast };
}

export function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {toasts.map((toast) => {
        const s = variantStyles[toast.variant];
        return (
          <div
            key={toast.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              backgroundColor: s.bg,
              color: s.color,
              padding: "12px 16px",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              minWidth: 280,
              maxWidth: 400,
              animation: "slideInRight 0.3s ease",
            }}
          >
            <span style={{ fontSize: 16, fontWeight: "bold" }}>{s.icon}</span>
            <span style={{ flex: 1, fontSize: 14 }}>{toast.message}</span>
            <button
              onClick={() => onRemove(toast.id)}
              style={{
                background: "none",
                border: "none",
                color: s.color,
                cursor: "pointer",
                fontSize: 16,
                padding: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
