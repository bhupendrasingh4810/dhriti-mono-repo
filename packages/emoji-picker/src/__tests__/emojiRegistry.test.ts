import { describe, expect, it } from "vitest";
import { getEmojiByName } from "../data/emojiRegistry";

describe("getEmojiByName", () => {
  it("resolves an emoji by its canonical name", () => {
    const result = getEmojiByName("grinning-face");
    expect(result?.emoji).toBe("\ud83d\ude00");
    expect(result?.category).toBe("smileys-emotion");
  });

  it("resolves an emoji by a known alias", () => {
    const result = getEmojiByName("thumbsup");
    expect(result?.name).toBe("thumbs-up");
  });

  it("resolves aliases such as '+1'", () => {
    const result = getEmojiByName("+1");
    expect(result?.name).toBe("thumbs-up");
  });

  it("is case-insensitive and trims whitespace", () => {
    const result = getEmojiByName("  Grinning-Face  ");
    expect(result?.name).toBe("grinning-face");
  });

  it("returns undefined for an unknown emoji name", () => {
    expect(getEmojiByName("not-a-real-emoji")).toBeUndefined();
  });
});
