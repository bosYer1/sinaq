export interface ParsedOwnerClaim {
  role: string | null;
  officialInstagram: string | null;
  pcPrice: string | null;
  psPrice: string | null;
  hours: string | null;
  note: string | null;
}

export interface ParsedDailyHours {
  openTime: string;
  closeTime: string;
}

const PREFIX = '[STRUKTURLAŞDIRILMIŞ KLUB SAHİBİ MƏLUMATI]';

export function parseOwnerClaimMessage(message: string): ParsedOwnerClaim | null {
  if (!message.startsWith(PREFIX)) return null;

  const result: ParsedOwnerClaim = {
    role: null,
    officialInstagram: null,
    pcPrice: null,
    psPrice: null,
    hours: null,
    note: null,
  };

  for (const line of message.split('\n').slice(1)) {
    const [label, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    if (!value) continue;

    switch (label.trim()) {
      case 'Klubla əlaqə':
        result.role = value;
        break;
      case 'Rəsmi Instagram':
        result.officialInstagram = value;
        break;
      case 'PC qiyməti':
        result.pcPrice = value;
        break;
      case 'PlayStation qiyməti':
        result.psPrice = value;
        break;
      case 'İş saatları':
        result.hours = value;
        break;
      case 'Əlavə qeyd':
        result.note = value;
        break;
      default:
        break;
    }
  }

  return result;
}

export function normalizeOwnerInstagram(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  const handleMatch = trimmed.match(/^@?([a-z0-9._]{1,30})$/i);
  if (handleMatch) return `https://www.instagram.com/${handleMatch[1]}/`;

  const urlMatch = trimmed.match(/^https:\/\/(?:www\.)?instagram\.com\/([a-z0-9._]{1,30})\/?(?:\?.*)?$/i);
  if (!urlMatch) return null;
  return `https://www.instagram.com/${urlMatch[1]}/`;
}

export function parseOwnerPrice(value: string | null) {
  if (!value) return null;
  const match = value.trim().match(/^([0-9]+(?:[.,][0-9]{1,2})?)\s*AZN\/saat$/i);
  if (!match) return null;
  const price = Number(match[1].replace(',', '.'));
  return Number.isFinite(price) && price > 0 && price <= 1000 ? price : null;
}

export function parseOwnerDailyHours(value: string | null): '24/7' | ParsedDailyHours | null {
  if (!value) return null;
  const normalized = value.trim().replace(/–|—/g, '-');
  if (/^(24\s*\/\s*7|24 saat)$/i.test(normalized)) return '24/7';

  const match = normalized.match(/^(?:hər gün\s*)?(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/i);
  if (!match) return null;

  const openHour = Number(match[1]);
  const openMinute = Number(match[2]);
  const closeHour = Number(match[3]);
  const closeMinute = Number(match[4]);
  if (openHour > 23 || closeHour > 23 || openMinute > 59 || closeMinute > 59) return null;

  return {
    openTime: `${String(openHour).padStart(2, '0')}:${String(openMinute).padStart(2, '0')}:00`,
    closeTime: `${String(closeHour).padStart(2, '0')}:${String(closeMinute).padStart(2, '0')}:00`,
  };
}
