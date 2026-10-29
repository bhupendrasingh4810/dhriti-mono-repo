import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AppSettingsCache,
  appSettingsKey,
  connectUserSettingsKey,
  type SettingsCacheScheduler,
} from "./app-settings-cache";
import { appSettingsPatch, requiresRetentionConfirmation } from "./app-settings-policies";

class ManualScheduler implements SettingsCacheScheduler {
  private time = 0;
  private nextId = 0;
  private readonly callbacks = new Map<number, { callback: () => void; expiresAt: number }>();

  now = () => this.time;

  setTimeout = (callback: () => void, delay: number) => {
    const id = ++this.nextId;
    this.callbacks.set(id, { callback, expiresAt: this.time + delay });
    return id as unknown as ReturnType<typeof setTimeout>;
  };

  clearTimeout = (timer: ReturnType<typeof setTimeout>) => {
    this.callbacks.delete(timer as unknown as number);
  };

  advanceBy(milliseconds: number) {
    this.time += milliseconds;
    const due = [...this.callbacks.entries()].filter(([, timer]) => timer.expiresAt <= this.time);
    for (const [id, timer] of due) {
      this.callbacks.delete(id);
      timer.callback();
    }
  }
}

const settle = async () => {
  for (let index = 0; index < 8; index++) await Promise.resolve();
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test("settings keys scope organization and personal values by tenant and user", () => {
  assert.notEqual(appSettingsKey("org-a", "connect"), appSettingsKey("org-b", "connect"));
  assert.notEqual(connectUserSettingsKey("org-a", "user-a"), connectUserSettingsKey("org-a", "user-b"));
  assert.notEqual(connectUserSettingsKey("org-a", "user-a"), connectUserSettingsKey("org-b", "user-a"));
});

test("tenant changes detach old subscribers and never expose late responses", async () => {
  const cache = new AppSettingsCache(100, new ManualScheduler());
  const oldRequest = deferred<unknown>();
  const oldSnapshots: unknown[] = [];
  const unsubscribeOld = cache.subscribe(
    "org-a:app:connect",
    () => oldRequest.promise,
    (snapshot) => oldSnapshots.push(snapshot.value),
  );
  const newSnapshots: unknown[] = [];
  cache.subscribe(
    "org-b:app:connect",
    async () => ({ org: "b" }),
    (snapshot) => newSnapshots.push(snapshot.value),
  );
  await settle();
  unsubscribeOld();
  oldRequest.resolve({ org: "a" });
  await settle();

  assert.deepEqual(cache.getSnapshot("org-b:app:connect").value, { org: "b" });
  assert.equal(
    cache.getSnapshot("org-a:app:connect").value &&
      (cache.getSnapshot("org-a:app:connect").value as { org: string }).org,
    "a",
  );
  assert.deepEqual(oldSnapshots.filter(Boolean), []);
  assert.ok(newSnapshots.every((value) => !value || (value as { org: string }).org === "b"));
});

test("a save prime invalidates in-flight stale reads", async () => {
  const cache = new AppSettingsCache(100, new ManualScheduler());
  const request = deferred<unknown>();
  const observed: unknown[] = [];
  cache.subscribe(
    "org:app:connect",
    () => request.promise,
    (snapshot) => observed.push(snapshot.value),
  );
  await settle();
  cache.prime("org:app:connect", { setting: "saved" });
  request.resolve({ setting: "stale" });
  await settle();

  assert.deepEqual(cache.getSnapshot("org:app:connect").value, { setting: "saved" });
  assert.ok(observed.every((value) => !value || (value as { setting: string }).setting !== "stale"));
});

test("mounted subscribers refresh after the cache TTL expires", async () => {
  const scheduler = new ManualScheduler();
  const cache = new AppSettingsCache(50, scheduler);
  let reads = 0;
  cache.subscribe(
    "org:app:connect",
    async () => ({ read: ++reads }),
    () => undefined,
  );
  await settle();
  assert.equal(reads, 1);
  scheduler.advanceBy(50);
  await settle();
  assert.equal(reads, 2);
  assert.deepEqual(cache.getSnapshot("org:app:connect").value, { read: 2 });
});

test("load failures surface and an explicit retry can recover", async () => {
  const cache = new AppSettingsCache(50, new ManualScheduler());
  let reads = 0;
  const snapshots: Array<{ value: unknown; error: string | null }> = [];
  cache.subscribe(
    "org:app:connect",
    async () => {
      reads++;
      if (reads === 1) throw new Error("offline");
      return { loaded: true };
    },
    ({ value, error }) => snapshots.push({ value, error }),
  );
  await settle();
  assert.equal(cache.getSnapshot("org:app:connect").error, "offline");

  await cache.refresh("org:app:connect");
  assert.equal(cache.getSnapshot("org:app:connect").error, null);
  assert.deepEqual(cache.getSnapshot("org:app:connect").value, { loaded: true });
  assert.ok(snapshots.some((snapshot) => snapshot.error === "offline"));
});

test("retention changes require confirmation only when enabling or shortening a non-null period", () => {
  assert.equal(
    requiresRetentionConfirmation(
      { messageRetentionDays: null, recordingRetentionDays: null },
      { messageRetentionDays: 30, recordingRetentionDays: null },
    ),
    true,
  );
  assert.equal(
    requiresRetentionConfirmation(
      { messageRetentionDays: 90, recordingRetentionDays: 60 },
      { messageRetentionDays: 30, recordingRetentionDays: 60 },
    ),
    true,
  );
  assert.equal(
    requiresRetentionConfirmation(
      { messageRetentionDays: 30, recordingRetentionDays: null },
      { messageRetentionDays: 60, recordingRetentionDays: null },
    ),
    false,
  );
  assert.equal(
    requiresRetentionConfirmation(
      { messageRetentionDays: null, recordingRetentionDays: null },
      { messageRetentionDays: null, recordingRetentionDays: null },
    ),
    false,
  );
});

test("settings PATCH strips response-only server fields without dropping editable values", () => {
  const patch = appSettingsPatch("connect", {
    messageRetentionDays: 30,
    retentionEnabledAt: "2026-10-30T00:00:00.000Z",
  });
  assert.deepEqual(patch, { messageRetentionDays: 30 });
  assert.equal(Object.hasOwn(patch, "retentionEnabledAt"), false);
});
