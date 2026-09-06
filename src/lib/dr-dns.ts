const DNS_LABEL = /^(?!-)[a-z0-9_-]{1,63}(?<!-)$/;
const HOST_LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

export function normalizeDnsName(value: string) {
  return value.trim().toLowerCase().replace(/\.+$/, '');
}

export function isValidDnsZone(zone: string) {
  const normalizedZone = normalizeDnsName(zone);
  return normalizedZone.length <= 253
    && normalizedZone.includes('.')
    && normalizedZone.split('.').every((label) => HOST_LABEL.test(label));
}

export function isDnsNameWithinZone(name: string, zone: string) {
  const normalizedName = normalizeDnsName(name);
  const normalizedZone = normalizeDnsName(zone);
  if (!normalizedName || !isValidDnsZone(normalizedZone)) return false;
  if (!normalizedName.split('.').every((label) => DNS_LABEL.test(label))) return false;
  return normalizedName === normalizedZone || normalizedName.endsWith(`.${normalizedZone}`);
}

export function isCloudflareAuthoritative(nameservers: string[]) {
  return nameservers.length >= 2
    && nameservers.every((server) => normalizeDnsName(server).endsWith('.ns.cloudflare.com'));
}

export function isFastFailoverTtlReady(ttls: number[]) {
  return ttls.length > 0 && ttls.every((ttl) => Number.isInteger(ttl) && ttl > 0 && ttl <= 60);
}
