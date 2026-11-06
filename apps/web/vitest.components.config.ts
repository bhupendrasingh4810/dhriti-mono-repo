import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/features/**/components/__test__/**/*.test.tsx"],
    setupFiles: ["./src/test/component-test-setup.ts"],
    clearMocks: true,
  },
});
