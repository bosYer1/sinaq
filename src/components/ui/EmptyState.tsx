interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-alt">
        <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-muted">
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
          <path d="M17 17l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted">{description}</p>}
    </div>
  );
}
