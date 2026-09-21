import { requireAdmin } from '@/lib/admin/requireAdmin';
import {
  activateCommercialPremium,
  captureCommercialPerformance,
  createCommercialOpportunity,
  recordPaidCommercialSale,
  updateCommercialOpportunity,
} from './actions';

export const dynamic = 'force-dynamic';

const STAGE_LABELS: Record<string, string> = {
  targeted: 'Hədəf',
  contacted: 'Əlaqə quruldu',
  replied: 'Cavab verdi',
  offered: 'Təklif verildi',
  paid: 'Ödəniş gəldi',
  activated: 'Premium aktiv',
  reported: 'Hesabat verildi',
  renewed: 'Yenilədi',
  lost: 'İtirildi',
};

const MANUAL_STAGES = ['targeted','contacted','replied','offered','lost'];

function money(value: number) {
  return new Intl.NumberFormat('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function dateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('az-AZ', { timeZone: 'Asia/Baku', dateStyle: 'medium', timeStyle: 'short' });
}

export default async function CommercialAdminPage() {
  const { supabase } = await requireAdmin();

  const [
    clubsResult,
    customersResult,
    packagesResult,
    opportunitiesResult,
    contractsResult,
    paymentsResult,
    placementsResult,
    snapshotsResult,
  ] = await Promise.all([
    supabase.from('clubs').select('id,name,slug,is_active').eq('is_active', true).order('name'),
    supabase.from('business_customers').select('*').order('updated_at', { ascending: false }),
    supabase.from('commercial_packages').select('*').eq('is_active', true).order('name'),
    supabase.from('commercial_opportunities').select('*').order('updated_at', { ascending: false }),
    supabase.from('commercial_contracts').select('*').order('created_at', { ascending: false }),
    supabase.from('commercial_payments').select('*').order('created_at', { ascending: false }),
    supabase.from('commercial_placements').select('*').order('created_at', { ascending: false }),
    supabase.from('commercial_performance_snapshots').select('*').order('created_at', { ascending: false }),
  ]);

  const firstError = [
    clubsResult.error,
    customersResult.error,
    packagesResult.error,
    opportunitiesResult.error,
    contractsResult.error,
    paymentsResult.error,
    placementsResult.error,
    snapshotsResult.error,
  ].find(Boolean);

  if (firstError) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Kommersiya sxemi hələ tətbiq edilməyib və ya oxuna bilmir: {firstError.message}
      </div>
    );
  }

  const clubs = clubsResult.data ?? [];
  const customers = customersResult.data ?? [];
  const packages = packagesResult.data ?? [];
  const opportunities = opportunitiesResult.data ?? [];
  const contracts = contractsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const placements = placementsResult.data ?? [];
  const snapshots = snapshotsResult.data ?? [];

  const clubById = new Map(clubs.map((row) => [row.id, row]));
  const customerById = new Map(customers.map((row) => [row.id, row]));
  const packageById = new Map(packages.map((row) => [row.id, row]));
  const contractById = new Map(contracts.map((row) => [row.id, row]));
  const placementByContractId = new Map(placements.map((row) => [row.contract_id, row]));
  const snapshotsByPlacementId = new Map<string, typeof snapshots>();
  for (const snapshot of snapshots) {
    snapshotsByPlacementId.set(snapshot.placement_id, [...(snapshotsByPlacementId.get(snapshot.placement_id) ?? []), snapshot]);
  }

  const paidRevenue = payments
    .filter((row) => row.status === 'paid')
    .reduce((sum, row) => sum + Number(row.amount_azn), 0);
  const refundedRevenue = payments
    .filter((row) => row.status === 'refunded')
    .reduce((sum, row) => sum + Number(row.amount_azn), 0);
  const activeContracts = contracts.filter((row) => row.status === 'active');
  const activePremium = placements.filter((row) => row.status === 'active' && row.placement_type === 'premium_discovery');
  const openPipeline = opportunities.filter((row) => !['reported','renewed','lost'].includes(row.stage));
  const founderPackage = packages.find((row) => row.code === 'premium_founder_30d');

  return (
    <div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7C5CFC]">Revenue OS</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Kommersiya</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
          Lead → satış → ödəniş → Premium aktivləşdirmə → baseline/day-7/final hesabatı. Klub klikləri intent-dir, rezervasiya və ya satış kimi təqdim edilmir.
        </p>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Paid revenue</p><p className="mt-1 text-2xl font-bold">{money(paidRevenue - refundedRevenue)} AZN</p><p className="mt-1 text-xs text-gray-500">Ledger-də paid minus refunded.</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Aktiv müqavilə</p><p className="mt-1 text-2xl font-bold">{activeContracts.length}</p><p className="mt-1 text-xs text-gray-500">Maliyyə tarixçəsi klub flag-dan ayrıdır.</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Aktiv Premium</p><p className="mt-1 text-2xl font-bold">{activePremium.length}</p><p className="mt-1 text-xs text-gray-500">Ödəniş yoxlanmadan aktiv edilmir.</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Açıq pipeline</p><p className="mt-1 text-2xl font-bold">{openPipeline.length}</p><p className="mt-1 text-xs text-gray-500">Targeted-dan activated-a qədər.</p></div>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-bold">Yeni satış hədəfi</h2><p className="mt-1 text-xs text-gray-500">Klub yalnız real owner/official kontaktına başladıqda pipeline-a əlavə olunur; yeni qeyd “Əlaqə quruldu” mərhələsi və ilk kontakt vaxtı ilə açılır.</p></div>
          {founderPackage ? <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">Founding Partner: {money(Number(founderPackage.default_price_azn ?? 0))} AZN / 30 gün</span> : null}
        </div>
        <form action={createCommercialOpportunity} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select name="club_id" required defaultValue="" className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"><option value="" disabled>Klub seç</option>{clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select>
          <select name="package_id" defaultValue={founderPackage?.id ?? ''} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"><option value="">Custom paket</option>{packages.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select>
          <input name="offer_price_azn" type="number" min="0" step="0.01" defaultValue={founderPackage?.default_price_azn ?? 29} placeholder="Təklif qiyməti" className="h-10 rounded-lg border border-gray-300 px-3 text-sm" />
          <input name="contact_name" maxLength={160} placeholder="Əlaqədar şəxs" className="h-10 rounded-lg border border-gray-300 px-3 text-sm" />
          <input name="contact_phone" maxLength={64} placeholder="Telefon" className="h-10 rounded-lg border border-gray-300 px-3 text-sm" />
          <input name="contact_instagram" maxLength={200} placeholder="Instagram" className="h-10 rounded-lg border border-gray-300 px-3 text-sm" />
          <input name="notes" maxLength={4000} placeholder="Qeyd" className="h-10 rounded-lg border border-gray-300 px-3 text-sm xl:col-span-2" />
          <button type="submit" className="h-10 rounded-lg bg-[#7C5CFC] px-4 text-sm font-semibold text-white hover:bg-[#6A47F0]">Real kontaktı pipeline-a əlavə et</button>
        </form>
      </section>

      <section className="mt-6">
        <div className="flex items-end justify-between gap-3"><div><h2 className="text-lg font-bold">Satış pipeline</h2><p className="mt-1 text-xs text-gray-500">Mərhələni buradan idarə et. Ödəniş yalnız ayrıca “Satışı qeyd et” axını ilə ledger-ə düşür.</p></div><span className="text-xs text-gray-500">{opportunities.length} opportunity</span></div>
        <div className="mt-3 space-y-4">
          {opportunities.map((opportunity) => {
            const club = opportunity.club_id ? clubById.get(opportunity.club_id) : null;
            const customer = customerById.get(opportunity.customer_id);
            const packageRow = opportunity.package_id ? packageById.get(opportunity.package_id) : null;
            const contract = opportunity.contract_id ? contractById.get(opportunity.contract_id) : null;
            const placement = contract ? placementByContractId.get(contract.id) : null;
            const placementSnapshots = placement ? snapshotsByPlacementId.get(placement.id) ?? [] : [];
            const hasBaseline = placementSnapshots.some((item) => item.snapshot_type === 'baseline');
            const hasDay7 = placementSnapshots.some((item) => item.snapshot_type === 'day7');
            const hasFinal = placementSnapshots.some((item) => item.snapshot_type === 'final');

            return (
              <article key={opportunity.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">{STAGE_LABELS[opportunity.stage] ?? opportunity.stage}</span>{packageRow ? <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{packageRow.name}</span> : null}</div>
                    <h3 className="mt-3 text-lg font-bold">{club?.name ?? customer?.display_name ?? 'Müştəri'}</h3>
                    <p className="mt-1 text-xs text-gray-500">Təklif: {opportunity.offer_price_azn == null ? '—' : `${money(Number(opportunity.offer_price_azn))} AZN`} · Son dəyişiklik: {dateTime(opportunity.updated_at)}</p>
                    {customer ? <p className="mt-1 text-xs text-gray-500">{customer.contact_name || 'Əlaqədar şəxs yoxdur'} · {customer.contact_phone || customer.contact_instagram || 'Kontakt yoxdur'}</p> : null}
                  </div>
                  {contract ? <div className="text-right text-xs text-gray-500"><p className="font-semibold text-gray-900">Müqavilə: {money(Number(contract.agreed_price_azn) - Number(contract.discount_azn))} AZN</p><p>{dateTime(contract.starts_at)} → {dateTime(contract.ends_at)}</p></div> : null}
                </div>

                {MANUAL_STAGES.includes(opportunity.stage) ? (
                  <form action={updateCommercialOpportunity} className="mt-4 grid gap-2 border-t border-gray-100 pt-4 md:grid-cols-[180px_220px_1fr_auto]">
                    <input type="hidden" name="id" value={opportunity.id} />
                    <select name="stage" defaultValue={opportunity.stage} className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm">{MANUAL_STAGES.map((stage) => <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>)}</select>
                    <input name="next_follow_up_at" type="datetime-local" className="h-9 rounded-lg border border-gray-300 px-3 text-sm" />
                    <input name="notes" defaultValue={opportunity.notes ?? ''} maxLength={4000} placeholder="Qeyd / LOST səbəbi aşağıdadır" className="h-9 rounded-lg border border-gray-300 px-3 text-sm" />
                    <button className="h-9 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white">Yenilə</button>
                    <input name="lost_reason" defaultValue={opportunity.lost_reason ?? ''} maxLength={1000} placeholder="LOST seçilirsə səbəb" className="h-9 rounded-lg border border-gray-300 px-3 text-sm md:col-span-4" />
                  </form>
                ) : (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-600">
                    Sistem mərhələsi: {STAGE_LABELS[opportunity.stage] ?? opportunity.stage}. Bu mərhələ yalnız ödəniş/Premium/report əməliyyatları ilə dəyişir.
                  </div>
                )}

                {!contract && opportunity.stage !== 'lost' ? (
                  <details className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <summary className="cursor-pointer text-sm font-bold text-emerald-900">Satışı qeyd et — ödəniş təsdiqlənəndə</summary>
                    <form action={recordPaidCommercialSale} className="mt-3 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
                      <input type="hidden" name="opportunity_id" value={opportunity.id} />
                      <input name="agreed_price_azn" type="number" required min="0.01" step="0.01" defaultValue={opportunity.offer_price_azn ?? founderPackage?.default_price_azn ?? 29} placeholder="Razılaşdırılmış AZN" className="h-9 rounded-lg border border-emerald-300 bg-white px-3 text-sm" />
                      <input name="discount_azn" type="number" min="0" step="0.01" defaultValue="0" placeholder="Endirim" className="h-9 rounded-lg border border-emerald-300 bg-white px-3 text-sm" />
                      <input name="starts_on" type="date" required className="h-9 rounded-lg border border-emerald-300 bg-white px-3 text-sm" />
                      <input name="duration_days" type="number" min="1" max="365" defaultValue="30" className="h-9 rounded-lg border border-emerald-300 bg-white px-3 text-sm" />
                      <input name="payment_method" maxLength={80} placeholder="Ödəniş üsulu" className="h-9 rounded-lg border border-emerald-300 bg-white px-3 text-sm" />
                      <input name="external_reference" maxLength={200} placeholder="Qəbz/ref (opsional)" className="h-9 rounded-lg border border-emerald-300 bg-white px-3 text-sm" />
                      <input name="contract_notes" maxLength={4000} placeholder="Müqavilə qeydi" className="h-9 rounded-lg border border-emerald-300 bg-white px-3 text-sm md:col-span-2 xl:col-span-5" />
                      <button className="h-9 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">Paid sale yaz</button>
                    </form>
                  </details>
                ) : null}

                {contract && opportunity.stage === 'paid' ? (
                  <form action={activateCommercialPremium} className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-3">
                    <input type="hidden" name="contract_id" value={contract.id} />
                    <p className="text-xs leading-5 text-violet-800">Sistem ödəniş məbləğini yoxlayır, 30 günlük pre-Premium baseline saxlayır və yalnız sonra klubun Premium flag/expiry-sini aktiv edir.</p>
                    <button className="mt-2 h-9 rounded-lg bg-[#7C5CFC] px-4 text-sm font-semibold text-white hover:bg-[#6A47F0]">Premium-u aktivləşdir</button>
                  </form>
                ) : null}

                {placement ? (
                  <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-sky-900"><span>Placement: {placement.status}</span><span>•</span><span>Baseline: {hasBaseline ? '✓' : '—'}</span><span>Day-7: {hasDay7 ? '✓' : '—'}</span><span>Final: {hasFinal ? '✓' : '—'}</span></div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!hasDay7 ? <form action={captureCommercialPerformance}><input type="hidden" name="placement_id" value={placement.id} /><input type="hidden" name="snapshot_type" value="day7" /><button className="h-9 rounded-lg border border-sky-300 bg-white px-3 text-xs font-semibold text-sky-800">Day-7 snapshot</button></form> : null}
                      {!hasFinal ? <form action={captureCommercialPerformance}><input type="hidden" name="placement_id" value={placement.id} /><input type="hidden" name="snapshot_type" value="final" /><button className="h-9 rounded-lg border border-sky-300 bg-white px-3 text-xs font-semibold text-sky-800">Final snapshot + bağla</button></form> : null}
                    </div>
                    {placementSnapshots.length > 0 ? <div className="mt-3 grid gap-2 lg:grid-cols-3">{placementSnapshots.map((snap) => <div key={snap.id} className="rounded-lg bg-white p-3 text-xs text-gray-600"><p className="font-bold uppercase text-gray-900">{snap.snapshot_type}</p><p className="mt-1">{snap.profile_views} views · {snap.view_sessions} view sessions</p><p>{snap.intent_sessions} intent sessions · tel {snap.phone_clicks} · IG {snap.instagram_clicks} · maps {snap.maps_clicks}</p></div>)}</div> : null}
                  </div>
                ) : null}
              </article>
            );
          })}
          {opportunities.length === 0 ? <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Pipeline boşdur. İlk klub hədəfini yuxarıdakı formadan əlavə et.</div> : null}
        </div>
      </section>
    </div>
  );
}
