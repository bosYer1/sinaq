import { ClubImageUploader } from '@/components/admin/ClubImageUploader';
import { ClubPricingEditor } from '@/components/admin/ClubPricingEditor';
import type {
  ClubOpeningHours,
  ClubType,
  District,
} from '@/types/database';

type PricingItem = {
  id: string;
  club_type_id: string;
  price_from: number;
  price_to: number | null;
  unit: string;
  tariff_name?: string | null;
  schedule_label?: string | null;
  position?: number;
};

type TypeAssignment = {
  club_type_id: string;
};

type ClubForAdmin = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  district_id?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  instagram_url?: string | null;
  rating_avg?: number | null;
  rating_count?: number;
  is_premium?: boolean;
  premium_expires_at?: string | null;
  is_active?: boolean;
  pricing?: PricingItem[];
  type_assignments?: TypeAssignment[];
  opening_hours?: ClubOpeningHours[];
  images?: {
    url: string;
    position: number;
    is_cover: boolean;
  }[];
};

interface ClubAdminFormProps {
  club?: ClubForAdmin;
  districts: District[];
  types: ClubType[];
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}

const DAYS = [
  'Bazar ertəsi',
  'Çərşənbə axşamı',
  'Çərşənbə',
  'Cümə axşamı',
  'Cümə',
  'Şənbə',
  'Bazar',
];

const BAKU_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Baku',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function dateTimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return BAKU_DATE_TIME_FORMATTER.format(date).replace(' ', 'T');
}

export function ClubAdminForm({ club, districts, types, action, submitLabel }: ClubAdminFormProps) {
  const enabledTypeIds = new Set([
    ...(club?.type_assignments ?? []).map((item) => item.club_type_id),
    ...(club?.pricing ?? []).map((item) => item.club_type_id),
  ]);

  const hoursByDay = new Map(
    (club?.opening_hours ?? []).map((item) => [item.day_of_week, item])
  );
  const hasHours = (club?.opening_hours ?? []).length > 0;

  const inputClass =
    'mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/10';
  const textareaClass =
    'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/10';

  return (
    <form action={action} className="space-y-5">
      {club?.id ? <input type="hidden" name="id" value={club.id} /> : null}

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold">Əsas məlumatlar</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Klub adı<input required name="name" defaultValue={club?.name ?? ''} className={inputClass} /></label>
          <label className="text-sm font-medium">
            Slug
            <input
              name="slug"
              defaultValue={club?.slug ?? ''}
              placeholder="Boş saxlasan avtomatik yaranacaq"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="Yalnız kiçik latın hərfləri, rəqəmlər və sözlər arasında tire istifadə et."
              autoCapitalize="none"
              spellCheck={false}
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium">Rayon<select required name="district_id" defaultValue={club?.district_id ?? ''} className={inputClass}><option value="" disabled>Rayon seç</option>{districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}</select></label>
          <label className="text-sm font-medium">Ünvan<input required name="address" defaultValue={club?.address ?? ''} className={inputClass} /></label>
          <label className="text-sm font-medium md:col-span-2">Təsvir<textarea name="description" defaultValue={club?.description ?? ''} rows={4} className={textareaClass} /></label>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold">Əlaqə və xəritə</h2>
        <p className="mt-1 text-xs text-gray-500">GameYer xəritəsində görünməsi üçün latitude və longitude məcburidir.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Telefon<input name="phone" defaultValue={club?.phone ?? ''} placeholder="+994..." className={inputClass} /></label>
          <label className="text-sm font-medium">
            Instagram
            <input
              name="instagram_url"
              type="url"
              defaultValue={club?.instagram_url ?? ''}
              placeholder="https://instagram.com/..."
              pattern="https://(www\.)?instagram\.com/.+"
              title="Tam Instagram linki yaz: https://instagram.com/..."
              autoCapitalize="none"
              spellCheck={false}
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium">Latitude<input required name="latitude" type="number" step="any" min="-90" max="90" defaultValue={club?.latitude ?? ''} className={inputClass} /></label>
          <label className="text-sm font-medium">Longitude<input required name="longitude" type="number" step="any" min="-180" max="180" defaultValue={club?.longitude ?? ''} className={inputClass} /></label>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold">PC / PlayStation və qiymətlər</h2>
        <p className="mt-1 text-xs text-gray-500">Hər platforma üçün bir neçə tarif, zona, vaxt aralığı və paket saxlamaq olar. Qiymət məlum deyilsə tipi aktiv saxlayıb tarif əlavə etməyə bilərsən.</p>
        <ClubPricingEditor
          types={types}
          enabledTypeIds={Array.from(enabledTypeIds)}
          pricing={club?.pricing ?? []}
        />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">İş saatları</h2>
            <p className="mt-1 text-xs text-gray-500">Saatlar təsdiqlənməyibsə bu seçimi söndür. Beləliklə saxta standart saatlar sayta düşməyəcək.</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="hours_enabled" defaultChecked={hasHours} />
            İş saatları təsdiqlənib
          </label>
        </div>
        <div className="mt-4 space-y-2">
          {DAYS.map((label, day) => {
            const hours = hoursByDay.get(day);
            return (
              <div key={label} className="grid items-center gap-3 rounded-lg border border-gray-200 p-3 sm:grid-cols-[170px_110px_1fr_1fr]">
                <div className="text-sm font-medium">{label}</div>
                <label className="flex items-center gap-2 text-xs text-gray-600"><input type="checkbox" name={`day_closed_${day}`} defaultChecked={hours?.is_closed ?? false} />Bağlıdır</label>
                <input type="time" name={`open_time_${day}`} defaultValue={hours?.open_time?.slice(0, 5) ?? ''} className={inputClass} />
                <input type="time" name={`close_time_${day}`} defaultValue={hours?.close_time?.slice(0, 5) ?? ''} className={inputClass} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <ClubImageUploader clubId={club?.id} images={club?.images ?? []} />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold">Status və reytinq</h2>
        {club?.id && club.is_active === false ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p className="font-semibold">Bu klub əvvəl deaktiv edilib və public saytda görünmür.</p>
            <label className="mt-2 flex items-start gap-2">
              <input type="checkbox" name="confirm_reactivate" className="mt-0.5" />
              <span>Klubun fəaliyyətini yenidən yoxladım və aktivləşdirməni təsdiqləyirəm.</span>
            </label>
          </div>
        ) : null}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="is_active" defaultChecked={club?.is_active ?? true} />Saytda aktivdir</label>
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="is_premium" defaultChecked={club?.is_premium ?? false} />Premium</label>
          <label className="text-sm font-medium">Premium bitmə tarixi — Bakı vaxtı<input name="premium_expires_at" type="datetime-local" defaultValue={dateTimeLocal(club?.premium_expires_at)} className={inputClass} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">Reytinq<input name="rating_avg" type="number" step="0.1" min="0" max="5" defaultValue={club?.rating_avg ?? ''} className={inputClass} /></label>
            <label className="text-sm font-medium">Səs sayı<input name="rating_count" type="number" min="0" defaultValue={club?.rating_count ?? 0} className={inputClass} /></label>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">Premium aktiv edilirsə bitmə tarixini də doldur. Bitmə vaxtı keçən premium public səhifədə avtomatik VIP kimi göstərilməyəcək.</p>
      </section>

      <div className="sticky bottom-4 flex justify-end rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <button type="submit" className="rounded-lg bg-[#7C5CFC] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6A47F0]">{submitLabel}</button>
      </div>
    </form>
  );
}
