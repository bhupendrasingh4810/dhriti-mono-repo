import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ConnectPostsView } from "../ConnectPostsView";

vi.mock("@/services/connect.service", () => ({ connectService: { listPosts: vi.fn().mockResolvedValue([]), markMessagesRead: vi.fn() } }));

test("renders the channel post header", async () => {
  render(<ConnectPostsView organizationId="org" channelId="channel" channelName="Design" currentUserId="u" usersById={{}} renderHeader={(create) => <button onClick={create}>Create post</button>} />);
  expect(await screen.findByRole("button", { name: "Create post" })).toBeInTheDocument();
});
