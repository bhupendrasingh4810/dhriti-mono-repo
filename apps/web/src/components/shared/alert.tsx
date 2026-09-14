import { useState } from "react";

export type AlertVariant = "success" | "error" | "warning" | "info";

export interface AlertAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "ghost";
}

export interface AlertProps {
  variant: AlertVariant;
  title?: string;
  message: string;
  dismissible?: boolean;
  icon?: boolean;
  actions?: AlertAction[];
  onDismiss?: () => void;
  className?: string;
}

const CONFIG: Record<
  AlertVariant,
  {
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
    titleColor: string;
    msgColor: string;
    dismissColor: string;
    primaryBg: string;
    primaryText: string;
    ghostColor: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    bg: "#f0fdf4",
    border: "#bbf7d0",
    iconBg: "#dcfce7",
    iconColor: "#16a34a",
    titleColor: "#14532d",
    msgColor: "#166534",
    dismissColor: "#86efac",
    primaryBg: "#16a34a",
    primaryText: "#ffffff",
    ghostColor: "#16a34a",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  error: {
    bg: "#fef2f2",
    border: "#fecaca",
    iconBg: "#fee2e2",
    iconColor: "#dc2626",
    titleColor: "#7f1d1d",
    msgColor: "#991b1b",
    dismissColor: "#fca5a5",
    primaryBg: "#dc2626",
    primaryText: "#ffffff",
    ghostColor: "#dc2626",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  warning: {
    bg: "#fffbeb",
    border: "#fde68a",
    iconBg: "#fef3c7",
    iconColor: "#d97706",
    titleColor: "#78350f",
    msgColor: "#92400e",
    dismissColor: "#fcd34d",
    primaryBg: "#d97706",
    primaryText: "#ffffff",
    ghostColor: "#d97706",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  info: {
    bg: "#eff6ff",
    border: "#bfdbfe",
    iconBg: "#dbeafe",
    iconColor: "#2563eb",
    titleColor: "#1e3a8a",
    msgColor: "#1e40af",
    dismissColor: "#93c5fd",
    primaryBg: "#2563eb",
    primaryText: "#ffffff",
    ghostColor: "#2563eb",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
};

export function Alert({
  variant,
  title,
  message,
  dismissible = false,
  icon = true,
  actions,
  onDismiss,
  className = "",
}: AlertProps) {
  const [visible, setVisible] = useState(true);
  const c = CONFIG[variant];

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div
      className={`rounded-xl flex gap-3 p-4 transition-all ${className}`}
      style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}
      role="alert"
    >
      {/* Icon */}
      {icon && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
          style={{ backgroundColor: c.iconBg, color: c.iconColor }}
        >
          {c.icon}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-semibold mb-0.5" style={{ color: c.titleColor }}>
            {title}
          </p>
        )}
        <p className="text-sm leading-relaxed" style={{ color: c.msgColor }}>
          {message}
        </p>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {actions.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={action.onClick}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={
                  action.variant === "ghost"
                    ? { color: c.ghostColor, backgroundColor: "transparent", border: `1px solid ${c.border}` }
                    : { backgroundColor: c.primaryBg, color: c.primaryText, border: "1px solid transparent" }
                }
                onMouseOver={(e) => {
                  const el = e.currentTarget;
                  el.style.opacity = "0.85";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dismiss */}
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all mt-0.5"
          style={{ color: c.dismissColor }}
          onMouseOver={(e) => { e.currentTarget.style.color = c.iconColor; }}
          onMouseOut={(e) => { e.currentTarget.style.color = c.dismissColor; }}
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* Controlled variant — caller owns visibility */
export function useAlert() {
  const [alerts, setAlerts] = useState<(AlertProps & { id: number })[]>([]);
  const counter = { current: 0 };

  const show = (props: Omit<AlertProps, "onDismiss">) => {
    const id = ++counter.current;
    setAlerts((prev) => [...prev, { ...props, id, onDismiss: () => dismiss(id) }]);
    return id;
  };

  const dismiss = (id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return { alerts, show, dismiss };
}
