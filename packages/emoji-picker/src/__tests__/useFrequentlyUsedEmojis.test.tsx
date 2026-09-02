import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useFrequentlyUsedEmojis } from "../hooks/useFrequentlyUsedEmojis";

describe("useFrequentlyUsedEmojis", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty and increments usage count on record", async () => {
    const { result } = renderHook(() => useFrequentlyUsedEmojis(5));
    await waitFor(() => expect(result.current.frequentlyUsedEmojis).toEqual([]));

    act(() => {
      result.current.recordEmojiUsage("fire");
    });

    await waitFor(() => {
      expect(result.current.frequentlyUsedEmojis[0]?.name).toBe("fire");
    });
  });

  it("sorts by usage count descending", async () => {
    const { result } = renderHook(() => useFrequentlyUsedEmojis(5));
    await waitFor(() => expect(result.current.frequentlyUsedEmojis).toEqual([]));

    act(() => {
      result.current.recordEmojiUsage("fire");
    });
    act(() => {
      result.current.recordEmojiUsage("grinning-face");
    });
    act(() => {
      result.current.recordEmojiUsage("grinning-face");
    });

    await waitFor(() => {
      expect(result.current.frequentlyUsedEmojis.map((emoji) => emoji.name)).toEqual(["grinning-face", "fire"]);
    });
  });

  it("respects the configured limit", async () => {
    const { result } = renderHook(() => useFrequentlyUsedEmojis(1));
    await waitFor(() => expect(result.current.frequentlyUsedEmojis).toEqual([]));

    act(() => {
      result.current.recordEmojiUsage("fire");
    });
    act(() => {
      result.current.recordEmojiUsage("grinning-face");
    });
    act(() => {
      result.current.recordEmojiUsage("grinning-face");
    });

    await waitFor(() => {
      expect(result.current.frequentlyUsedEmojis).toHaveLength(1);
      expect(result.current.frequentlyUsedEmojis[0]?.name).toBe("grinning-face");
    });
  });
});
