import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useRecentEmojis } from "../hooks/useRecentEmojis";

describe("useRecentEmojis", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty and adds a new emoji to the front", async () => {
    const { result } = renderHook(() => useRecentEmojis(5));
    await waitFor(() => expect(result.current.recentEmojis).toEqual([]));

    act(() => {
      result.current.addRecentEmoji("grinning-face");
    });

    await waitFor(() => {
      expect(result.current.recentEmojis[0]?.name).toBe("grinning-face");
    });
  });

  it("moves an existing emoji to the top instead of duplicating it", async () => {
    const { result } = renderHook(() => useRecentEmojis(5));
    await waitFor(() => expect(result.current.recentEmojis).toEqual([]));

    act(() => {
      result.current.addRecentEmoji("grinning-face");
    });
    act(() => {
      result.current.addRecentEmoji("fire");
    });
    act(() => {
      result.current.addRecentEmoji("grinning-face");
    });

    await waitFor(() => {
      expect(result.current.recentEmojis.map((emoji) => emoji.name)).toEqual(["grinning-face", "fire"]);
    });
  });

  it("respects the configured limit", async () => {
    const { result } = renderHook(() => useRecentEmojis(2));
    await waitFor(() => expect(result.current.recentEmojis).toEqual([]));

    act(() => {
      result.current.addRecentEmoji("grinning-face");
    });
    act(() => {
      result.current.addRecentEmoji("fire");
    });
    act(() => {
      result.current.addRecentEmoji("thumbs-up");
    });

    await waitFor(() => {
      expect(result.current.recentEmojis).toHaveLength(2);
      expect(result.current.recentEmojis.map((emoji) => emoji.name)).toEqual(["thumbs-up", "fire"]);
    });
  });

  it("persists across remounts (localStorage)", async () => {
    const first = renderHook(() => useRecentEmojis(5));
    await waitFor(() => expect(first.result.current.recentEmojis).toEqual([]));
    act(() => {
      first.result.current.addRecentEmoji("fire");
    });

    const second = renderHook(() => useRecentEmojis(5));
    await waitFor(() => {
      expect(second.result.current.recentEmojis.map((emoji) => emoji.name)).toEqual(["fire"]);
    });
  });

  it("clearRecentEmojis empties the list", async () => {
    const { result } = renderHook(() => useRecentEmojis(5));
    await waitFor(() => expect(result.current.recentEmojis).toEqual([]));

    act(() => {
      result.current.addRecentEmoji("fire");
    });
    await waitFor(() => expect(result.current.recentEmojis).toHaveLength(1));

    act(() => {
      result.current.clearRecentEmojis();
    });
    await waitFor(() => expect(result.current.recentEmojis).toEqual([]));
  });
});
