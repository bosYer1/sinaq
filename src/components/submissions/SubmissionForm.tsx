import { submitClubSubmission } from '@/app/submissions/actions';
import { SubmissionSubmitButton } from '@/components/submissions/SubmissionSubmitButton';

type SubmissionKind = 'correction' | 'new_club' | 'owner_claim';

interface SubmissionFormProps {
  kind: SubmissionKind;
  clubName?: string | null;
  clubSlug?: string | null;
  returnTo: '/elaqe' | '/klub-sahibi';
  submitLabel: string;
}

const inputClass = 'mt-1 h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10';
const textareaClass = 'mt-1 w-full rounded-control border border-border bg-surface px-3 py-2.5 text-sm leading-6 text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10';

export function SubmissionForm({ kind, clubName, clubSlug, returnTo, submitLabel }: SubmissionFormProps) {
  const ownerClaim = kind === 'owner_claim';

  return (
    <form action={submitClubSubmission} className="mt-5 space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="club_slug" value={clubSlug ?? ''} />
      <input type="hidden" name="return_to" value={returnTo} />

      <div className="hidden" aria-hidden="true">
        <label htmlFor={`${kind}-website`}>Website</label>
        <input id={`${kind}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor={`${kind}-club-name`} className="text-sm font-medium text-ink">Klubun adı</label>
        <input
          id={`${kind}-club-name`}
          name="club_name"
          defaultValue={clubName ?? ''}
          required
          minLength={2}
          maxLength={120}
          className={inputClass}
          placeholder="Klubun tam adı"
        />
      </div>

      {ownerClaim ? (
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="font-display text-sm font-bold text-ink">Klub məlumatlarını göndər</h3>
          <p className="mt-1 text-xs leading-5 text-muted">Bildiyiniz sahələri doldurun. Bunlar admin yoxlamasından keçmədən public sayta əlavə olunmur.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="owner-role" className="text-sm font-medium text-ink">Klubla əlaqəniz</label>
              <select id="owner-role" name="owner_role" required defaultValue="owner" className={inputClass}>
                <option value="owner">Sahib</option>
                <option value="manager">Menecer</option>
                <option value="employee">Əməkdaş</option>
                <option value="representative">Rəsmi nümayəndə</option>
              </select>
            </div>
            <div>
              <label htmlFor="official-instagram" className="text-sm font-medium text-ink">Klubun rəsmi Instagram-ı</label>
              <input id="official-instagram" name="official_instagram" maxLength={200} className={inputClass} placeholder="@club və ya https://instagram.com/..." />
            </div>
            <div>
              <label htmlFor="pc-price" className="text-sm font-medium text-ink">PC qiyməti — AZN/saat</label>
              <input id="pc-price" name="pc_price" type="number" min="0" step="0.01" max="1000" className={inputClass} placeholder="məs. 3" />
            </div>
            <div>
              <label htmlFor="ps-price" className="text-sm font-medium text-ink">PlayStation qiyməti — AZN/saat</label>
              <input id="ps-price" name="ps_price" type="number" min="0" step="0.01" max="1000" className={inputClass} placeholder="məs. 5" />
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="hours-note" className="text-sm font-medium text-ink">İş saatları</label>
            <input id="hours-note" name="hours_note" maxLength={300} className={inputClass} placeholder="məs. Hər gün 10:00–02:00 və ya 24/7" />
          </div>
        </div>
      ) : null}

      <div>
        <label htmlFor={`${kind}-message`} className="text-sm font-medium text-ink">{ownerClaim ? 'Əlavə qeyd' : 'Məlumat'}</label>
        <textarea
          id={`${kind}-message`}
          name="message"
          required={!ownerClaim}
          minLength={ownerClaim ? undefined : 10}
          maxLength={3000}
          rows={5}
          className={textareaClass}
          placeholder={ownerClaim ? 'Məsələn: qiymət VIP zonaya görə dəyişir, yeni ünvan budur və s.' : kind === 'new_club' ? 'Ünvan, PC/PlayStation tipi, iş saatı və bildiyiniz digər məlumatları yazın.' : 'Səhv olan məlumatı və düzgün variantını yazın.'}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <div>
          <label htmlFor={`${kind}-contact-type`} className="text-sm font-medium text-ink">Əlaqə üsulu</label>
          <select
            id={`${kind}-contact-type`}
            name="contact_type"
            defaultValue="instagram"
            className={inputClass}
          >
            <option value="instagram">Instagram</option>
            <option value="phone">Telefon</option>
            <option value="email">E-poçt</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${kind}-contact-value`} className="text-sm font-medium text-ink">Əlaqə məlumatı</label>
          <input
            id={`${kind}-contact-value`}
            name="contact_value"
            required
            maxLength={200}
            className={inputClass}
            placeholder="@username, +994... və ya email"
          />
        </div>
      </div>

      <p className="text-xs leading-5 text-muted">
        Müraciət yalnız məlumatın yoxlanması və sizinlə əlaqə üçün istifadə olunur. Şifrə, SMS kodu və ya hesab giriş məlumatı göndərməyin.
      </p>

      <SubmissionSubmitButton label={submitLabel} />
    </form>
  );
}
