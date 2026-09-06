import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  isCloudflareAuthoritative,
  isDnsNameWithinZone,
  isFastFailoverTtlReady,
  isValidDnsZone,
  normalizeDnsName,
} from '../src/lib/dr-dns.ts';

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'CAA', 'NS', 'SOA', 'DS'] as const;
const TYPE_BY_CODE = new Map<number, typeof RECORD_TYPES[number]>([
  [1, 'A'], [2, 'NS'], [5, 'CNAME'], [6, 'SOA'], [15, 'MX'],
  [16, 'TXT'], [28, 'AAAA'], [43, 'DS'], [257, 'CAA'],
]);
const WEB_TYPES = new Set(['A', 'AAAA', 'CNAME']);
const resolver = 'https://cloudflare-dns.com/dns-query';
const execFileAsync = promisify(execFile);
const zone = normalizeDnsName(process.env.DR_DNS_ZONE || 'gameyer.az');
const names = (process.env.DR_DNS_NAMES || `${zone},www.${zone},_dmarc.${zone}`)
  .split(',')
  .map(normalizeDnsName)
  .filter(Boolean);

assert.ok(isValidDnsZone(zone), 'DR_DNS_ZONE is not a valid DNS zone.');
assert.ok(names.length > 0, 'At least one DR_DNS_NAMES entry is required.');
assert.ok(
  names.every((name) => isDnsNameWithinZone(name, zone)),
  'Every DR_DNS_NAMES entry must be the zone apex or one of its subdomains.',
);

type DnsAnswer = {
  name: string;
  type: number;
  TTL: number;
  data: string;
};

type SnapshotRecord = {
  name: string;
  type: typeof RECORD_TYPES[number];
  ttl: number;
  value: string;
};

async function resolveWithDoh(name: string, type: typeof RECORD_TYPES[number]) {
  const url = new URL(resolver);
  url.searchParams.set('name', name);
  url.searchParams.set('type', type);
  const response = await fetch(url, {
    headers: { accept: 'application/dns-json' },
    signal: AbortSignal.timeout(10_000),
  });
  assert.equal(response.ok, true, `DNS resolver returned HTTP ${response.status}.`);
  const body = await response.json() as { Status?: number; Answer?: DnsAnswer[] };
  if (body.Status === 3) return [];
  assert.equal(body.Status, 0, `${type} lookup for ${name} returned DNS status ${body.Status}.`);
  return (body.Answer ?? []).flatMap((answer): SnapshotRecord[] => {
    const answerType = TYPE_BY_CODE.get(answer.type);
    return answerType ? [{
      name: normalizeDnsName(answer.name),
      type: answerType,
      ttl: answer.TTL,
      value: answer.data,
    }] : [];
  });
}

async function resolveWithWindows() {
  const queries = names.flatMap((name) => RECORD_TYPES.map((type) => ({ name, type })));
  const script = String.raw`
$typeCodes = @{ A = 1; NS = 2; CNAME = 5; SOA = 6; MX = 15; TXT = 16; AAAA = 28; DS = 43; CAA = 257 }
$queries = $env:DR_DNS_QUERY_JSON | ConvertFrom-Json
$results = @()
foreach ($query in $queries) {
  try {
    $records = Resolve-DnsName -Name $query.name -Type $query.type -DnsOnly -ErrorAction Stop
    foreach ($record in $records) {
      if ([int]$record.Type -ne [int]$typeCodes[$query.type]) { continue }
      $value = switch ($query.type) {
        'A' { $record.IPAddress }
        'AAAA' { $record.IPAddress }
        'CNAME' { $record.NameHost }
        'NS' { $record.NameHost }
        'MX' { "$($record.Preference) $($record.NameExchange)" }
        'TXT' { $record.Strings -join '' }
        'CAA' { "$($record.Flags) $($record.Tag) $($record.Value)" }
        'SOA' { "$($record.PrimaryServer) $($record.NameAdministrator) $($record.SerialNumber)" }
        'DS' { "$($record.KeyTag) $($record.Algorithm) $($record.DigestType) $($record.Digest)" }
      }
      $results += [pscustomobject]@{ name = $record.Name; type = $query.type; ttl = [int]$record.TTL; value = [string]$value }
    }
  } catch {}
}
$results | ConvertTo-Json -Compress
`;
  const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-Command', script], {
    env: { ...process.env, DR_DNS_QUERY_JSON: JSON.stringify(queries) },
    timeout: 30_000,
    windowsHide: true,
  });
  const parsed = JSON.parse(stdout || '[]') as SnapshotRecord | SnapshotRecord[];
  return Array.isArray(parsed) ? parsed : [parsed];
}

let source = resolver;
let recordGroups: SnapshotRecord[][];
try {
  recordGroups = await Promise.all(
    names.flatMap((name) => RECORD_TYPES.map((type) => resolveWithDoh(name, type))),
  );
} catch (error) {
  if (process.platform !== 'win32') throw error;
  source = 'Windows Resolve-DnsName (Cloudflare DoH unavailable)';
  recordGroups = [await resolveWithWindows()];
}
const recordsByIdentity = new Map<string, SnapshotRecord>();
for (const record of recordGroups.flat()) {
  const identity = `${record.name}:${record.type}:${record.value}`;
  const existing = recordsByIdentity.get(identity);
  if (!existing || record.ttl < existing.ttl) recordsByIdentity.set(identity, record);
}
const records = [...recordsByIdentity.values()]
  .sort((a, b) => `${a.name}:${a.type}:${a.value}`.localeCompare(`${b.name}:${b.type}:${b.value}`));

const nameservers = records
  .filter((record) => record.name === zone && record.type === 'NS')
  .map((record) => record.value);
const webTtls = records
  .filter((record) => (
    (record.name === zone || record.name === `www.${zone}`)
    && WEB_TYPES.has(record.type)
  ))
  .map((record) => record.ttl);

assert.ok(nameservers.length > 0, 'No authoritative nameservers were visible.');
assert.ok(webTtls.length > 0, 'No public apex/www web records were visible.');

console.log(JSON.stringify({
  collected_at: new Date().toISOString(),
  zone,
  source,
  warning: 'Public DNS is not a complete provider-zone export and wildcard answers may appear as exact records. Compare it with the authenticated DNS inventory before any change.',
  assessment: {
    cloudflare_authoritative: isCloudflareAuthoritative(nameservers),
    fast_failover_ttl_ready: isFastFailoverTtlReady(webTtls),
    nameserver_change_still_required: !isCloudflareAuthoritative(nameservers),
    observed_web_ttl_max_seconds: Math.max(...webTtls),
  },
  records,
}, null, 2));
