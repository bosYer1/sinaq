type Bucket = { startedAt: number; count: number };

type GuardOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
  maxBodyBytes?: number;
  requireJson?: boolean;
};

type LimitedJsonResult =
  | { ok: true; data: unknown }
  | { ok: false; status: 400 | 413 };

const globalForRateLimit = globalThis as typeof globalThis & {
  __gameyerPublicRateBuckets?: Map<string, Bucket>;
};

const buckets = globalForRateLimit.__gameyerPublicRateBuckets ?? new Map<string, Bucket>();
globalForRateLimit.__gameyerPublicRateBuckets = buckets;

function clientKey(request: Request) {
  // Vercel overwrites x-forwarded-for with the public client IP. Do not trust
  // caller-controlled fallback headers such as x-real-ip for abuse buckets.
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || 'unknown';
}

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

function consumeRateLimit(request: Request, prefix: string, limit: number, windowMs: number) {
  const now = Date.now();
  const key = `${prefix}:${clientKey(request)}`;
  const current = buckets.get(key);

  if (!current || now - current.startedAt >= windowMs) {
    buckets.set(key, { startedAt: now, count: 1 });
    return false;
  }

  current.count += 1;

  if (buckets.size > 1000) {
    for (const [bucketKey, bucket] of buckets) {
      if (now - bucket.startedAt >= Math.max(windowMs, 60_000)) buckets.delete(bucketKey);
    }
  }

  return current.count > limit;
}

export function guardPublicPost(request: Request, options: GuardOptions) {
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite === 'cross-site') return { ok: false as const, status: 403 };
  if (!sameOrigin(request)) return { ok: false as const, status: 403 };

  if (options.requireJson) {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().startsWith('application/json')) {
      return { ok: false as const, status: 415 };
    }
  }

  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader && options.maxBodyBytes) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isFinite(contentLength) || contentLength < 0) {
      return { ok: false as const, status: 400 };
    }
    if (contentLength > options.maxBodyBytes) return { ok: false as const, status: 413 };
  }

  if (consumeRateLimit(request, options.keyPrefix, options.limit, options.windowMs)) {
    return { ok: false as const, status: 429, retryAfter: Math.ceil(options.windowMs / 1000) };
  }

  return { ok: true as const };
}

export async function readJsonBodyLimited(
  request: Request,
  maxBodyBytes: number,
): Promise<LimitedJsonResult> {
  if (!request.body || !Number.isSafeInteger(maxBodyBytes) || maxBodyBytes <= 0) {
    return { ok: false, status: 400 };
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let totalBytes = 0;
  let raw = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maxBodyBytes) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }

      raw += decoder.decode(value, { stream: true });
    }

    raw += decoder.decode();
    return { ok: true, data: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, status: 400 };
  } finally {
    reader.releaseLock();
  }
}
