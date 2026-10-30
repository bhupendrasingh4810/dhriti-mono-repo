import assert from "node:assert/strict";
import { test } from "node:test";
import { withRefreshFeedback } from "./refresh-feedback";

test("fast refreshes remain pending for at least half a second", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let settled = false;
  const result = withRefreshFeedback(Promise.resolve("loaded")).then((value) => {
    settled = true;
    return value;
  });
  context.mock.timers.tick(499);
  await Promise.resolve();
  assert.equal(settled, false);
  context.mock.timers.tick(1);
  assert.equal(await result, "loaded");
});

test("refresh failures retain the minimum duration and propagate the original error", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const failure = new Error("Unable to refresh");
  let settled = false;
  const result = assert.rejects(withRefreshFeedback(Promise.reject(failure)), (error) => {
    settled = true;
    return error === failure;
  });
  context.mock.timers.tick(499);
  await Promise.resolve();
  assert.equal(settled, false);
  context.mock.timers.tick(1);
  await result;
  assert.equal(settled, true);
});

test("slow refreshes stay pending until the response arrives", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let settled = false;
  const request = new Promise<string>((resolve) => setTimeout(() => resolve("loaded"), 650));
  const result = withRefreshFeedback(request).then((value) => {
    settled = true;
    return value;
  });
  context.mock.timers.tick(500);
  await Promise.resolve();
  assert.equal(settled, false);
  context.mock.timers.tick(150);
  assert.equal(await result, "loaded");
});
