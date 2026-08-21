'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const IMAGE_BUCKET = 'club-images';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function extensionFor(file: File) {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

function storagePathFromPublicUrl(url: string) {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${IMAGE_BUCKET}/`;
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return null;
    return decodeURIComponent(parsed.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

export function ClubProfileImageUploader({
  clubId,
  clubName,
  initialUrl,
}: {
  clubId: string;
  clubName: string;
  initialUrl?: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function upload(file: File | undefined) {
    if (!file) return;
    setError('');
    setSuccess('');

    if (!ALLOWED_TYPES.has(file.type)) {
      setError('Yalnız JPG, PNG və WEBP şəkilləri qəbul edilir.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Profil şəkli maksimum 5 MB ola bilər.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const path = `${clubId}/profile/${Date.now()}-${crypto.randomUUID()}.${extensionFor(file)}`;
    let uploadedUrl: string | null = null;

    try {
      const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
        cacheControl: '31536000',
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw new Error(uploadError.message);

      uploadedUrl = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
      const { error: updateError } = await (supabase as any)
        .from('clubs')
        .update({ profile_image_url: uploadedUrl, updated_at: new Date().toISOString() })
        .eq('id', clubId);
      if (updateError) throw new Error(updateError.message);

      const previousUrl = url;
      setUrl(uploadedUrl);
      setSuccess('Profil şəkli yadda saxlanıldı.');

      if (previousUrl && previousUrl !== uploadedUrl) {
        const previousPath = storagePathFromPublicUrl(previousUrl);
        if (previousPath) {
          const { error: cleanupError } = await supabase.storage.from(IMAGE_BUCKET).remove([previousPath]);
          if (cleanupError) console.error('Köhnə profil şəkli silinmədi:', cleanupError.message);
        }
      }

      router.refresh();
    } catch (uploadError) {
      if (uploadedUrl) {
        const uploadedPath = storagePathFromPublicUrl(uploadedUrl);
        if (uploadedPath) await supabase.storage.from(IMAGE_BUCKET).remove([uploadedPath]);
      }
      setError(uploadError instanceof Error ? `Profil şəkli yüklənmədi: ${uploadError.message}` : 'Profil şəkli yüklənmədi.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function remove() {
    if (!url || uploading) return;
    setUploading(true);
    setError('');
    setSuccess('');
    const supabase = createClient();
    const previousUrl = url;

    try {
      const { error: updateError } = await (supabase as any)
        .from('clubs')
        .update({ profile_image_url: null, updated_at: new Date().toISOString() })
        .eq('id', clubId);
      if (updateError) throw new Error(updateError.message);

      setUrl(null);
      const previousPath = storagePathFromPublicUrl(previousUrl);
      if (previousPath) {
        const { error: removeError } = await supabase.storage.from(IMAGE_BUCKET).remove([previousPath]);
        if (removeError) console.error('Profil şəkli Storage-dan silinmədi:', removeError.message);
      }
      setSuccess('Profil şəkli silindi.');
      router.refresh();
    } catch (removeError) {
      setError(removeError instanceof Error ? `Profil şəkli silinmədi: ${removeError.message}` : 'Profil şəkli silinmədi.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Profil şəkli / loqo</h2>
          <p className="mt-1 max-w-xl text-xs leading-5 text-gray-500">
            Klub adının yanında görünən profil şəklidir. JPG, PNG və ya WEBP seç; maksimum 5 MB. Dəyişiklik ayrıca dərhal yadda saxlanılır.
          </p>
        </div>

        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
          {url ? (
            <Image src={url} alt={`${clubName} profil şəkli`} fill sizes="96px" className="object-contain p-1" />
          ) : (
            <div className="flex h-full items-center justify-center px-2 text-center text-xs font-semibold text-gray-400">Profil şəkli yoxdur</div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center rounded-lg bg-[#7C5CFC] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6A47F0]">
          {uploading ? 'Yüklənir...' : url ? 'Şəkli dəyiş' : 'Profil şəkli əlavə et'}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(event) => void upload(event.target.files?.[0])}
            className="hidden"
          />
        </label>
        {url ? (
          <button
            type="button"
            disabled={uploading}
            onClick={() => void remove()}
            className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Sil
          </button>
        ) : null}
      </div>

      {success ? <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">{success}</p> : null}
      {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p> : null}
    </section>
  );
}
