import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { WorkspaceCallProvider } from "../WorkspaceCallProvider";

vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { id: "u", name: "Asha" } }) }));
vi.mock("socket.io-client", () => ({ io: vi.fn() }));

test("provides the workspace call surface around children", () => {
  render(<WorkspaceCallProvider><p>Connect workspace</p></WorkspaceCallProvider>);
  expect(screen.getByText("Connect workspace")).toBeInTheDocument();
});
