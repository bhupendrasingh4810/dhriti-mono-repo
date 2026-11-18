import type { HTMLAttributes, ReactNode } from "react";

export type DhritiCardVariant = "default" | "success" | "warning" | "danger" | "info";
export type DhritiCardPadding = "sm" | "md" | "lg";

export interface DhritiCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: DhritiCardVariant;
  padding?: DhritiCardPadding;
  children: ReactNode;
}

const variants: Record<DhritiCardVariant, string> = {
  default: "border-border bg-surface",
  success: "border-success/30 bg-success/5",
  warning: "border-warning/30 bg-warning/5",
  danger: "border-error/30 bg-surface",
  info: "border-info/30 bg-info/5",
};

const paddings: Record<DhritiCardPadding, string> = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function DhritiCard({
  variant = "default",
  padding = "md",
  className = "",
  children,
  ...props
}: DhritiCardProps) {
  return (
    <div {...props} className={`min-w-0 rounded-xl border ${variants[variant]} ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}

export interface DhritiEmptyCardProps extends Omit<DhritiCardProps, "children"> {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}

/** A consistent empty-state surface; actions remain supplied by the consuming feature. */
export function DhritiEmptyCard({ title, description, icon, action, className = "", ...props }: DhritiEmptyCardProps) {
  return (
    <DhritiCard
      {...props}
      className={`flex min-h-40 flex-col items-center justify-center gap-3 text-center ${className}`}
    >
      {icon && (
        <span aria-hidden="true" className="text-text-muted">
          {icon}
        </span>
      )}
      <div className="min-w-0 space-y-1">
        <h3 className="font-semibold text-text-primary">{title}</h3>
        {description && <p className="break-words text-sm text-text-secondary">{description}</p>}
      </div>
      {action}
    </DhritiCard>
  );
}
