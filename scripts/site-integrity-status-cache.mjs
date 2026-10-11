/**
 * Reuse only HTTP statuses that have already been observed through a real GET
 * in this exact smoke execution. Never store response bodies, secrets or tokens.
 * The next CI run starts with a fresh in-memory cache.
 */
export function createObservedGetStatus() {
  const statusByUrl = new Map();
  let reused = 0;
  let fetched = 0;

  return {
    observe(url, status) {
      statusByUrl.set(url, status);
    },
    async check(url, fetcher = fetch) {
      if (statusByUrl.has(url)) {
        reused += 1;
        return statusByUrl.get(url);
      }
      const response = await fetcher(url, { redirect: 'manual' });
      fetched += 1;
      statusByUrl.set(url, response.status);
      return response.status;
    },
    stats() {
      return { reused, fetched };
    },
  };
}
