import Link from 'next/link';

export default function ClubNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-alt text-3xl">🎮</div>
      <h1 className="font-display text-xl font-semibold text-ink">Klub tapılmadı</h1>
      <p className="text-sm text-muted">
        Axtardığınız klub silinmiş və ya mövcud olmaya bilər. Bütün klubları ana səhifədən görə bilərsiniz.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark"
      >
        Ana səhifəyə qayıt
      </Link>
    </div>
  );
}
