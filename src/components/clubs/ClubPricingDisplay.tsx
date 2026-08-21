import type { ClubPricing, ClubType } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { formatPriceRange } from '@/lib/utils';

type DetailedPricing = ClubPricing & {
  tariff_name?: string | null;
  schedule_label?: string | null;
  position?: number;
  club_type: Pick<ClubType, 'id' | 'name' | 'slug'>;
};

export function ClubPricingDisplay({ pricing }: { pricing: DetailedPricing[] }) {
  const realPricing = pricing
    .filter((item) => item.price_from > 0 && item.club_type)
    .sort((a, b) => {
      const typeCompare = a.club_type.name.localeCompare(b.club_type.name, 'az');
      if (typeCompare !== 0) return typeCompare;
      return (a.position ?? 0) - (b.position ?? 0);
    });

  if (realPricing.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-alt px-4 py-4 text-sm text-muted">
        Qiymət məlumatı hələ təsdiqlənməyib.
      </div>
    );
  }

  const groups = new Map<string, DetailedPricing[]>();
  for (const item of realPricing) {
    const current = groups.get(item.club_type.id) ?? [];
    current.push(item);
    groups.set(item.club_type.id, current);
  }

  return (
    <div className="space-y-4">
      {Array.from(groups.values()).map((items) => {
        const type = items[0].club_type;
        return (
          <div key={type.id} className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-alt px-4 py-3">
              <Badge tone={type.slug === 'pc' ? 'pc' : 'ps'}>{type.name}</Badge>
              <span className="text-xs text-muted">{items.length > 1 ? `${items.length} tarif` : '1 tarif'}</span>
            </div>
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.id} className="grid gap-2 px-4 py-3.5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{item.tariff_name || type.name}</p>
                    {item.schedule_label ? <p className="mt-0.5 text-xs leading-5 text-muted">{item.schedule_label}</p> : null}
                  </div>
                  <span className="font-mono text-sm font-semibold text-ink">
                    {formatPriceRange(item.price_from, item.price_to, item.unit)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
