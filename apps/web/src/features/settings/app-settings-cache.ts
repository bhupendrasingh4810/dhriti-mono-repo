export type SettingsCacheSnapshot = {
  value: unknown;
  error: string | null;
  loading: boolean;
};

type CacheEntry = {
  value?: unknown;
  promise?: Promise<unknown>;
  expiresAt: number;
  error?: string;
};

type Subscriber = {
  load: () => Promise<unknown>;
  notify: (snapshot: SettingsCacheSnapshot) => void;
  timer?: ReturnType<typeof setTimeout>;
};

export type SettingsCacheScheduler = {
  now: () => number;
  setTimeout: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clearTimeout: (timer: ReturnType<typeof setTimeout>) => void;
};

const browserScheduler: SettingsCacheScheduler = {
  now: Date.now,
  setTimeout: (callback, delay) => setTimeout(callback, delay),
  clearTimeout: (timer) => clearTimeout(timer),
};

function snapshotFor(entry: CacheEntry | undefined): SettingsCacheSnapshot {
  return {
    value: entry?.value,
    error: entry?.error ?? null,
    loading: Boolean(entry?.promise),
  };
}

/** Per-key client cache with deduplicated reads, mounted TTL refresh, and write invalidation. */
export class AppSettingsCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly revisions = new Map<string, number>();
  private readonly subscribers = new Map<string, Set<Subscriber>>();

  constructor(
    private readonly ttlMs = 60_000,
    private readonly scheduler: SettingsCacheScheduler = browserScheduler,
  ) {}

  getSnapshot(key: string): SettingsCacheSnapshot {
    return snapshotFor(this.entries.get(key));
  }

  subscribe(key: string, load: () => Promise<unknown>, notify: (snapshot: SettingsCacheSnapshot) => void) {
    const subscriber: Subscriber = { load, notify };
    const subscribers = this.subscribers.get(key) ?? new Set<Subscriber>();
    subscribers.add(subscriber);
    this.subscribers.set(key, subscribers);

    const entry = this.entries.get(key);
    if (entry?.expiresAt && entry.expiresAt <= this.scheduler.now() && !entry.promise) {
      void this.refresh(key).catch(() => undefined);
    } else if (!entry || (!entry.promise && entry.value === undefined && !entry.error)) {
      void this.refresh(key).catch(() => undefined);
    } else {
      this.scheduleRefresh(key, subscriber);
    }

    return () => {
      if (subscriber.timer) this.scheduler.clearTimeout(subscriber.timer);
      subscribers.delete(subscriber);
      if (subscribers.size === 0) this.subscribers.delete(key);
    };
  }

  prime(key: string, value: unknown) {
    this.revisions.set(key, (this.revisions.get(key) ?? 0) + 1);
    const entry: CacheEntry = { value, expiresAt: this.scheduler.now() + this.ttlMs };
    this.entries.set(key, entry);
    this.notify(key, snapshotFor(entry));
  }

  refresh(key: string): Promise<unknown> {
    const subscriber = this.subscribers.get(key)?.values().next().value as Subscriber | undefined;
    if (!subscriber) return Promise.resolve(this.entries.get(key)?.value);
    return this.read(key, subscriber.load, true);
  }

  private read(key: string, load: () => Promise<unknown>, force = false): Promise<unknown> {
    const entry = this.entries.get(key);
    if (entry?.promise) return entry.promise;
    if (!force && entry && entry.expiresAt > this.scheduler.now()) {
      return Promise.resolve(entry.value);
    }

    const revision = (this.revisions.get(key) ?? 0) + 1;
    this.revisions.set(key, revision);
    const promise = Promise.resolve()
      .then(load)
      .then(
        (value) => {
          if (this.revisions.get(key) === revision) {
            const freshEntry: CacheEntry = { value, expiresAt: this.scheduler.now() + this.ttlMs };
            this.entries.set(key, freshEntry);
            this.notify(key, snapshotFor(freshEntry));
          }
          return this.entries.get(key)?.value ?? value;
        },
        (error: unknown) => {
          if (this.revisions.get(key) === revision) {
            const failedEntry: CacheEntry = {
              value: entry?.value,
              error: error instanceof Error ? error.message : "Unable to load settings.",
              expiresAt: this.scheduler.now() + this.ttlMs,
            };
            this.entries.set(key, failedEntry);
            this.notify(key, snapshotFor(failedEntry));
          }
          throw error;
        },
      )
      .finally(() => {
        for (const subscriber of this.subscribers.get(key) ?? []) this.scheduleRefresh(key, subscriber);
      });

    this.entries.set(key, { value: entry?.value, promise, expiresAt: this.scheduler.now() + this.ttlMs });
    this.notify(key, snapshotFor(this.entries.get(key)));
    return promise;
  }

  private notify(key: string, snapshot: SettingsCacheSnapshot) {
    const subscribers = this.subscribers.get(key);
    for (const subscriber of subscribers ?? []) {
      queueMicrotask(() => {
        if (this.subscribers.get(key)?.has(subscriber)) subscriber.notify(snapshot);
      });
    }
  }

  private scheduleRefresh(key: string, subscriber: Subscriber) {
    if (subscriber.timer) this.scheduler.clearTimeout(subscriber.timer);
    const entry = this.entries.get(key);
    if (!entry || entry.promise) return;
    subscriber.timer = this.scheduler.setTimeout(
      () => void this.read(key, subscriber.load, true).catch(() => undefined),
      Math.max(1, entry.expiresAt - this.scheduler.now()),
    );
  }
}

export const appSettingsCache = new AppSettingsCache();

export const appSettingsKey = (organizationId: string, app: string) => `${organizationId}:app:${app}`;
export const connectUserSettingsKey = (organizationId: string, userId: string) =>
  `${organizationId}:user:${userId}:connect:me`;
