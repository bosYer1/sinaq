'use client';

import { useFormStatus } from 'react-dom';

export function SubmissionSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-control bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Göndərilir...' : label}
    </button>
  );
}
