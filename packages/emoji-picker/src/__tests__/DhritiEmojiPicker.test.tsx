import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DhritiEmojiPicker } from "../components/DhritiEmojiPicker";

describe("DhritiEmojiPicker", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders a searchable grid and calls onSelect with the full emoji definition", async () => {
    const handleSelect = vi.fn();
    render(<DhritiEmojiPicker onSelect={handleSelect} initialCategory="smileys-emotion" showFrequentlyUsed={false} showRecent={false} />);

    const searchInput = screen.getByLabelText("Search emoji");
    fireEvent.change(searchInput, { target: { value: "grinning-face" } });

    const option = await screen.findByRole("option", { name: /grinning face/i });
    fireEvent.click(option);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect.mock.calls[0][0]).toMatchObject({ name: "grinning-face", emoji: "\ud83d\ude00" });
  });

  it("switches categories via the tab list", async () => {
    render(<DhritiEmojiPicker initialCategory="smileys-emotion" showFrequentlyUsed={false} showRecent={false} />);

    const foodTab = screen.getByRole("tab", { name: /food & drink/i });
    fireEvent.click(foodTab);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /red apple/i })).toBeInTheDocument();
    });
  });

  it("hides the frequently-used / recent tabs when disabled via props", () => {
    render(<DhritiEmojiPicker showFrequentlyUsed={false} showRecent={false} initialCategory="smileys-emotion" />);

    expect(screen.queryByRole("tab", { name: /frequently used/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /^recent$/i })).not.toBeInTheDocument();
  });
});
