# @dhriti/emoji-picker

Reusable emoji picker and single-emoji rendering package for Dhriti applications.

## Installation

Internal workspace package — add it to an app's dependencies via the workspace protocol:

```json
{
  "dependencies": {
    "@dhriti/emoji-picker": "workspace:*"
  }
}
```

Then run `pnpm install` from the repo root.

## Basic Picker

```tsx
import { DhritiEmojiPicker } from "@dhriti/emoji-picker";

<DhritiEmojiPicker
  onSelect={(emoji) => {
    console.log(emoji.name, emoji.emoji);
  }}
/>;
```

Typically rendered inside a MUI `Popover`/`Menu` anchored to a toolbar button.

## Single Emoji

```tsx
import { DhritiEmoji } from "@dhriti/emoji-picker";

<DhritiEmoji name="grinning-face" />;
```

## Custom Size

```tsx
<DhritiEmoji name="party-popper" size={32} />
```

## Animated Emojis

Both components can render smooth vector (Lottie) animations instead of a
static glyph, fetched lazily from Google's public Noto animated-emoji CDN
(no local assets, no bundle weight) and cached in-memory + via the browser's
HTTP cache:

```tsx
// Autoplay once when it mounts
<DhritiEmoji name="party-popper" size={32} animated />

// Only fetch + play on hover (and replay on every hover) — used by default
// in DhritiEmojiPicker's grid so browsing many emojis stays cheap.
<DhritiEmoji name="party-popper" size={32} animated playOnHover />
```

`DhritiEmojiPicker` animates its grid on hover by default (`animated` prop,
default `true`); pass `animated={false}` to keep the grid fully static. If an
animation fails to load (offline, blocked request, etc.) it silently falls
back to the static unicode glyph — the UI never breaks.

## Programmatic Lookup

```ts
import { getEmojiByName, searchEmojis } from "@dhriti/emoji-picker";

const emoji = getEmojiByName("thumbs-up");
// { id, name, emoji, category, aliases, keywords, unicode }

const matches = searchEmojis("celebr"); // partial match against name/alias/keywords
```

### `EmojiDefinition` shape

```ts
interface EmojiDefinition {
  id: string; // e.g. "symbols:fire"
  name: string; // canonical kebab-case name, e.g. "fire"
  emoji: string; // actual unicode character(s), e.g. "🔥"
  category: StaticEmojiCategory;
  aliases: string[];
  keywords: string[];
  unicode: string; // e.g. "U+1F525"
}
```

## `DhritiEmojiPicker` props

| Prop                  | Type                              | Default              | Description                                  |
| --------------------- | --------------------------------- | --------------------- | --------------------------------------------- |
| `onSelect`             | `(emoji: EmojiDefinition) => void` | -                     | Called when an emoji is picked.                |
| `searchable`           | `boolean`                          | `true`                | Show the search input.                         |
| `showFrequentlyUsed`   | `boolean`                          | `true`                | Show the "Frequently Used" tab/strip.          |
| `showRecent`           | `boolean`                          | `true`                | Show the "Recent" tab.                         |
| `initialCategory`      | `EmojiCategory`                    | `"frequently-used"`* | Category selected on mount.                    |
| `recentLimit`          | `number`                          | `24`                  | Max tracked/shown recent emojis.               |
| `frequentlyUsedLimit`  | `number`                          | `24`                  | Max shown frequently-used emojis.              |
| `disabled`             | `boolean`                          | `false`               | Disables all interaction.                      |
| `width` / `height`     | `number`                          | `340` / `380`         | Size of the picker surface in pixels.          |
| `sx` / `className`    | MUI `sx` / string                 | -                     | Style overrides.                               |
| `animated`             | `boolean`                         | `true`                | Play a Lottie animation on hover per grid cell.|

\* Falls back to `"smileys-emotion"` if `showFrequentlyUsed` is `false`.

## Data source & attribution

The bundled dataset (`emojis/*.json`) is a curated, hand-picked subset (~245 emojis
across 8 categories) using standard Unicode names, code points, and common
keywords/aliases. It is generated into `src/generated/*.generated.ts` via:

```sh
pnpm --filter @dhriti/emoji-picker generate
```

Run this after editing any file in `emojis/`. The generation script only runs at
development time — the shipped runtime code never touches the filesystem.

> Note: this repository also contains a much larger (600+ file, ~327MB)
> Lottie animation dataset at `apps/web/src/animated_emojis_lottie`. That
> dataset contains per-emoji animation frames (no names/aliases/keywords/
> categories), so it wasn't suitable to embed directly in this package.
> Instead, animated rendering fetches the equivalent Lottie animation
> on-demand (by unicode code point) from Google's public, CORS-enabled Noto
> animated-emoji CDN — no local storage, no bundle weight, and results are
> cached both in-memory and by the browser's HTTP cache.

## Testing

```sh
pnpm --filter @dhriti/emoji-picker test
```

Covers the registry (name + alias resolution, unknown handling), search
(exact/partial/case-insensitive/keyword/alias matching), recent + frequently
used hooks (ordering, de-duplication, limits, persistence), and the
`DhritiEmoji` / `DhritiEmojiPicker` components (rendering, selection
callback, category switching, fallback behavior).
