import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

describe("Shared validation package runtime", () => {
  it("loads the public entry point in plain Node without a TypeScript test loader", () => {
    const output = execFileSync(
      process.execPath,
      [
        "-e",
        `
          const assert = require("node:assert/strict");
          const validation = require("@dhriti/validation");
          assert.equal(validation.APP_SETTINGS_LIMITS.connect.maxMessageLength.max, 10000);
          assert.equal(validation.APP_SETTINGS_PATTERNS.connect.imageMimeType.test("image/png"), true);
          assert.equal(validation.stripeSubscriptionStatusSchema.parse("active"), "active");
          assert.equal(typeof validation.z.object, "function");
          process.stdout.write("ok");
        `,
      ],
      { cwd: resolve(__dirname, "../../.."), encoding: "utf8", timeout: 10_000 },
    );
    expect(output).toBe("ok");
  });
});
