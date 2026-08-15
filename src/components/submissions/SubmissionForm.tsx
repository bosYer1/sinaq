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

export function SubmissionForm({ kind, clubName, clubSlug, returnTo, submitLabel }: SubmissionFormProps) {
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
          className="mt-1 h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          placeholder="Klubun tam adı"
        />
      </div>

      <div>
        <label htmlFor={`${kind}-message`} className="text-sm font-medium text-ink">Məlumat</label>
        <textarea
          id={`${kind}-message`}
          name="message"
          required
          minLength={10}
          maxLength={3000}
          rows={5}
          className="mt-1 w-full rounded-control border border-border bg-surface px-3 py-2.5 text-sm leading-6 text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          placeholder={kind === 'owner_claim' ? 'Klubla əlaqənizi və təsdiqləmək istədiyiniz məlumatları yazın.' : kind === 'new_club' ? 'Ünvan, PC/PlayStation tipi, iş saatı və bildiyiniz digər məlumatları yazın.' : 'Səhv olan məlumatı və düzgün variantını yazın.'}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <div>
          <label htmlFor={`${kind}-contact-type`} className="text-sm font-medium text-ink">Əlaqə üsulu</label>
          <select
            id={`${kind}-contact-type`}
            name="contact_type"
            defaultValue="instagram"
            className="mt-1 h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
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
            className="mt-1 h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
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
