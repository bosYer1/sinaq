export type PublicDataStatus = 'ok' | 'empty' | 'error' | 'unavailable';

export function classifyPublicClubRead(
  data: Array<{ id: string }> | null,
  error: unknown,
): PublicDataStatus {
  if (error) return 'error';
  return data && data.length > 0 ? 'ok' : 'empty';
}
