import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DhritiBreadcrumb } from "@dhriti/ui";

afterEach(cleanup);

describe("DhritiBreadcrumb", () => {
  it("renders a labeled ordered trail with a non-link current page", () => {
    render(
      <DhritiBreadcrumb
        items={[{ label: "Admin", href: "/admin" }, { label: "Platform" }, { label: "Entitlements", href: "/current" }]}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(nav).getByRole("list")).toBeInTheDocument();
    expect(within(nav).getAllByRole("listitem")).toHaveLength(3);
    expect(within(nav).getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin");
    expect(within(nav).getByText("Platform").closest("a")).toBeNull();
    expect(within(nav).getByText("Entitlements")).toHaveAttribute("aria-current", "page");
    expect(within(nav).queryByRole("link", { name: "Entitlements" })).not.toBeInTheDocument();
  });

  it("supports router links and a custom landmark label", () => {
    const renderLink = vi.fn((item: { label: string; href: string }, className: string) => (
      <a href={item.href} className={className} data-router-link="true">
        {item.label}
      </a>
    ));
    render(
      <DhritiBreadcrumb
        label="Location"
        separator="chevron"
        variant="plain"
        items={[{ label: "HRMS", href: "/hrms" }, { label: "Workforce" }]}
        renderLink={renderLink}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Location" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "HRMS" })).toHaveAttribute("data-router-link", "true");
    expect(renderLink).toHaveBeenCalledTimes(1);
  });

  it("renders nothing for an empty trail", () => {
    const { container } = render(<DhritiBreadcrumb items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
