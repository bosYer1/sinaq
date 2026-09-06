export type DatabaseHealth = 'ok' | 'error' | 'unavailable';

type ActiveClubProbeResult = {
  data: Array<{ id: unknown }> | null;
  error: unknown;
};

export async function getDatabaseHealth(
  probe: () => Promise<ActiveClubProbeResult>
): Promise<DatabaseHealth> {
  try {
    const { data, error } = await probe();

    if (error || !data || data.length === 0) {
      return 'error';
    }

    return 'ok';
  } catch {
    return 'unavailable';
  }
}
