import type { ClubPricing, ClubType } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { formatPriceRange } from '@/lib/utils';

type DetailedPricing = ClubPricing & {
  tariff_name?: string | null;
  schedule_label?: string | null;
  position?: number;
  club_type: Pick<ClubType, 'id' | 'name' | 'slug'>;
};

function sortPricing(a: DetailedPricing, b: DetailedPricing) {
  const typeCompare = a.club_type.name.localeCompare(b.club_type.name, 'az');
  if (typeCompare !== 0) return typeCompare;
  return (a.position ?? 0) - (b.position ?? 0);
}

export function ClubPricingDisplay({ pricing }: { pricing: DetailedPricing[] }) {
  const realPricing = pricing
    .filter((item) => item.price_from > 0 && item.club_type)
    .sort(sortPricing);

  if (realPricing.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-alt px-4 py-4 text-sm text-muted">
        Qiymət məlumatı hələ təsdiqlənməyib.
      </div>
    );
  }

  const platformGroups = new Map<string, DetailedPricing[]>();
  for (const item of realPricing) {
    const current = platformGroups.get(item.club_type.id) ?? [];
    current.push(item);
    platformGroups.set(item.club_type.id, current);
  }

  return (
    <div className="space-y-5 font-body">
      {Array.from(platformGroups.values()).map((platformItems) => {
        const type = platformItems[0].club_type;
        const scheduleGroups = new Map<string, DetailedPricing[]>();

        for (const item of platformItems) {
          const scheduleKey = item.schedule_label?.trim() || '';
          const current = scheduleGroups.get(scheduleKey) ?? [];
          current.push(item);
          scheduleGroups.set(scheduleKey, current);
        }

        return (
          <div key={type.id} className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-alt px-4 py-3">
              <Badge tone={type.slug === 'pc' ? 'pc' : 'ps'}>{type.name}</Badge>
              <span className="text-xs font-medium text-muted">
                {platformItems.length > 1 ? `${platformItems.length} tarif` : '1 tarif'}
              </span>
            </div>

            <div className="divide-y divide-border">
              {Array.from(scheduleGroups.entries()).map(([schedule, items], scheduleIndex) => (
                <div key={`${type.id}-${schedule || 'default'}-${scheduleIndex}`} className="px-4 py-3.5">
                  {schedule ? (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{schedule}</p>
                  ) : null}

                  <div className="space-y-2.5">
                    {items.map((item) => (
                      <div key={item.id} className="grid gap-1.5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4">
                        <p className="min-w-0 text-sm font-semibold text-ink">
                          {item.tariff_name || type.name}
                        </p>
                        <span className="font-body text-sm font-semibold tabular-nums text-ink">
                          {formatPriceRange(item.price_from, item.price_to, item.unit)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
