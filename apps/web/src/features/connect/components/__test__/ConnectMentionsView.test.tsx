import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ConnectMentionsView } from "../ConnectMentionsView";

test("renders the empty mention selection state", () => {
  render(<ConnectMentionsView items={[]} usersById={{}} selectedMentionId={null} filter="unread" detail={null} onSelectMention={vi.fn()} onFilterChange={vi.fn()} onOpenChannelMenu={vi.fn()} onOpenCallOptions={vi.fn()} onOpenInNewWindow={vi.fn()} onGoToChannel={vi.fn()} composer={<div>Composer</div>} />);
  expect(screen.getByText(/select a mention/i)).toBeInTheDocument();
});
