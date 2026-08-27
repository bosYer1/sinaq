import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type ClubRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  instagram_url: string | null;
  profile_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
};

type ClubIdRow = { club_id: string };
type PageViewRow = {
  path: string;
  session_id: string;
  visit_id: string | null;
};

type Traffic = { views: number; visits: Set<string>; visitors: Set<string> };

export default async function SeoPriorityPage() {
  const supabase = await createClient();
  const sinceDate = new Date();
  sinceDate.setUTCDate(sinceDate.getUTCDate() - 7);
  const since = sinceDate.toISOString();

  const [clubsResult, pageViewsResult, hoursResult, pricingResult, imagesResult, typesResult] = await Promise.all([
    supabase
      .from('clubs')
      .select('id,name,slug,description,phone,instagram_url,profile_image_url,latitude,longitude,is_active')
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null),
    supabase
      .from('page_views')
      .select('path,session_id,visit_id')
      .eq('referrer_host', 'www.google.com')
      .gte('created_at', since)
      .like('path', '/klub/%')
      .limit(5000),
    supabase.from('club_opening_hours').select('club_id'),
    supabase.from('club_pricing').select('club_id'),
    supabase.from('club_images').select('club_id'),
    supabase.from('club_type_assignments').select('club_id'),
  ]);

  if (clubsResult.error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Klub məlumatları oxunmadı: {clubsResult.error.message}</div>;
  }

  const clubs = (clubsResult.data ?? []) as ClubRow[];
  const trafficRows = pageViewsResult.error ? [] : (pageViewsResult.data ?? []) as PageViewRow[];
  const idsWithHours = new Set(((hoursResult.data ?? []) as ClubIdRow[]).map((row) => row.club_id));
  const idsWithPricing = new Set(((pricingResult.data ?? []) as ClubIdRow[]).map((row) => row.club_id));
  const idsWithImages = new Set(((imagesResult.data ?? []) as ClubIdRow[]).map((row) => row.club_id));
  const idsWithTypes = new Set(((typesResult.data ?? []) as ClubIdRow[]).map((row) => row.club_id));

  const trafficBySlug = new Map<string, Traffic>();
  for (const row of trafficRows) {
    const match = row.path.match(/^\/klub\/([^/?#]+)/);
    if (!match) continue;
    const slug = match[1];
    const current = trafficBySlug.get(slug) ?? { views: 0, visits: new Set<string>(), visitors: new Set<string>() };
    current.views += 1;
    if (row.visit_id) current.visits.add(row.visit_id);
    current.visitors.add(row.session_id);
    trafficBySlug.set(slug, current);
  }

  function missingForClub(club: ClubRow) {
    const hasImage = Boolean(club.profile_image_url?.trim()) || idsWithImages.has(club.id);
    return [
      !club.phone ? 'Telefon' : null,
      !club.description?.trim() ? 'Təsvir' : null,
      !club.instagram_url ? 'Instagram' : null,
      !idsWithHours.has(club.id) ? 'İş saatı' : null,
      !idsWithPricing.has(club.id) ? 'Qiymət' : null,
      !hasImage ? 'Şəkil' : null,
      !idsWithTypes.has(club.id) ? 'Tip' : null,
    ].filter((value): value is string => Boolean(value));
  }

  const rows = clubs
    .map((club) => {
      const traffic = trafficBySlug.get(club.slug);
      const missing = missingForClub(club);
      return {
        club,
        missing,
        views: traffic?.views ?? 0,
        visits: traffic?.visits.size ?? 0,
        visitors: traffic?.visitors.size ?? 0,
      };
    })
    .filter((row) => row.views > 0)
    .sort((a, b) => b.visits - a.visits || b.visitors - a.visitors || b.missing.length - a.missing.length || b.views - a.views || a.club.name.localeCompare(b.club.name, 'az'));

  const totalViews = rows.reduce((sum, row) => sum + row.views, 0);
  const uniqueVisitIds = new Set(trafficRows.flatMap((row) => row.visit_id ? [row.visit_id] : []));
  const uniqueVisitorIds = new Set(trafficRows.map((row) => row.session_id));
  const trackedVisitViews = trafficRows.filter((row) => row.visit_id).length;
  const incomplete = rows.filter((row) => row.missing.length > 0).length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Google SEO prioriteti</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-500">Son 7 gündə Google-dan real trafik alan public klub profillərini göstərir. Məqsəd artıq trafik gələn, amma məlumatı natamam profilləri birinci tamamlamaqdır.</p>
        </div>
        <Link href="/admin/klublar?status=active&visibility=public&sort=seo-low" className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-50">Bütün SEO zəif klublar</Link>
      </div>

      {pageViewsResult.error ? <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Google trafik datası hazırda oxunmadı. Klub keyfiyyət məlumatı dəyişdirilməyib.</div> : null}

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-500">Google klub pageview · 7 gün</p><p className="mt-2 text-4xl font-bold">{totalViews}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-500">Real Google ziyarəti · 7 gün</p><p className="mt-2 text-4xl font-bold">{uniqueVisitIds.size}</p><p className="mt-1 text-xs text-gray-500">visit_id ilə ölçülür</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-500">Unikal Google visitor · 7 gün</p><p className="mt-2 text-4xl font-bold">{uniqueVisitorIds.size}</p><p className="mt-1 text-xs text-gray-500">qalıcı anonim browser ID</p></div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5"><p className="text-sm text-amber-700">Trafik alır, məlumat natamamdır</p><p className="mt-2 text-4xl font-bold text-amber-950">{incomplete}</p></div>
      </div>

      {trackedVisitViews < trafficRows.length ? (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
          Real ziyarət ölçümü yeni sistem aktiv olduqdan sonrakı pageview-lərdə mövcuddur: {trackedVisitViews}/{trafficRows.length} Google klub baxışı visit_id daşıyır. Köhnə sətirlər visitor və pageview statistikalarında saxlanılır, ziyarət sayına süni şəkildə çevrilmir.
        </div>
      ) : null}

      <section className="mt-7 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4"><h2 className="font-bold">Prioritet profil siyahısı</h2><p className="mt-1 text-xs text-gray-500">Əvvəl real Google ziyarəti, sonra unikal visitor və çatışmayan məlumat sayı nəzərə alınır.</p></div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Klub</th><th className="px-5 py-3">Google</th><th className="px-5 py-3">Çatışmayan</th><th className="px-5 py-3 text-right">İdarə et</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? <tr><td colSpan={4} className="px-5 py-8 text-gray-500">Son 7 gündə Google-dan klub profilinə trafik qeydə alınmayıb.</td></tr> : rows.map((row) => (
                <tr key={row.club.id} className="align-top">
                  <td className="px-5 py-4"><Link href={`/klub/${row.club.slug}`} className="font-semibold text-gray-900 hover:text-[#6A47F0]">{row.club.name}</Link><p className="mt-1 font-mono text-[11px] text-gray-400">/klub/{row.club.slug}</p></td>
                  <td className="whitespace-nowrap px-5 py-4"><p className="font-bold">{row.visits} ziyarət</p><p className="mt-1 text-xs text-gray-500">{row.visitors} visitor · {row.views} baxış</p></td>
                  <td className="px-5 py-4">{row.missing.length === 0 ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Tamdır</span> : <div className="flex max-w-xl flex-wrap gap-1.5">{row.missing.map((item) => <span key={item} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{item}</span>)}</div>}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-right"><Link href={`/admin/klublar/${row.club.id}`} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold hover:border-[#7C5CFC]">Redaktə et</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-4 text-xs leading-5 text-gray-500">Ziyarət real visit_id ilə, visitor isə qalıcı anonim browser ID-si ilə ölçülür. Köhnə visit_id-siz pageview-lər ziyarət kimi təxmin edilmir. Səhifə məlumat yaratmır və klub datasını dəyişmir; məlumat yenə rəsmi/təsdiqlənmiş mənbədən əlavə edilməlidir.</p>
    </div>
  );
}
