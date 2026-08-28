const PLUS_CODE_ADDRESS = /^(?:[A-Z0-9]{4,}\+[A-Z0-9]{2,})(?:\s*,\s*(?:Bakı|Baku))?$/i;
const CITY_ONLY_ADDRESS = /^(?:Bakı|Baku)$/i;

export function isVagueClubAddress(address: string | null | undefined) {
  const normalized = address?.trim() ?? '';
  return !normalized || PLUS_CODE_ADDRESS.test(normalized) || CITY_ONLY_ADDRESS.test(normalized);
}
