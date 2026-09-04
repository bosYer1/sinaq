import Image from 'next/image';
import { applyOwnerClaimFields, verifyOwnerClaim } from '@/app/admin/muracietler/actions';
import {
  normalizeOwnerInstagram,
  parseOwnerClaimMessage,
  parseOwnerDailyHours,
  parseOwnerPrice,
} from '@/lib/ownerClaim';

export interface OwnerClaimCurrentValues {
  instagram: string | null;
  pcPrice: number | null;
  psPrice: number | null;
  hours: string | null;
}

interface OwnerClaimApplyFormProps {
  id: string;
  clubId: string | null;
  message: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  current?: OwnerClaimCurrentValues | null;
  submittedImages?: string[];
}

function comparison(current: string | number | null | undefined, proposed: string | number) {
  return (
    <span className="mt-1 block text-xs font-normal text-gray-500">
      <span className="block">Hazırda: {current == null || current === '' ? 'məlum deyil' : current}</span>
      <span className="block font-semibold text-[#6A47F0]">Təklif: {proposed}</span>
    </span>
  );
}

export function OwnerClaimApplyForm({ id, clubId, message, status, current, submittedImages = [] }: OwnerClaimApplyFormProps) {
  if (status === 'resolved' || status === 'rejected') return null;

  if (!clubId) {
    return (
      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-xs font-semibold text-emerald-900">Bu müraciət avtomatik kluba bağlanmayıb.</p>
        <p className="mt-1 text-xs leading-5 text-emerald-800">Yalnız legacy və ya klub səhifəsindən gəlməyən müraciətlər üçün yuxarıdan doğru klubu manual seç. Yeni owner claim-lər klub səhifəsindən göndəriləndə klub avtomatik bağlanacaq.</p>
        <button type="button" disabled className="mt-2 h-9 cursor-not-allowed rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-white opacity-70">Təsdiq et və aktivləşdir</button>
      </div>
    );
  }

  const claim = parseOwnerClaimMessage(message);
  if (!claim) return null;

  const instagram = normalizeOwnerInstagram(claim.officialInstagram);
  const pcPrice = parseOwnerPrice(claim.pcPrice);
  const psPrice = parseOwnerPrice(claim.psPrice);
  const hours = parseOwnerDailyHours(claim.hours);
  const hasApplicableField = Boolean(instagram || pcPrice != null || psPrice != null || hours);

  return (
    <div className="mt-4 space-y-3">
      {submittedImages.length > 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-700">Klub sahibinin göndərdiyi şəkillər</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">Profil şəkli yaradılmır. Təsdiqdən sonra bu şəkillər klub qalereyasına əlavə olunur.</p>
            </div>
            <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-gray-600">{submittedImages.length}/5</span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {submittedImages.map((url, index) => (
              <div key={url} className="relative aspect-video overflow-hidden rounded-lg border border-gray-200 bg-white">
                <Image src={url} alt={`Owner claim şəkli ${index + 1}`} fill sizes="(max-width: 640px) 50vw, 20vw" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {hasApplicableField ? (
        <form action={applyOwnerClaimFields} className="rounded-lg border border-[#7C5CFC]/20 bg-[#7C5CFC]/5 p-3">
          <input type="hidden" name="id" value={id} />
          <p className="text-xs font-bold uppercase tracking-wide text-[#6A47F0]">Yoxlanmış məlumatları tətbiq et</p>
          <p className="mt-1 text-xs leading-5 text-gray-600">Hazırkı məlumatı təkliflə müqayisə et. Yalnız rəsmi kanaldan ayrıca təsdiqlədiyin sahələri seç; seçilməyən sahəyə toxunulmur.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {instagram ? <label className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800"><input type="checkbox" name="apply_instagram" className="mt-0.5" /><span className="min-w-0"><strong>Instagram</strong>{comparison(current?.instagram, instagram)}</span></label> : null}
            {pcPrice != null ? <label className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800"><input type="checkbox" name="apply_pc_price" className="mt-0.5" /><span><strong>PC qiyməti</strong>{comparison(current?.pcPrice == null ? null : `${current.pcPrice} AZN/saat`, `${pcPrice} AZN/saat`)}</span></label> : null}
            {psPrice != null ? <label className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800"><input type="checkbox" name="apply_ps_price" className="mt-0.5" /><span><strong>PlayStation qiyməti</strong>{comparison(current?.psPrice == null ? null : `${current.psPrice} AZN/saat`, `${psPrice} AZN/saat`)}</span></label> : null}
            {hours ? <label className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800"><input type="checkbox" name="apply_hours" className="mt-0.5" /><span><strong>İş saatları</strong>{comparison(current?.hours, claim.hours ?? '—')}</span></label> : claim.hours ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 sm:col-span-2">İş saatı “{claim.hours}” avtomatik tətbiq üçün standart formatda deyil. Admin klub səhifəsində manual yoxlanmalıdır.</div> : null}
          </div>
          <button type="submit" className="mt-3 h-9 rounded-lg bg-[#7C5CFC] px-4 text-sm font-semibold text-white transition hover:bg-[#6A47F0]">Seçilən məlumatları tətbiq et</button>
        </form>
      ) : null}

      <form action={verifyOwnerClaim} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <input type="hidden" name="id" value={id} />
        <p className="text-xs leading-5 text-emerald-800">Sahiblik rəsmi kanal vasitəsilə ayrıca yoxlanıldıqdan sonra təsdiqlə. Klub aktiv və verified olacaq; göndərilmiş şəkillər qalereyaya əlavə olunacaq, profil şəkli dəyişməyəcək.</p>
        <button type="submit" className="mt-2 h-9 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700">Təsdiq et və aktivləşdir</button>
      </form>
    </div>
  );
}
