interface EmptyStateProps {
  title: string;
  description?: string;
}

/** Filtr nəticəsi boş olanda göstərilən vəziyyət. */
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt text-2xl">
        🎮
      </div>
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted">{description}</p>}
    </div>
  );
}
