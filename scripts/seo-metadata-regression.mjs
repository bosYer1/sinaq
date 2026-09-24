import fs from 'node:fs';

const clubPage = fs.readFileSync('src/app/klub/[slug]/page.tsx', 'utf8');
const clubLayout = fs.readFileSync('src/app/klub/[slug]/layout.tsx', 'utf8');
const districtPage = fs.readFileSync('src/app/rayon/[slug]/page.tsx', 'utf8');
const rootLayout = fs.readFileSync('src/app/layout.tsx', 'utf8');
const manifest = fs.readFileSync('src/app/manifest.ts', 'utf8');
const nearbyPage = fs.readFileSync('src/app/yaxinliqda-gaming-klublari/page.tsx', 'utf8');
const twentyEightMayPage = fs.readFileSync('src/app/28-may-gaming-klublari/page.tsx', 'utf8');
const nextConfig = fs.readFileSync('next.config.js', 'utf8');
const indexNowWorkflow = fs.readFileSync('.github/workflows/indexnow-submit.yml', 'utf8');
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
  [rootLayout.includes("{ url: '/favicon.ico', type: 'image/jpeg', sizes: '1254x1254' }"), 'root metadata exposes the conventional favicon path'],
  [rootLayout.includes("shortcut: [{ url: '/favicon.ico'"), 'root metadata exposes a stable shortcut favicon'],
  [rootLayout.includes("alternateName: ['GameYer.az']"), 'brand structured data carries the stable GameYer.az alternate name'],
  [rootLayout.includes("'@type': 'ImageObject'") && rootLayout.includes("contentUrl: brandLogo") && rootLayout.includes("width: 1254") && rootLayout.includes("height: 1254"), 'brand structured data exposes a crawlable sized ImageObject'],
  [rootLayout.includes("logo: { '@id': brandImageId }") && rootLayout.includes("image: { '@id': brandImageId }"), 'organization identity points to the canonical brand image'],
  [rootLayout.includes("areaServed: { '@type': 'Country', name: 'Azerbaijan' }"), 'organization structured data keeps the verified Azerbaijan service area'],
  [Buffer.compare(rootFavicon, brandedFavicon) === 0, 'root favicon is byte-identical to the locked GameYer favicon asset'],
  [manifest.includes("src: '/favicon.jpeg'"), 'PWA manifest points at the crawler-friendly root favicon'],
  [nearbyPage.includes("const title = 'Yaxınlıqdakı PC və PlayStation klubları — Bakı xəritəsi';"), 'nearby landing keeps stable PC + PlayStation intent in the title'],
  [nextConfig.includes("source: '/favicon.ico'") && nextConfig.includes("destination: '/gameyer-favicon.jpeg'"), 'favicon.ico resolves to the locked GameYer favicon asset'],
  [indexNowWorkflow.includes('Wait for Vercel deployment') && indexNowWorkflow.includes('node scripts/indexnow-submit.mjs'), 'IndexNow notification waits for production and submits changed URLs'],
  [twentyEightMayPage.includes("getClubs({ q: '28 May' })") && twentyEightMayPage.includes("canonical: '/28-may-gaming-klublari'"), '28 May landing is data-driven and canonicalized'],
];

const failed = checks.filter(([ok]) => !ok).map(([, message]) => message);
if (failed.length) {
  console.error('SEO metadata regression failed:');
  for (const message of failed) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`SEO metadata regression PASS (${checks.length}/${checks.length})`);
