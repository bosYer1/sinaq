'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type SelectedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

export function SubmissionImagePicker() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<SelectedImage[]>([]);
  const [error, setError] = useState('');

  const previewUrls = useMemo(() => items.map((item) => item.previewUrl), [items]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  function syncInput(next: SelectedImage[]) {
    if (!inputRef.current) return;
    const transfer = new DataTransfer();
    next.forEach((item) => transfer.items.add(item.file));
    inputRef.current.files = transfer.files;
  }

  function selectFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError('');

    const incoming = Array.from(files);
    if (items.length + incoming.length > MAX_IMAGES) {
      setError(`Maksimum ${MAX_IMAGES} şəkil əlavə edə bilərsiniz.`);
      if (inputRef.current) syncInput(items);
      return;
    }

    const invalid = incoming.find((file) => !ALLOWED_TYPES.has(file.type) || file.size > MAX_IMAGE_SIZE);
    if (invalid) {
      setError(
        !ALLOWED_TYPES.has(invalid.type)
          ? 'Yalnız JPG, PNG və WEBP şəkilləri qəbul edilir.'
          : 'Hər şəkil maksimum 5 MB ola bilər.'
      );
      if (inputRef.current) syncInput(items);
      return;
    }

    const next = [
      ...items,
      ...incoming.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ];
    setItems(next);
    syncInput(next);
  }

  function removeImage(id: string) {
    const removed = items.find((item) => item.id === id);
    if (removed) URL.revokeObjectURL(removed.previewUrl);
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    syncInput(next);
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-bold text-ink">Klub şəkilləri</h3>
          <p className="mt-1 text-xs leading-5 text-muted">
            Profil şəkli tələb olunmur. Klubun içini, PC/PlayStation zonalarını və ümumi görünüşünü göstərən maksimum 5 real şəkil əlavə edin.
          </p>
        </div>
        <span className="rounded-md bg-black/5 px-2.5 py-1 text-xs font-semibold text-muted">{items.length}/{MAX_IMAGES}</span>
      </div>

      {items.length > 0 ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((item, index) => (
            <div key={item.id} className="overflow-hidden rounded-lg border border-border bg-background">
              <div className="relative aspect-video bg-black/5">
                <Image src={item.previewUrl} alt={`Seçilmiş klub şəkli ${index + 1}`} fill unoptimized className="object-cover" />
              </div>
              <button
                type="button"
                onClick={() => removeImage(item.id)}
                className="w-full border-t border-border px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                Sil
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <label className="mt-3 block text-sm font-medium text-ink">
        Şəkil əlavə et
        <input
          ref={inputRef}
          type="file"
          name="owner_images"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={items.length >= MAX_IMAGES}
          onChange={(event) => selectFiles(event.target.files)}
          className="mt-2 block w-full rounded-control border border-border bg-background px-3 py-2 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-50"
        />
      </label>
      <p className="mt-2 text-xs leading-5 text-muted">JPG, PNG və WEBP. Hər şəkil maksimum 5 MB. Şəkillər admin təsdiqinə qədər klub səhifəsində göstərilmir.</p>
      {error ? <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
