import fs from 'node:fs';

const clubPage = fs.readFileSync('src/app/klub/[slug]/page.tsx', 'utf8');
const clubLayout = fs.readFileSync('src/app/klub/[slug]/layout.tsx', 'utf8');
const districtPage = fs.readFileSync('src/app/rayon/[slug]/page.tsx', 'utf8');
const districtTypePage = fs.readFileSync('src/app/rayon/[slug]/[type]/page.tsx', 'utf8');
const districtIndexPage = fs.readFileSync('src/app/rayon/page.tsx', 'utf8');
const seoLocation = fs.readFileSync('src/lib/seo-location.ts', 'utf8');
const rootLayout = fs.readFileSync('src/app/layout.tsx', 'utf8');
const manifest = fs.readFileSync('src/app/manifest.ts', 'utf8');
const nearbyPage = fs.readFileSync('src/app/yaxinliqda-gaming-klublari/page.tsx', 'utf8');
const pcLanding = fs.readFileSync('src/app/bakida-pc-klublari/page.tsx', 'utf8');
const playstationLanding = fs.readFileSync('src/app/bakida-playstation-klublari/page.tsx', 'utf8');
const internetLanding = fs.readFileSync('src/app/bakida-internet-klublari/page.tsx', 'utf8');
const twentyFourHourLanding = fs.readFileSync('src/app/bakida-24-saat-gaming-klublari/page.tsx', 'utf8');
const twentyEightMayPage = fs.readFileSync('src/app/28-may-gaming-klublari/page.tsx', 'utf8');
const sitemapPage = fs.readFileSync('src/app/sitemap.ts', 'utf8');
const nextConfig = fs.readFileSync('next.config.js', 'utf8');
const indexNowWorkflow = fs.readFileSync('.github/workflows/indexnow-submit.yml', 'utf8');
const rootFavicon = fs.readFileSync('public/favicon.jpeg');
const brandedFavicon = fs.readFileSync('public/gameyer-favicon.jpeg');

const checks = [
  [clubPage.includes("const title = `${club.name} — ${districtName ?? 'Bakı'}, ${titleDetail}`;"), 'club title keeps club name + district context in a compact form'],
  [clubPage.includes("minPrice != null ? `${minPrice} AZN-dən` : category"), 'club title keeps a factual price/category fallback'],
  [clubPage.includes("İş saatları, ünvan və xəritəyə GameYer-də bax."), 'club meta description uses a compact factual CTA'],
  [clubPage.includes("name: club.district?.name ? `${club.name} — ${club.district.name}` : club.name"), 'club breadcrumb disambiguates branch context with verified district data'],
  [clubPage.includes("if (districtSlug === 'sumqayit') return 'Sumqayıt';") && clubPage.includes("if (districtSlug === 'xirdalan') return 'Xırdalan';"), 'club schema must preserve non-Baku localities for Sumqayıt and Xırdalan.'],
  [clubPage.includes("addressLocality: schemaAddressLocality(club.district?.slug)"), 'club PostalAddress must not hardcode Bakı for every active club.'],
  [!clubPage.includes('qiymətlər ${minPrice} AZN-dən və ünvan'), 'legacy overlong club title pattern is removed'],
  [clubLayout.includes("import { notFound } from 'next/navigation';"), 'club layout can terminate missing/inactive slugs before rendering'],
  [clubLayout.includes('if (!club) notFound();'), 'missing/inactive club slugs are rejected in the parent layout before child streaming'],
  [!clubLayout.includes('if (!club) return children;'), 'layout no longer lets missing/inactive club pages stream a soft-404 fallback'],
  [districtPage.includes("const title = `${locationPhrase} gaming klubları — PC və PlayStation`;"), 'district title is compact, intent-first and locality-aware'],
  [seoLocation.includes("['sumqayit', 'xirdalan']") && seoLocation.includes("return CITY_DISCOVERY_SLUGS.has(slug) ? `${name} şəhərində` : `${name} rayonunda`;"), 'SEO location helper must distinguish nearby cities from Baku districts.'],
  [districtTypePage.includes('const locationPhrase = discoveryLocationPhrase(district.name, district.slug);') && districtTypePage.includes('`${locationPhrase} ${searchLabel} — qiymətlər və ünvanlar`'), 'district-type metadata must use truthful city/district wording.'],
  [districtIndexPage.includes("'Bakı və ətrafı üzrə gaming klubları — PC və PlayStation'") && districtIndexPage.includes('Bakı rayonlarında, Xırdalan və Sumqayıtda'), 'discovery index must describe Baku plus nearby cities truthfully.'],
  [districtPage.includes("Ünvan, iş saatları və xəritəyə GameYer-də bax."), 'district description stays compact and factual'],
  [rootLayout.includes("{ url: '/favicon.ico', type: 'image/jpeg', sizes: '1254x1254' }"), 'root metadata exposes the conventional favicon path'],
  [rootLayout.includes("shortcut: [{ url: '/favicon.ico'"), 'root metadata exposes a stable shortcut favicon'],
  [rootLayout.includes("alternateName: ['GameYer.az']"), 'brand structured data carries the stable GameYer.az alternate name'],
  [rootLayout.includes("'@type': 'ImageObject'") && rootLayout.includes("contentUrl: brandLogo") && rootLayout.includes("width: 1254") && rootLayout.includes("height: 1254"), 'brand structured data exposes a crawlable sized ImageObject'],
  [rootLayout.includes("logo: { '@id': brandImageId }") && rootLayout.includes("image: { '@id': brandImageId }"), 'organization identity points to the canonical brand image'],
  [rootLayout.includes("areaServed: { '@type': 'Country', name: 'Azerbaijan' }"), 'organization structured data keeps the verified Azerbaijan service area'],
  [Buffer.compare(rootFavicon, brandedFavicon) === 0, 'root favicon is byte-identical to the locked GameYer favicon asset'],
  [manifest.includes("src: '/favicon.jpeg'"), 'PWA manifest points at the crawler-friendly root favicon'],
  [nearbyPage.includes("const title = 'Mənə yaxın PC, PlayStation və internet klubları — Bakı xəritəsi';"), 'nearby landing title must cover the proven near-me PC/PlayStation/internet intent.'],
  [nearbyPage.includes('Mənə yaxın PC, PlayStation və internet klubları'), 'nearby landing H1 must reinforce near-me discovery intent.'],
  [nearbyPage.includes('internet kafe') && nearbyPage.includes('Xəritə ilə yaxınlığı yoxla'), 'nearby landing must connect internet-cafe intent with map-based proximity.'],
  [pcLanding.includes('href="#pc-clubs"') && pcLanding.includes('id="pc-clubs"') && pcLanding.includes('scroll-mt-24'), 'PC landing primary CTA must jump directly to the club list.'],
  [internetLanding.includes('href="/yaxinliqda-gaming-klublari"') && internetLanding.includes('Mənə yaxın internet klubları'), 'winning internet-club hub must reinforce the nearby discovery landing.'],
  [playstationLanding.includes("'Bakıda PlayStation klubları — PS Club, PS5/PS4 qiymətləri'"), 'PlayStation landing title must cover the proven PS Club query family.'],
  [playstationLanding.includes('Bakıda PlayStation və PS klubları — PS5, PS4'), 'PlayStation H1 must stay aligned with PlayStation/PS intent.'],
  [playstationLanding.includes('PS Club və PlayStation klubu eyni şeydir?'), 'PlayStation landing must explain the natural PS Club synonym without keyword stuffing.'],
  [playstationLanding.includes("title: `${title} | GameYer`"), 'PlayStation OpenGraph title must stay aligned with the search title.'],
  [twentyFourHourLanding.includes('href="#night-clubs"') && twentyFourHourLanding.includes('id="night-clubs"') && twentyFourHourLanding.includes('24 saat klublara bax ↓'), '24-hour landing primary CTA must jump directly to matching club results.'],
  [nextConfig.includes("source: '/favicon.ico'") && nextConfig.includes("destination: '/gameyer-favicon.jpeg'"), 'favicon.ico resolves to the locked GameYer favicon asset'],
  [indexNowWorkflow.includes('Wait for Vercel deployment') && indexNowWorkflow.includes('node scripts/indexnow-submit.mjs'), 'IndexNow workflow waits for production before notifying search engines'],
  [twentyEightMayPage.includes("getClubs({ q: '28 May' })") && twentyEightMayPage.includes("canonical: '/28-may-gaming-klublari'"), '28 May landing is data-driven and canonicalized'],
  [twentyEightMayPage.includes("'28 May PlayStation və PC klubları — ünvan və xəritə'") && twentyEightMayPage.includes('28 Mayda PlayStation və PC klubları'), '28 May landing must prioritize the observed PlayStation query intent.'],
  [clubPage.includes("const isTwentyEightMayClub = locationIdentity.includes('28 may');") && clubPage.includes('isTwentyEightMayClub ? <Link href="/28-may-gaming-klublari"'), '28 May club profiles must contextually reinforce the dedicated landing.'],
  [twentyEightMayPage.includes('clubs.length >= 2'), '28 May landing only becomes indexable with enough real public supply'],
  [sitemapPage.includes("twentyEightMayCount >= 2") && sitemapPage.includes("/28-may-gaming-klublari"), '28 May sitemap entry is supply-gated'],
];

const failed = checks.filter(([ok]) => !ok).map(([, message]) => message);
if (failed.length) {
  console.error('SEO metadata regression failed:');
  for (const message of failed) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`SEO metadata regression PASS (${checks.length}/${checks.length})`);
