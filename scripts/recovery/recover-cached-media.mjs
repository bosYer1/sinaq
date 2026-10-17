import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const manifest = JSON.parse(await readFile('scripts/recovery/public-media-manifest-20261012.json', 'utf8'));
const expectedOrigin = 'https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/';
const targetDirectory = 'public/recovered-club-media';
const outputMapPath = 'src/data/recovered-club-media.json';
const maxAssetBytes = 2_000_000;
const maxTotalBytes = 36_000_000;
let totalBytes = 0;
let successfulProfiles = 0;
let successfulGallery = 0;
let unavailable = 0;
const recovered = {};

if (!Array.isArray(manifest.media) || manifest.media.length !== 61) {
  throw new Error('Only the 61 approved public clubs may be recovered.');
}
await mkdir(targetDirectory, { recursive: true });
await mkdir(path.dirname(outputMapPath), { recursive: true });

function imageExtension(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

async function restoreOne(item) {
  if (typeof item.url !== 'string' || !item.url.startsWith(expectedOrigin)) {
    throw new Error('Blocked unapproved media source.');
  }
  const widths = item.role === 'profile' ? [96, 256, 128] : [640, 384, 256, 750];
  for (const width of widths) {
    const url = new URL('https://gameyer.az/_next/image');
    url.searchParams.set('url', item.url);
    url.searchParams.set('w', String(width));
    url.searchParams.set('q', '75');
    let response;
    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        redirect: 'error',
      });
    } catch {
      continue;
    }
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) continue;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 1200 || bytes.length > maxAssetBytes) continue;
    const ext = imageExtension(bytes);
    if (!ext) continue;
    if (totalBytes + bytes.length > maxTotalBytes) throw new Error('Media recovery budget exceeded.');
    const assetName = createHash('sha256').update(item.url).digest('hex').slice(0, 25) + '.' + ext;
    const pathOnDisk = path.join(targetDirectory, assetName);
    await writeFile(pathOnDisk, bytes, { flag: 'w' });
    recovered[item.url] = '/' + pathOnDisk.replaceAll('\\', '/').replace(/^public\//, '');
    totalBytes += bytes.length;
    if (item.role === 'profile') successfulProfiles += 1;
    else successfulGallery += 1;
    console.log('MEDIA_SALVAGE OK', item.slug, item.role, width, bytes.length);
    return;
  }
  unavailable += 1;
  console.log('MEDIA_SALVAGE NOT_CACHED', item.slug, item.role);
}

const allItems = manifest.media.flatMap((club) => [
  ...(club.profile ? [{ slug: club.slug, role: 'profile', url: club.profile }] : []),
  ...club.images.map((url) => ({ slug: club.slug, role: 'gallery', url })),
]);
if (new Set(allItems.map((x) => x.url)).size !== allItems.length) {
  throw new Error('Duplicate source URL in public media manifest.');
}
for (let offset = 0; offset < allItems.length; offset += 5) {
  await Promise.all(allItems.slice(offset, offset + 5).map(restoreOne));
}
await writeFile(outputMapPath, JSON.stringify(recovered, null, 2) + '\n');
console.log(JSON.stringify({
  media_recovery: 'finished',
  original_references: allItems.length,
  recovered_profiles: successfulProfiles,
  recovered_gallery: successfulGallery,
  missing_sources: unavailable,
  recovered_bytes: totalBytes,
  mapping_entries: Object.keys(recovered).length,
}));
