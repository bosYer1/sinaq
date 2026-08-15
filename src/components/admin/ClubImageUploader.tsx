'use client';

import Image from 'next/image';
import { useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const IMAGE_BUCKET = 'club-images';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 8;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type ExistingImage = {
  url: string;
  position: number;
  is_cover: boolean;
};

type ImageItem = {
  url: string;
  uploadedNow: boolean;
};

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

export function ClubImageUploader({
  clubId,
  images,
}: {
  clubId?: string;
  images: ExistingImage[];
}) {
  const initialItems = useMemo<ImageItem[]>(
    () =>
      [...images]
        .sort((a, b) => {
          if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
          return a.position - b.position;
        })
        .map((image) => ({ url: image.url, uploadedNow: false })),
    [images]
  );
  const [items, setItems] = useState(initialItems);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError('');

    const selected = Array.from(files);
    if (items.length + selected.length > MAX_IMAGES) {
      setError(`Bir klubda maksimum ${MAX_IMAGES} şəkil saxlamaq olar.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    const invalid = selected.find((file) => !ALLOWED_TYPES.has(file.type) || file.size > MAX_IMAGE_SIZE);
    if (invalid) {
      setError(
        !ALLOWED_TYPES.has(invalid.type)
          ? 'Yalnız JPG, PNG və WEBP şəkilləri qəbul edilir.'
          : 'Hər şəkil maksimum 5 MB ola bilər.'
      );
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const uploaded: ImageItem[] = [];

    try {
      for (const file of selected) {
        const folder = clubId || 'pending';
        const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extensionFor(file)}`;
        const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
          cacheControl: '31536000',
          contentType: file.type,
          upsert: false,
        });
        if (uploadError) throw new Error(uploadError.message);

        const url = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
        uploaded.push({ url, uploadedNow: true });
      }

      setItems((current) => [...current, ...uploaded]);
    } catch (uploadError) {
      const uploadedPaths = uploaded
        .map((item) => storagePathFromPublicUrl(item.url))
        .filter((path): path is string => Boolean(path));
      if (uploadedPaths.length > 0) await supabase.storage.from(IMAGE_BUCKET).remove(uploadedPaths);
      setError(uploadError instanceof Error ? `Şəkil yüklənmədi: ${uploadError.message}` : 'Şəkil yüklənmədi.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function removeItem(item: ImageItem) {
    setError('');
    if (item.uploadedNow) {
      const path = storagePathFromPublicUrl(item.url);
      if (path) {
        const { error: removeError } = await createClient().storage.from(IMAGE_BUCKET).remove([path]);
        if (removeError) {
          setError(`Şəkil silinmədi: ${removeError.message}`);
          return;
        }
      }
    }
    setItems((current) => current.filter((candidate) => candidate.url !== item.url));
  }

  function makeCover(url: string) {
    setItems((current) => {
      const selected = current.find((item) => item.url === url);
      if (!selected) return current;
      return [selected, ...current.filter((item) => item.url !== url)];
    });
  }

  const imageUrls = items.map((item) => item.url).join('\n');

  return (
    <div>
      <textarea name="image_urls" value={imageUrls} readOnly className="hidden" aria-hidden="true" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Şəkillər</h2>
          <p className="mt-1 text-xs text-gray-500">
            Şəkillər birbaşa Supabase Storage-a yüklənir. JPG, PNG və WEBP; hər fayl maksimum 5 MB, klub üzrə maksimum 8 şəkil.
          </p>
        </div>
        <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
          {items.length}/{MAX_IMAGES}
        </span>
      </div>

      {items.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => (
            <div key={item.url} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="relative aspect-video bg-gray-100">
                <Image src={item.url} alt={`Klub şəkli ${index + 1}`} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" />
                {index === 0 ? (
                  <span className="absolute left-2 top-2 rounded-md bg-gray-900/85 px-2 py-1 text-[10px] font-semibold text-white">Cover</span>
                ) : null}
              </div>
              <div className="flex gap-2 p-2">
                {index !== 0 ? (
                  <button type="button" onClick={() => makeCover(item.url)} className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs font-semibold text-gray-700 hover:border-[#7C5CFC] hover:text-[#6A47F0]">
                    Cover et
                  </button>
                ) : null}
                <button type="button" onClick={() => void removeItem(item)} className="flex-1 rounded-md border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          Bu klubun hələ şəkli yoxdur. İlk real şəkil public klub səhifəsinin cover-i olacaq.
        </div>
      )}

      <label className="mt-4 block text-sm font-medium">
        Yeni şəkillər əlavə et
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading || items.length >= MAX_IMAGES}
          onChange={(event) => void uploadSelected(event.target.files)}
          className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        />
      </label>

      {uploading ? <p className="mt-2 text-xs font-medium text-[#6A47F0]">Şəkillər Supabase-a yüklənir...</p> : null}
      {error ? <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p> : null}
      <p className="mt-2 text-xs text-gray-500">Cover dəyişmək üçün istədiyin şəkildən “Cover et” seç. Mövcud şəkli siləndə Storage təmizlənməsi klub məlumatını yadda saxladıqdan sonra tamamlanır.</p>
    </div>
  );
}
