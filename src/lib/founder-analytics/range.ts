import type { DateRange } from './types';

const DAY_MS = 86_400_000;

function iso(value: Date) {
  return value.toISOString();
}

function startOfBakuDay(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Baku', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(`${values.year}-${values.month}-${values.day}T00:00:00+04:00`);
}

function validDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00+04:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function resolveDateRange(
  presetInput: string | undefined,
  customFrom?: string,
  customTo?: string,
  now = new Date(),
): DateRange {
  const preset = ['today', '24h', '7d', '30d', 'custom'].includes(presetInput ?? '')
    ? presetInput as DateRange['preset']
    : '7d';
  let from: Date;
  let to = now;
  let label: string;

  if (preset === 'today') {
    from = startOfBakuDay(now);
    label = 'Bu gün';
  } else if (preset === '24h') {
    from = new Date(now.getTime() - DAY_MS);
    label = 'Son 24 saat';
  } else if (preset === '30d') {
    from = new Date(now.getTime() - 30 * DAY_MS);
    label = 'Son 30 gün';
  } else if (preset === 'custom') {
    const parsedFrom = validDate(customFrom);
    const parsedTo = validDate(customTo);
    if (!parsedFrom || !parsedTo || parsedFrom > parsedTo || parsedTo > now) {
      return resolveDateRange('7d', undefined, undefined, now);
    }
    from = parsedFrom;
    to = new Date(parsedTo.getTime() + DAY_MS);
    if (to > now) to = now;
    label = `${customFrom} – ${customTo}`;
  } else {
    from = new Date(now.getTime() - 7 * DAY_MS);
    label = 'Son 7 gün';
  }

  const duration = Math.max(1, to.getTime() - from.getTime());
  return {
    preset,
    from: iso(from),
    to: iso(to),
    previousFrom: iso(new Date(from.getTime() - duration)),
    previousTo: iso(from),
    label,
  };
}
