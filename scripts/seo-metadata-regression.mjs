import fs from 'node:fs';

const clubPage = fs.readFileSync('src/app/klub/[slug]/page.tsx', 'utf8');
const clubLayout = fs.readFileSync('src/app/klub/[slug]/layout.tsx', 'utf8');
const districtPage = fs.readFileSync('src/app/rayon/[slug]/page.tsx', 'utf8');
const rootLayout = fs.readFileSync('src/app/layout.tsx', 'utf8');
const manifest = fs.readFileSync('src/app/manifest.ts', 'utf8');
const nearbyPage = fs.readFileSync('src/app/yaxinliqda-gaming-klublari/page.tsx', 'utf8');
const rootFavicon = fs.readFileSync('public/favicon.jpeg');
const brandedFavicon = fs.readFileSync('public/gameyer-favicon.jpeg');

const checks = [
  [clubPage.includes("const title = `${club.name} — ${districtName ?? 'Bakı'}, ${titleDetail}`;"), 'club title keeps club name + district context in a compact form'],
  [clubPage.includes("minPrice != null ? `${minPrice} AZN-dən` : category"), 'club title keeps a factual price/category fallback'],
  [clubPage.includes("İş saatları, ünvan və xəritəyə GameYer-də bax."), 'club meta description uses a compact factual CTA'],
  [clubPage.includes("name: club.district?.name ? `${club.name} — ${club.district.name}` : club.name"), 'club breadcrumb disambiguates branch context with verified district data'],
  [!clubPage.includes('qiymətlər ${minPrice} AZN-dən və ünvan'), 'legacy overlong club title pattern is removed'],
  [clubLayout.includes("import { notFound } from 'next/navigation';"), 'club layout can terminate missing/inactive slugs before rendering'],
  [clubLayout.includes('if (!club) notFound();'), 'missing/inactive club slugs are rejected in the parent layout before child streaming'],
  [!clubLayout.includes('if (!club) return children;'), 'layout no longer lets missing/inactive club pages stream a soft-404 fallback'],
  [districtPage.includes("const title = `${data.district.name} gaming klubları — PC və PlayStation`;"), 'district title is compact and intent-first'],
  [districtPage.includes("Ünvan, iş saatları və xəritəyə GameYer-də bax."), 'district description stays compact and factual'],
  [rootLayout.includes("{ url: '/favicon.jpeg', type: 'image/jpeg', sizes: '1254x1254' }"), 'root metadata exposes the crawler-friendly favicon path'],
  [rootLayout.includes("shortcut: [{ url: '/favicon.jpeg'"), 'root metadata exposes an explicit shortcut favicon'],
  [rootLayout.includes("alternateName: ['GameYer.az']"), 'brand structured data carries the stable GameYer.az alternate name'],
  [rootLayout.includes("'@type': 'ImageObject'"), 'organization logo is emitted as an explicit ImageObject'],
  [rootLayout.includes("areaServed: { '@type': 'Country', name: 'Azerbaijan' }"), 'organization structured data keeps the verified Azerbaijan service area'],
  [Buffer.compare(rootFavicon, brandedFavicon) === 0, 'root favicon is byte-identical to the locked GameYer favicon asset'],
  [manifest.includes("src: '/favicon.jpeg'"), 'PWA manifest points at the crawler-friendly root favicon'],
  [nearbyPage.includes("const title = 'Yaxınlıqdakı PC və PlayStation klubları — Bakı xəritəsi';"), 'nearby landing keeps stable PC + PlayStation intent in the title'],
];

const failed = checks.filter(([ok]) => !ok).map(([, message]) => message);
if (failed.length) {
  console.error('SEO metadata regression failed:');
  for (const message of failed) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`SEO metadata regression PASS (${checks.length}/${checks.length})`);
