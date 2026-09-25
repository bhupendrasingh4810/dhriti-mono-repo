#!/usr/bin/env node
/**
 * Deterministically generates the normalized emoji registry, category index,
 * and search index from the hand-curated seed data in ../emojis/*.json.
 *
 * This script runs only at development/build time. The output is plain,
 * dependency-free TypeScript with no filesystem access, so it is safe to
 * import from browser and Next.js runtime code.
 *
 * Usage: node scripts/generate-emoji-data.mjs
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EMOJIS_DIR = path.join(__dirname, "..", "emojis");
const OUTPUT_DIR = path.join(__dirname, "..", "src", "generated");

/** Category ids must match the seed file names (without extension). */
const CATEGORY_LABELS = {
  "smileys-emotion": "Smileys & Emotion",
  "people-body": "People & Body",
  "animals-nature": "Animals & Nature",
  "food-drink": "Food & Drink",
  activities: "Activities",
  "travel-places": "Travel & Places",
  objects: "Objects",
  symbols: "Symbols",
};

function normalizeToken(value) {
  return value.trim().toLowerCase();
}

function buildDefinitions() {
  const categoryIds = Object.keys(CATEGORY_LABELS);
  const definitions = [];

  for (const categoryId of categoryIds) {
    const filePath = path.join(EMOJIS_DIR, `${categoryId}.json`);
    const raw = JSON.parse(readFileSync(filePath, "utf-8"));

    for (const entry of raw) {
      definitions.push({
        id: `${categoryId}:${entry.name}`,
        name: entry.name,
        emoji: entry.emoji,
        category: categoryId,
        aliases: entry.aliases ?? [],
        keywords: entry.keywords ?? [],
        unicode: entry.unicode,
      });
    }
  }

  definitions.sort((a, b) => a.id.localeCompare(b.id));
  return definitions;
}

function buildSearchIndex(definitions) {
  /** token -> sorted, de-duplicated list of emoji definition ids */
  const index = {};

  const addToken = (rawToken, definitionId) => {
    const token = normalizeToken(rawToken);
    if (!token) return;

    if (!index[token]) {
      index[token] = [];
    }
    if (!index[token].includes(definitionId)) {
      index[token].push(definitionId);
    }
  };

  for (const definition of definitions) {
    addToken(definition.name, definition.id);
    for (const alias of definition.aliases) addToken(alias, definition.id);
    for (const keyword of definition.keywords) addToken(keyword, definition.id);
  }

  for (const token of Object.keys(index)) {
    index[token].sort();
  }

  return index;
}

function writeGeneratedFile(fileName, exportName, value, typeAnnotation) {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const banner =
    "// AUTO-GENERATED FILE. Do not edit by hand.\n// Run `pnpm generate` in packages/emoji-picker to regenerate.\n\n";
  const content = `${banner}export const ${exportName}${typeAnnotation ? `: ${typeAnnotation}` : ""} = ${JSON.stringify(value, null, 2)} as const;\n`;

  writeFileSync(path.join(OUTPUT_DIR, fileName), content, "utf-8");
}

function run() {
  const definitions = buildDefinitions();
  const searchIndex = buildSearchIndex(definitions);
  const categories = Object.entries(CATEGORY_LABELS).map(([id, label]) => ({ id, label }));

  writeGeneratedFile(
    "emojiRegistry.generated.ts",
    "EMOJI_DEFINITIONS",
    definitions,
    "ReadonlyArray<{ id: string; name: string; emoji: string; category: string; aliases: string[]; keywords: string[]; unicode: string }>",
  );

  writeGeneratedFile(
    "emojiCategories.generated.ts",
    "EMOJI_CATEGORY_DEFINITIONS",
    categories,
    "ReadonlyArray<{ id: string; label: string }>",
  );

  writeGeneratedFile(
    "emojiSearchIndex.generated.ts",
    "EMOJI_SEARCH_INDEX",
    searchIndex,
    "Readonly<Record<string, readonly string[]>>",
  );

  console.log(`Generated ${definitions.length} emoji definitions across ${categories.length} categories.`);
  console.log(`Search index contains ${Object.keys(searchIndex).length} unique tokens.`);
}

run();
