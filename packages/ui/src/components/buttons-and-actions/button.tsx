import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface DhritiButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  loading?: boolean;
}

const variants = {
  primary: "border-brand bg-brand text-text-inverse shadow-sm hover:border-brand-dark hover:bg-brand-dark",
  secondary: "border-border bg-surface text-text-primary hover:bg-surface-raised",
  danger: "border-error bg-surface text-error hover:bg-error/10",
} as const;
const sizes = {
  sm: "min-h-8 gap-1.5 px-3 py-1.5 text-xs",
  md: "min-h-10 gap-2 px-4 py-2 text-sm",
  lg: "min-h-12 gap-2 px-5 py-3 text-base",
} as const;

/** Loading disables submission while preserving the button's accessible name. */
export function DhritiButton({
  variant = "primary",
  size = "md",
  startIcon,
  endIcon,
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  children,
  ...props
}: DhritiButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex cursor-pointer items-center justify-center rounded-md border font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <LoaderCircle aria-hidden="true" className="size-4 shrink-0 animate-spin motion-reduce:animate-none" />
      ) : (
        startIcon && <span aria-hidden="true" className="shrink-0">{startIcon}</span>
      )}
      {children}
      {endIcon && <span aria-hidden="true" className="shrink-0">{endIcon}</span>}
    </button>
  );
}
