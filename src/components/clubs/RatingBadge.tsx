export function RatingBadge({ rating, count }: { rating: number | null; count: number }) {
  if (!rating) {
    return <span className="text-xs text-muted">Hələ reytinq yoxdur</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-ink">
      <span className="text-warn">★</span>
      {rating.toFixed(1)}
      {count > 0 && <span className="text-muted">({count})</span>}
    </span>
  );
}
