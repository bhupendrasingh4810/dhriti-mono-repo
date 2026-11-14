import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OrganizationMembers } from "../../organization-members";
import { controlOrganizationService, type ControlOrganizationMember } from "@/services/control.service";

vi.mock("@/services/control.service", () => ({
  controlOrganizationService: { listMembers: vi.fn() },
}));
const member: ControlOrganizationMember = {
  id: "member-a",
  name: "Jordan Lee",
  email: "jordan@example.test",
  role: "OWNER",
  status: "ACTIVE",
  isOwner: true,
  joinedAt: "2026-11-14",
  teams: ["Engineering"],
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(controlOrganizationService.listMembers).mockResolvedValue([member]);
});
afterEach(cleanup);

describe("OrganizationMembers", () => {
  const members: ControlOrganizationMember[] = Array.from({ length: 25 }, (_, index) => ({
    ...member,
    id: `member-${index}`,
    name: `Member ${String(index + 1).padStart(2, "0")}`,
    email: `member${index + 1}@example.test`,
    isOwner: index === 0,
    status: index % 2 === 0 ? "ACTIVE" : "SUSPENDED",
    teams: index < 12 ? ["Engineering"] : ["Design"],
  }));

  it("paginates the table with range, page-size selector and chevron controls", async () => {
    vi.mocked(controlOrganizationService.listMembers).mockResolvedValue(members);
    render(<OrganizationMembers organizationId="org-b" />);
    const table = await screen.findByRole("table", { name: "Organization members" });
    const scrollArea = screen.getByRole("region", { name: "Members table scroll area" });
    expect(scrollArea).toHaveClass("overflow-auto", "min-h-0", "flex-1");
    expect(scrollArea).toContainElement(table);
    expect(scrollArea).not.toContainElement(screen.getByRole("navigation", { name: "Members pagination" }));
    expect(table.querySelector("thead")).toHaveClass("sticky", "top-0");
    const toolbar = screen.getByRole("group", { name: "Member search and filters" });
    expect(toolbar).toContainElement(screen.getByRole("searchbox"));
    expect(within(toolbar).getAllByRole("combobox")).toHaveLength(3);
    expect(within(table).getAllByRole("row")).toHaveLength(11);
    expect(screen.getByText("1-10 of 25")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("11-20 of 25")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Rows per page" }), { target: { value: "20" } });
    expect(screen.getByText("1-20 of 25")).toBeInTheDocument();
    expect(within(table).getAllByRole("row")).toHaveLength(21);
  });

  it("sorts the entire result set using column heading controls and resets the page", async () => {
    vi.mocked(controlOrganizationService.listMembers).mockResolvedValue(members);
    render(<OrganizationMembers organizationId="org-b" />);
    const table = await screen.findByRole("table");
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    fireEvent.click(screen.getByRole("button", { name: "Name" }));
    expect(screen.getByText("1-10 of 25")).toBeInTheDocument();
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("Member 01");
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "ascending");
    fireEvent.click(screen.getByRole("button", { name: "Name" }));
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("Member 25");
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "descending");
  });

  it("combines status, membership and team filters before pagination and clears them", async () => {
    vi.mocked(controlOrganizationService.listMembers).mockResolvedValue(members);
    render(<OrganizationMembers organizationId="org-b" />);
    await screen.findByRole("table");
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Filter by status" }), { target: { value: "ACTIVE" } });
    expect(screen.getByText("1-10 of 13")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Filter by membership" }), { target: { value: "owner" } });
    expect(screen.getByText("1-1 of 1")).toBeInTheDocument();
    expect(screen.getByText("Member 01")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Filter by team" }), { target: { value: "Design" } });
    expect(screen.getByText("No members match your filters.")).toBeInTheDocument();
    expect(screen.getByText("0-0 of 0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("1-10 of 25")).toBeInTheDocument();
    expect(controlOrganizationService.listMembers).toHaveBeenCalledTimes(1);
  });

  it("uses the existing API with the selected organization and renders real member details", async () => {
    render(<OrganizationMembers organizationId="org-b" />);
    expect(await screen.findByText("Jordan Lee")).toBeInTheDocument();
    expect(screen.getByText("jordan@example.test")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("Engineering")).toBeInTheDocument();
    expect(controlOrganizationService.listMembers).toHaveBeenCalledWith("org-b", "");
    expect(screen.queryByText("Alice Johnson (Owner)")).not.toBeInTheDocument();
  });

  it("searches on the server and reports no matches", async () => {
    render(<OrganizationMembers organizationId="org-b" />);
    await screen.findByText("Jordan Lee");
    vi.mocked(controlOrganizationService.listMembers).mockResolvedValue([]);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "nobody" } });
    expect(screen.queryByText("Jordan Lee")).not.toBeInTheDocument();
    expect(await screen.findByText("No members match your search.")).toBeInTheDocument();
    expect(controlOrganizationService.listMembers).toHaveBeenLastCalledWith("org-b", "nobody");
  });

  it("shows failed loads and retries without showing fabricated members", async () => {
    vi.mocked(controlOrganizationService.listMembers).mockRejectedValueOnce(new Error("Access denied"));
    render(<OrganizationMembers organizationId="org-b" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Access denied");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Jordan Lee")).toBeInTheDocument();
  });

  it("ignores an outdated search response", async () => {
    let resolveOld!: (members: ControlOrganizationMember[]) => void;
    vi.mocked(controlOrganizationService.listMembers).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
    );
    render(<OrganizationMembers organizationId="org-b" />);
    await waitFor(() => expect(controlOrganizationService.listMembers).toHaveBeenCalledTimes(1));
    vi.mocked(controlOrganizationService.listMembers).mockResolvedValue([]);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "nobody" } });
    await screen.findByText("No members match your search.");
    resolveOld([member]);
    await waitFor(() => expect(screen.queryByText("Jordan Lee")).not.toBeInTheDocument());
  });
});
