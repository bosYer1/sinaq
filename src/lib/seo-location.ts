const CITY_DISCOVERY_SLUGS = new Set(['sumqayit', 'xirdalan']);

export function discoveryLocationPhrase(name: string, slug: string) {
  return CITY_DISCOVERY_SLUGS.has(slug) ? `${name} şəhərində` : `${name} rayonunda`;
}

export function discoveryLocationLabel(name: string, slug: string) {
  return CITY_DISCOVERY_SLUGS.has(slug) ? `${name} şəhəri` : `${name} rayonu`;
}
