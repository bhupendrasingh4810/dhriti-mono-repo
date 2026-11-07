"use client";


import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Cake,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  FileText,
  Filter,
  LayoutDashboard,
  Laptop,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Target,
  TrendingUp,
  Users,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";

export type Role = "Employee" | "Manager" | "HR Admin" | "Platform Admin";
export type DirectoryEmployee = {
  id: string;
  name: string;
  code: string;
  role: string;
  department: string;
  location: string;
  type: string;
  status: string;
};

export type HRMSInitialData = {
  currentUser: {
    name: string;
    roles: string[];
  };
  organizations: Array<{ id: string; name: string }>;
  employees: DirectoryEmployee[];
};
export type View =
  | "Dashboard"
  | "Employees"
  | "Attendance"
  | "Leave"
  | "Payroll"
  | "Recruitment"
  | "Performance"
  | "Training"
  | "Assets"
  | "Documents"
  | "Reports"
  | "Settings";
type DemoState = "Default" | "Loading" | "Empty" | "Error";

export const views: { label: View; icon: IconName; group?: string }[] = [
  { label: "Dashboard", icon: "grid" },
  { label: "Employees", icon: "users", group: "People" },
  { label: "Attendance", icon: "clock" },
  { label: "Leave", icon: "calendar" },
  { label: "Payroll", icon: "wallet", group: "Operations" },
  { label: "Recruitment", icon: "briefcase" },
  { label: "Performance", icon: "target" },
  { label: "Training", icon: "book", group: "Growth" },
  { label: "Assets", icon: "laptop" },
  { label: "Documents", icon: "file", group: "Workplace" },
  { label: "Reports", icon: "chart" },
  { label: "Settings", icon: "settings" },
];

export type IconName =
  | "grid"
  | "users"
  | "clock"
  | "calendar"
  | "wallet"
  | "briefcase"
  | "target"
  | "book"
  | "laptop"
  | "file"
  | "chart"
  | "settings"
  | "search"
  | "plus"
  | "download"
  | "bell"
  | "chevron"
  | "check"
  | "trend"
  | "filter"
  | "dots"
  | "close"
  | "cake"
  | "alert"
  | "arrow";

export function Icon({ name, size = 18, className = "" }: { name: IconName; size?: number; className?: string }) {
  const icons: Record<IconName, LucideIcon> = {
    grid: LayoutDashboard,
    users: Users,
    clock: Clock3,
    calendar: CalendarDays,
    wallet: WalletCards,
    briefcase: BriefcaseBusiness,
    target: Target,
    book: BookOpen,
    laptop: Laptop,
    file: FileText,
    chart: ChartNoAxesColumnIncreasing,
    settings: Settings,
    search: Search,
    plus: Plus,
    download: Download,
    bell: Bell,
    chevron: ChevronRight,
    check: Check,
    trend: TrendingUp,
    filter: Filter,
    dots: MoreHorizontal,
    close: X,
    cake: Cake,
    alert: CircleAlert,
    arrow: ArrowRight,
  };
  const LucideIcon = icons[name];
  return <LucideIcon aria-hidden="true" size={size} strokeWidth={1.8} className={className} />;
}

export function Button({
  children,
  icon,
  variant = "primary",
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  icon?: IconName;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-dark shadow-sm",
    secondary: "border border-border bg-white text-text-primary hover:bg-surface-raised",
    ghost: "text-text-secondary hover:bg-surface-raised",
    danger: "bg-error text-white hover:opacity-90",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]}`}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "danger" | "info" | "neutral" | "brand";
}) {
  const tones = {
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700",
    neutral: "bg-slate-100 text-slate-600",
    brand: "bg-brand-muted text-brand",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-border bg-surface shadow-sm ${className}`}>{children}</section>;
}

export function CardTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div>
        <h3 className="font-display text-base font-semibold text-text-primary">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const avatars = ["AS", "RK", "NM", "PV", "IK", "SM"];
const avatarColors = [
  "bg-teal-100 text-teal-700",
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

export function Avatar({ initials, index = 0, size = "md" }: { initials: string; index?: number; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-12 w-12 text-sm" };
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${sizes[size]} ${avatarColors[index % avatarColors.length]}`}
    >
      {initials}
    </div>
  );
}

