import { render, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { WorkspaceCallSocketBridge } from "../WorkspaceCallSocketBridge";

vi.mock("socket.io-client", () => ({ io: vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn() })) }));

test("registers a connected workspace socket", async () => {
  const register = vi.fn();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url: "ws://test", token: "token" }) }));
  render(<WorkspaceCallSocketBridge registerSocket={register} />);
  await waitFor(() => expect(register).toHaveBeenCalledWith(expect.anything()));
});
