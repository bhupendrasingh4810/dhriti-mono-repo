import { fireEvent, render, screen } from "@testing-library/react";
import { AtSign } from "lucide-react";
import { expect, test, vi } from "vitest";
import ConnectSidebar from "../ConnectSidebar";

vi.mock("next/navigation", () => ({ usePathname: () => "/connect", useSearchParams: () => new URLSearchParams() }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));

test("selects a quick view from the sidebar", () => {
  const select = vi.fn();
  render(<ConnectSidebar quickViews={[{ id: "mentions", label: "Mentions", value: 0, icon: AtSign }]} favoriteConversations={[]} chatConversations={[]} teams={[]} selectedConversationId="" onToggleTeam={vi.fn()} onSelectConversation={vi.fn()} onSelectQuickView={select} onOpenSidebarMenu={vi.fn()} />);
  fireEvent.click(screen.getByText("Mentions"));
  expect(select).toHaveBeenCalledWith("mentions");
});
