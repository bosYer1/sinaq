interface HeroProps {
  clubCount: number;
  districtCount: number;
  openNowCount: number;
}

export function Hero({ clubCount, districtCount, openNowCount }: HeroProps) {
  return (
    <div className="relative overflow-hidden border-b border-border bg-surface">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(600px circle at 15% 0%, rgba(124,92,255,0.16), transparent 60%), radial-gradient(500px circle at 85% 100%, rgba(34,211,238,0.12), transparent 60%)',
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
        <h1 className="font-display text-base font-bold text-ink sm:text-lg">
          <span className="text-primary">PC</span> &amp; <span className="text-ps">PlayStation</span> klublarını tap
        </h1>
        <p className="mt-0.5 max-w-md text-xs text-muted sm:text-sm">
          Bakıda ən yaxın gaming məkanını rayon, tip və qiymətə görə filtrləyib saniyələr içində tap.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs sm:mt-2.5 sm:gap-5 sm:text-sm">
          <span className="flex items-baseline gap-1">
            <span className="font-display text-sm font-bold text-ink sm:text-base">{clubCount}</span>
            <span className="text-muted">klub</span>
          </span>
          <span className="flex items-baseline gap-1">
            <span className="font-display text-sm font-bold text-ink sm:text-base">{districtCount}</span>
            <span className="text-muted">rayon</span>
          </span>
          <span className="flex items-baseline gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-live" />
            <span className="font-display text-sm font-bold text-ink sm:text-base">{openNowCount}</span>
            <span className="text-muted">hazırda açıq</span>
          </span>
        </div>
      </div>
    </div>
  );
}
