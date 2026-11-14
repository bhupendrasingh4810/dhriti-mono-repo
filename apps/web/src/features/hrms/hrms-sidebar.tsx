"use client";

import { PageSidebar } from "@/components/layout/workspace/page-sidebar";
import {
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Clock3,
  FileText,
  LayoutDashboard,
  Laptop,
  Settings,
  Target,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import { usePermissions } from "@/hooks/use-permissions";

const items = [
  { label: "Dashboard", href: "", icon: LayoutDashboard },
  { label: "Workforce", href: "employees", icon: Users, group: "People" },
  { label: "Attendance", href: "attendance", icon: Clock3 },
  { label: "Leave", href: "leave", icon: CalendarDays },
  { label: "Payroll", href: "payroll", icon: WalletCards, group: "Operations" },
  { label: "Recruitment", href: "recruitment", icon: BriefcaseBusiness },
  { label: "Performance", href: "performance", icon: Target },
  { label: "Training", href: "training", icon: BookOpen, group: "Growth" },
  { label: "Assets", href: "assets", icon: Laptop },
  { label: "Documents", href: "documents", icon: FileText, group: "Workplace" },
  { label: "Reports", href: "reports", icon: ChartNoAxesColumnIncreasing },
  { label: "Settings", href: "settings", icon: Settings },
];

export function HrmsSidebar() {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const pathname = usePathname();
  const basePath = `/${organizationSlug}/hrms`;
  const { can } = usePermissions();
  const visibleItems = items.filter((item) => item.href !== "employees" || can("hrms.employee.manage"));

  return (
    <PageSidebar>
<aside className="hidden h-full w-[312px] shrink-0 flex-col overflow-hidden rounded-[20px] border border-brand bg-brand lg:flex">
      <div className="border-b border-on-brand-border p-4">
        <p className="text-sm font-bold text-text-inverse">HRMS</p>
      </div>
      <nav aria-label="HRMS navigation" className="min-h-0 flex-1 overflow-y-auto p-4">
        {visibleItems.map((item) => {
          const href = item.href ? `${basePath}/${item.href}` : basePath;
          const active = item.href ? pathname === href || pathname.startsWith(`${href}/`) : pathname === href;
          const Icon = item.icon;
          return (
            <div key={item.label}>
              {item.group && (
                <p className="mb-2 mt-5 px-3 text-[10px] font-bold uppercase tracking-widest text-on-brand-muted">
                  {item.group}
                </p>
              )}
              <Link
                href={href}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-on-brand-border text-text-inverse"
                    : "text-on-brand-muted hover:bg-on-brand-hover hover:text-text-inverse"
                }`}
              >
                <Icon aria-hidden="true" size={17} />
                <span>{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>
    </aside>
</PageSidebar>
  );
}
