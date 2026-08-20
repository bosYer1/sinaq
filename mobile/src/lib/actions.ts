const PHONE_PATTERN = /^\+?\d{7,15}$/;

export function phoneUrl(phone: string | null) {
  if (!phone) return null;
  const firstNumber = phone.split(/\s*[\/,;]\s*/).find(Boolean) ?? '';
  const normalized = firstNumber.replace(/[^+\d]/g, '');
  return PHONE_PATTERN.test(normalized) ? `tel:${normalized}` : null;
}

export function instagramUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || url.port || (hostname !== 'instagram.com' && hostname !== 'www.instagram.com')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function directionsUrl(latitude: number | null, longitude: number | null) {
  if (latitude == null || longitude == null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}
