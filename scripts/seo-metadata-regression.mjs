import fs from 'node:fs';

const clubPage = fs.readFileSync('src/app/klub/[slug]/page.tsx', 'utf8');
const clubLayout = fs.readFileSync('src/app/klub/[slug]/layout.tsx', 'utf8');
const districtPage = fs.readFileSync('src/app/rayon/[slug]/page.tsx', 'utf8');
const rootLayout = fs.readFileSync('src/app/layout.tsx', 'utf8');
const nextConfig = fs.readFileSync('next.config.js', 'utf8');
const indexNowWorkflow = fs.readFileSync('.github/workflows/indexnow-submit.yml', 'utf8');

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
  [rootLayout.includes("'@type': 'ImageObject'") && rootLayout.includes("contentUrl: brandLogo") && rootLayout.includes("width: 1254") && rootLayout.includes("height: 1254"), 'brand structured data exposes a crawlable sized ImageObject'],
  [rootLayout.includes("logo: { '@id': brandImageId }") && rootLayout.includes("image: { '@id': brandImageId }"), 'organization identity points to the canonical brand image'],
  [rootLayout.includes("shortcut: [{ url: '/favicon.ico'"), 'homepage metadata exposes a stable conventional favicon URL'],
  [nextConfig.includes("source: '/favicon.ico'") && nextConfig.includes("destination: '/gameyer-favicon.jpeg'"), 'legacy favicon path resolves to the original GameYer favicon asset'],
  [indexNowWorkflow.includes('Wait for Vercel deployment') && indexNowWorkflow.includes('node scripts/indexnow-submit.mjs'), 'IndexNow notification waits for production and submits changed URLs'],
  [indexNowWorkflow.includes('df8fa4723f76653caecfd894a38ef608.txt') && indexNowWorkflow.includes('sitemap.xml'), 'IndexNow workflow verifies ownership key and sitemap before submission'],
];

const failed = checks.filter(([ok]) => !ok).map(([, message]) => message);
if (failed.length) {
  console.error('SEO metadata regression failed:');
  for (const message of failed) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`SEO metadata regression PASS (${checks.length}/${checks.length})`);
