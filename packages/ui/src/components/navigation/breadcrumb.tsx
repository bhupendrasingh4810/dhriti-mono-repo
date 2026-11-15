import { Fragment, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type DhritiBreadcrumbProps = {
  items: readonly BreadcrumbItem[];
  label?: string;
  separator?: "slash" | "chevron";
  variant?: "surface" | "plain";
  size?: "sm" | "md";
  className?: string;
  renderLink?: (item: BreadcrumbItem & { href: string }, className: string) => ReactNode;
};

/**
 * The last item represents the current page and is never rendered as a link.
 * Supply renderLink to integrate a router without coupling this component to one.
 */
export function DhritiBreadcrumb({
  items,
  label = "Breadcrumb",
  separator = "slash",
  variant = "surface",
  size = "md",
  className = "",
  renderLink,
}: DhritiBreadcrumbProps) {
  if (!items.length) return null;

  const linkClass =
    "cursor-pointer rounded-sm text-text-secondary transition-colors hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand";

  return (
    <nav
      aria-label={label}
      className={`${variant === "surface" ? "rounded-lg border border-border bg-surface px-6 py-4" : ""} ${className}`}
    >
      <ol className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${size === "sm" ? "text-xs" : "text-sm"}`}>
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <Fragment key={index}>
              {index > 0 && (
                <li aria-hidden="true" className="shrink-0 text-text-muted">
                  {separator === "slash" ? "/" : <ChevronRight className="size-4" />}
                </li>
              )}
              <li className="min-w-0 max-w-full break-words">
                {current ? (
                  <span aria-current="page" className="font-semibold text-text-primary">
                    {item.label}
                  </span>
                ) : item.href ? (
                  renderLink ? (
                    renderLink({ ...item, href: item.href }, linkClass)
                  ) : (
                    <a href={item.href} className={linkClass}>
                      {item.label}
                    </a>
                  )
                ) : (
                  <span className="text-text-secondary">{item.label}</span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
