export class RequestTimeoutError extends Error {
  constructor() {
    super('Sorğu vaxt limitini keçdi. İnternet bağlantısını yoxlayıb yenidən cəhd edin.');
    this.name = 'RequestTimeoutError';
  }
}

export async function withRequestTimeout<T>(
  task: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new RequestTimeoutError());
      controller.abort();
    }, timeoutMs);
  });

  try {
    return await Promise.race([task(controller.signal), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

type CacheEntry<T> = { value: T; expiresAt: number };

export function createRequestCoordinator<T>(ttlMs = 0, maxEntries = 20) {
  const inFlight = new Map<string, Promise<T>>();
  const cache = new Map<string, CacheEntry<T>>();

  return {
    run(key: string, task: () => Promise<T>, force = false): Promise<T> {
      const cached = cache.get(key);
      if (!force && cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);

      const existing = inFlight.get(key);
      if (existing) return existing;

      const request = task()
        .then((value) => {
          if (ttlMs > 0) {
            if (!cache.has(key) && cache.size >= maxEntries) {
              const oldestKey = cache.keys().next().value as string | undefined;
              if (oldestKey) cache.delete(oldestKey);
            }
            cache.set(key, { value, expiresAt: Date.now() + ttlMs });
          }
          return value;
        })
        .finally(() => inFlight.delete(key));
      inFlight.set(key, request);
      return request;
    },
    clear(key?: string) {
      if (key) cache.delete(key);
      else cache.clear();
    },
  };
}
