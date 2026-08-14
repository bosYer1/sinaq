import type { ClubOpeningHours, ClubType, District } from '@/types/database';

type PricingItem = { id: string; club_type_id: string; price_from: number; price_to: number | null; unit: string; };
type ClubForAdmin = { id?: string; name?: string; slug?: string; description?: string | null; district_id?: string; address?: string; latitude?: number | null; longitude?: number | null; phone?: string | null; instagram_url?: string | null; rating_avg?: number | null; rating_count?: number; is_premium?: boolean; premium_expires_at?: string | null; is_active?: boolean; pricing?: PricingItem[]; opening_hours?: ClubOpeningHours[]; images?: { url: string; position: number; is_cover: boolean }[]; };
interface ClubAdminFormProps { club?: ClubForAdmin; districts: District[]; types: ClubType[]; action: (formData: FormData) => Promise<void>; submitLabel: string; }
const DAYS = ['Bazar ertəsi','Çərşənbə axşamı','Çərşənbə','Cümə axşamı','Cümə','Şənbə','Bazar'];
function dateTimeLocal(value?: string | null) { return value ? value.slice(0, 16) : ''; }

export function ClubAdminForm({ club, districts, types, action, submitLabel }: ClubAdminFormProps) {
  const pricingByType = new Map((club?.pricing ?? []).map((item) => [item.club_type_id, item]));
  const hoursByDay = new Map((club?.opening_hours ?? []).map((item) => [item.day_of_week, item]));
  const imageUrls = [...(club?.images ?? [])].sort((a,b) => a.is_cover !== b.is_cover ? (a.is_cover ? -1 : 1) : a.position - b.position).map((image) => image.url).join('
');
  const inputClass = 'mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/10';
  const textareaClass = 'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/10';
  return (
    <form action={action} className="space-y-5">
      {club?.id && <input type="hidden" name="id" value={club.id} />}
      <section className="rounded-xl border border-gray-200 bg-white p-5"><h2 className="font-semibold">Əsas məlumatlar</h2><div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">Klub adı<input required name="name" defaultValue={club?.name ?? ''} className={inputClass} /></label>
        <label className="text-sm font-medium">Slug<input name="slug" defaultValue={club?.slug ?? ''} placeholder="boş saxlasan avtomatik yaranacaq" className={inputClass} /></label>
        <label className="text-sm font-medium">Rayon<select required name="district_id" defaultValue={club?.district_id ?? ''} className={inputClass}><option value="" disabled>Rayon seç</option>{districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}</select></label>
        <label className="text-sm font-medium">Ünvan<input required name="address" defaultValue={club?.address ?? ''} className={inputClass} /></label>
        <label className="text-sm font-medium md:col-span-2">Təsvir<textarea name="description" defaultValue={club?.description ?? ''} rows={4} className={textareaClass} /></label>
      </div></section>
      <section className="rounded-xl border border-gray-200 bg-white p-5"><h2 className="font-semibold">Əlaqə və xəritə</h2><div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">Telefon<input name="phone" defaultValue={club?.phone ?? ''} placeholder="+994..." className={inputClass} /></label>
        <label className="text-sm font-medium">Instagram<input name="instagram_url" defaultValue={club?.instagram_url ?? ''} placeholder="https://instagram.com/..." className={inputClass} /></label>
        <label className="text-sm font-medium">Latitude<input name="latitude" type="number" step="any" defaultValue={club?.latitude ?? ''} className={inputClass} /></label>
        <label className="text-sm font-medium">Longitude<input name="longitude" type="number" step="any" defaultValue={club?.longitude ?? ''} className={inputClass} /></label>
      </div></section>
      <section className="rounded-xl border border-gray-200 bg-white p-5"><h2 className="font-semibold">PC / PlayStation və qiymətlər</h2><div className="mt-4 space-y-3">{types.map((type) => { const pricing = pricingByType.get(type.id); return <div key={type.id} className="grid gap-3 rounded-lg border border-gray-200 p-4 md:grid-cols-[150px_1fr_1fr_120px]">
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name={`type_enabled_${type.id}`} defaultChecked={Boolean(pricing)} />{type.name}</label>
        <label className="text-xs font-medium text-gray-600">Qiymət — dan<input name={`price_from_${type.id}`} type="number" step="0.01" min="0" defaultValue={pricing?.price_from ?? ''} className={inputClass} /></label>
        <label className="text-xs font-medium text-gray-600">Qiymət — dək<input name={`price_to_${type.id}`} type="number" step="0.01" min="0" defaultValue={pricing?.price_to ?? ''} className={inputClass} /></label>
        <label className="text-xs font-medium text-gray-600">Vahid<input name={`unit_${type.id}`} defaultValue={pricing?.unit ?? 'saat'} className={inputClass} /></label>
      </div>; })}</div></section>
      <section className="rounded-xl border border-gray-200 bg-white p-5"><h2 className="font-semibold">İş saatları</h2><div className="mt-4 space-y-2">{DAYS.map((label, day) => { const hours = hoursByDay.get(day); return <div key={label} className="grid items-center gap-3 rounded-lg border border-gray-200 p-3 sm:grid-cols-[170px_110px_1fr_1fr]">
        <div className="text-sm font-medium">{label}</div><label className="flex items-center gap-2 text-xs text-gray-600"><input type="checkbox" name={`day_closed_${day}`} defaultChecked={hours?.is_closed ?? false} />Bağlıdır</label>
        <input type="time" name={`open_time_${day}`} defaultValue={hours?.open_time?.slice(0,5) ?? '10:00'} className={inputClass} /><input type="time" name={`close_time_${day}`} defaultValue={hours?.close_time?.slice(0,5) ?? '23:59'} className={inputClass} />
      </div>; })}</div></section>
      <section className="rounded-xl border border-gray-200 bg-white p-5"><h2 className="font-semibold">Şəkillər</h2><p className="mt-1 text-xs text-gray-500">Hər sətrə bir şəkil URL-i yaz. Birinci URL cover şəkli olacaq.</p><textarea name="image_urls" rows={6} defaultValue={imageUrls} placeholder={'https://...
https://...'} className={textareaClass} /></section>
      <section className="rounded-xl border border-gray-200 bg-white p-5"><h2 className="font-semibold">Status və reytinq</h2><div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="is_active" defaultChecked={club?.is_active ?? true} />Saytda aktivdir</label>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="is_premium" defaultChecked={club?.is_premium ?? false} />Premium</label>
        <label className="text-sm font-medium">Premium bitmə tarixi<input name="premium_expires_at" type="datetime-local" defaultValue={dateTimeLocal(club?.premium_expires_at)} className={inputClass} /></label>
        <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Reytinq<input name="rating_avg" type="number" step="0.1" min="0" max="5" defaultValue={club?.rating_avg ?? ''} className={inputClass} /></label><label className="text-sm font-medium">Səs sayı<input name="rating_count" type="number" min="0" defaultValue={club?.rating_count ?? 0} className={inputClass} /></label></div>
      </div></section>
      <div className="sticky bottom-4 flex justify-end rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur"><button type="submit" className="rounded-lg bg-[#7C5CFC] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6A47F0]">{submitLabel}</button></div>
    </form>
  );
}
