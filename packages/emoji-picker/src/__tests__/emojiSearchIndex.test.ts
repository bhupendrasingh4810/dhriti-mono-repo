import { describe, expect, it } from "vitest";
import { searchEmojis } from "../data/emojiSearchIndex";

describe("searchEmojis", () => {
  it("matches by exact canonical name", () => {
    const results = searchEmojis("grinning-face");
    expect(results.some((emoji) => emoji.name === "grinning-face")).toBe(true);
  });

  it("matches by partial name", () => {
    const results = searchEmojis("grin");
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        (emoji) =>
          emoji.name.includes("grin") ||
          emoji.aliases.some((alias) => alias.includes("grin")) ||
          emoji.keywords.some((keyword) => keyword.includes("grin")),
      ),
    ).toBe(true);
  });

  it("is case-insensitive", () => {
    const lower = searchEmojis("fire");
    const upper = searchEmojis("FIRE");
    expect(upper.map((emoji) => emoji.id)).toEqual(lower.map((emoji) => emoji.id));
    expect(lower.length).toBeGreaterThan(0);
  });

  it("matches by keyword", () => {
    const results = searchEmojis("celebration");
    expect(results.some((emoji) => emoji.name === "party-popper")).toBe(true);
  });

  it("matches by alias", () => {
    const results = searchEmojis("+1");
    expect(results.some((emoji) => emoji.name === "thumbs-up")).toBe(true);
  });

  it("returns no results for an empty query", () => {
    expect(searchEmojis("   ")).toEqual([]);
  });

  it("does not return duplicate emojis for overlapping token matches", () => {
    const results = searchEmojis("heart");
    const ids = results.map((emoji) => emoji.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
