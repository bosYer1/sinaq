'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type ClubInsert = Database['public']['Tables']['clubs']['Insert'];

interface DistrictOption {
  id: string;
  name: string;
}

function slugify(input: string): string {
  const map: Record<string, string> = {
    ə: 'e', Ə: 'e', ı: 'i', I: 'i', İ: 'i', ö: 'o', Ö: 'o',
    ü: 'u', Ü: 'u', ş: 's', Ş: 's', ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g',
  };
  const replaced = input
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('');

  return replaced
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AdminNewClubPage() {
  const router = useRouter();
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [phone, setPhone] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase
      .from('districts')
      .select('id, name')
      .order('name', { ascending: true })
      .then(({ data }) => {
        if (data) setDistricts(data as DistrictOption[]);
      });
  }, []);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !slug.trim() || !districtId || !address.trim()) {
      setError('Ad, slug, rayon və ünvan mütləqdir.');
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    if (!supabase) {
      setError('Supabase client yaradıla bilmədi.');
      setSubmitting(false);
      return;
    }

    const payload: ClubInsert = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      district_id: districtId,
      address: address.trim(),
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      phone: phone.trim(),
      instagram_url: instagramUrl.trim(),
      is_premium: isPremium,
      is_active: isActive,
    };

    const { error: insertError } = await supabase.from('clubs').insert(payload);

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push('/admin/klublar');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl text-ink">Yeni klub əlavə et</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card"
      >
        <div>
          <label className="mb-1 block text-sm text-muted">Ad *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-card border border-border px-3 py-2 text-ink"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">Slug *</label>
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className="w-full rounded-card border border-border px-3 py-2 text-ink"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">Təsvir</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-card border border-border px-3 py-2 text-ink"
            rows={3}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">Rayon *</label>
          <select
            value={districtId}
            onChange={(e) => setDistrictId(e.target.value)}
            className="w-full rounded-card border border-border px-3 py-2 text-ink"
            required
          >
            <option value="">Seçin</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">Ünvan *</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-card border border-border px-3 py-2 text-ink"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-muted">Enlik (latitude)</label>
            <input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full rounded-card border border-border px-3 py-2 text-ink"
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Uzunluq (longitude)</label>
            <input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full rounded-card border border-border px-3 py-2 text-ink"
              inputMode="decimal"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">Telefon</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-card border border-border px-3 py-2 text-ink"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">Instagram URL</label>
          <input
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            className="w-full rounded-card border border-border px-3 py-2 text-ink"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Aktiv
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
            />
            Premium
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-card bg-primary px-4 py-2 text-sm font-medium text-white shadow-card disabled:opacity-50"
        >
          {submitting ? 'Yadda saxlanılır...' : 'Klubu yadda saxla'}
        </button>
      </form>
    </div>
  );
}
