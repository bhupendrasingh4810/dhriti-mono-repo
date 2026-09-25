"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AlertVariant = "success" | "error" | "warning" | "info";

export type AlertPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

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
  duration?: number;
  position?: AlertPosition;
}

interface AlertItem extends AlertProps {
  id: number;
}

interface AlertContextValue {
  showAlert: (props: Omit<AlertProps, "onDismiss">) => number;
  dismiss: (id: number) => void;
}

interface AlertProviderProps {
  children: ReactNode;
  position?: AlertPosition;
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
    icon: ReactNode;
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
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
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
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
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
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
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
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
};

const POSITION_CLASSES: Record<AlertPosition, string> = {
  "top-left": "left-4 top-4 items-start",
  "top-center": "left-1/2 top-4 -translate-x-1/2 items-center",
  "top-right": "right-4 top-4 items-end",
  "bottom-left": "bottom-4 left-4 items-start",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "bottom-4 right-4 items-end",
};

function getExitTransform(position: AlertPosition) {
  switch (position) {
    case "top-left":
    case "bottom-left":
      return "translate3d(-32px, 0, 0) scale(0.95)";

    case "top-right":
    case "bottom-right":
      return "translate3d(32px, 0, 0) scale(0.95)";

    case "top-center":
      return "translate3d(0, -32px, 0) scale(0.95)";

    case "bottom-center":
      return "translate3d(0, 32px, 0) scale(0.95)";
  }
}

function getInitialTransform(position: AlertPosition) {
  switch (position) {
    case "top-left":
    case "bottom-left":
      return "translate3d(-32px, 0, 0) scale(0.95)";

    case "top-right":
    case "bottom-right":
      return "translate3d(32px, 0, 0) scale(0.95)";

    case "top-center":
      return "translate3d(0, -32px, 0) scale(0.95)";

    case "bottom-center":
      return "translate3d(0, 32px, 0) scale(0.95)";
  }
}

export function Alert({
  variant,
  title,
  message,
  dismissible = false,
  icon = false,
  actions,
  onDismiss,
  className = "",
  duration = 4000,
  position = "top-right",
}: AlertProps) {
  const [mounted, setMounted] = useState(true);
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);

  const dismissCalledRef = useRef(false);
  const colors = CONFIG[variant];

  const handleDismiss = useCallback(() => {
    if (exiting) {
      return;
    }

    setExiting(true);
  }, [exiting]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setEntered(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!duration || exiting) {
      return;
    }

    const timer = window.setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => {
      window.clearTimeout(timer);
    };
  }, [duration, exiting, handleDismiss]);

  useEffect(() => {
    if (!exiting) {
      return;
    }

    const timer = window.setTimeout(() => {
      setMounted(false);

      if (!dismissCalledRef.current) {
        dismissCalledRef.current = true;
        onDismiss?.();
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [exiting, onDismiss]);

  if (!mounted) {
    return null;
  }

  const transform = exiting
    ? getExitTransform(position)
    : entered
      ? "translate3d(0, 0, 0) scale(1)"
      : getInitialTransform(position);

  return (
    <div
      className={[
        "w-full max-w-md",
        "flex gap-3 rounded-xl border p-4",
        "transform-gpu transition-all duration-300",
        "ease-[cubic-bezier(0.22,1,0.36,1)]",
        "motion-reduce:transition-none",
        exiting ? "pointer-events-none opacity-0" : "opacity-100",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        transform,
      }}
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      {icon && (
        <div
          className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: colors.iconBg,
            color: colors.iconColor,
          }}
          aria-hidden="true"
        >
          {colors.icon}
        </div>
      )}

      <div className="min-w-0 flex-1">
        {title && (
          <p className="mb-0.5 text-sm font-semibold" style={{ color: colors.titleColor }}>
            {title}
          </p>
        )}

        <p className="text-sm leading-relaxed" style={{ color: colors.msgColor }}>
          {message}
        </p>

        {actions && actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 motion-reduce:transition-none"
                style={
                  action.variant === "ghost"
                    ? {
                        color: colors.ghostColor,
                        backgroundColor: "transparent",
                        border: `1px solid ${colors.border}`,
                      }
                    : {
                        backgroundColor: colors.primaryBg,
                        color: colors.primaryText,
                        border: "1px solid transparent",
                      }
                }
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 motion-reduce:transition-none"
          style={{ color: colors.dismissColor }}
          onMouseEnter={(event) => {
            event.currentTarget.style.color = colors.iconColor;
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.color = colors.dismissColor;
          }}
          aria-label="Dismiss notification"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export function AlertProvider({ children, position = "top-right" }: AlertProviderProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setAlerts((previousAlerts) => previousAlerts.filter((alert) => alert.id !== id));
  }, []);

  const showAlert = useCallback(
    (props: Omit<AlertProps, "onDismiss">) => {
      const id = ++counter.current;

      setAlerts((previousAlerts) => [
        ...previousAlerts,
        {
          ...props,
          id,
          position: props.position ?? position,
          onDismiss: () => dismiss(id),
        },
      ]);

      return id;
    },
    [dismiss, position],
  );

  return (
    <AlertContext.Provider value={{ showAlert, dismiss }}>
      {children}

      <div
        className={[
          "pointer-events-none fixed z-50 flex w-full max-w-md flex-col gap-3 p-4 sm:p-0",
          POSITION_CLASSES[position],
        ].join(" ")}
        aria-live="polite"
        aria-atomic="false"
      >
        {alerts.map(({ id, ...alert }) => (
          <div key={id} className="pointer-events-auto w-full">
            <Alert {...alert} />
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
}

export function useAlert(): AlertContextValue {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }

  return context;
}
