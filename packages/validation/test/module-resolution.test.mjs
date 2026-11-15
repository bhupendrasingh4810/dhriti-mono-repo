import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);

for (const [mode, load] of [
  ["CommonJS", () => require("../src/index.ts")],
  ["ES modules", () => import("../src/index.ts")],
]) {
  test(`native Node loads validation exports via ${mode}`, async () => {
    const validation = await load();

    assert.equal(validation.hrmsEmployeeProfileSchema.safeParse({}).success, true);
    assert.equal(validation.updateHrmsEmployeeProfileSchema.safeParse({ profile: {}, version: 0 }).success, true);
    assert.equal(validation.hrmsProfileFieldDefinitionsSchema.safeParse([]).success, true);
    assert.equal(
      validation.updateHrmsProfileFieldCatalogSchema.safeParse({ definitions: [], version: 0 }).success,
      true,
    );
    assert.deepEqual(validation.validateHrmsOrganizationFields([], {}), {});
    assert.equal(validation.userSchema.safeParse({ email: "employee@example.com", name: "Employee" }).success, true);
  });
}
