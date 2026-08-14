interface HeroProps {
  clubCount: number;
  districtCount: number;
  openNowCount: number;
}

export function Hero({ clubCount, districtCount, openNowCount }: HeroProps) {
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5">
        <h1 className="font-display text-xl font-bold leading-tight text-ink sm:text-2xl">
          <span className="text-primary">PC</span> və{' '}
          <span className="text-ps">PlayStation</span> klublarını tap
        </h1>
        <p className="mt-1 text-sm text-muted">Bakıda sənə ən yaxın gaming məkanını tap.</p>

        <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-surface-alt sm:flex sm:w-fit sm:gap-0">
          <div className="px-3 py-2.5 text-center sm:min-w-[100px] sm:px-4">
            <strong className="block text-base text-ink sm:text-lg">{clubCount}</strong>
            <span className="text-[11px] text-muted sm:text-xs">klub</span>
          </div>
          <div className="border-x border-border px-3 py-2.5 text-center sm:min-w-[100px] sm:px-4">
            <strong className="block text-base text-ink sm:text-lg">{districtCount}</strong>
            <span className="text-[11px] text-muted sm:text-xs">rayon</span>
          </div>
          <div className="px-3 py-2.5 text-center sm:min-w-[120px] sm:px-4">
            <strong className="flex items-center justify-center gap-1.5 text-base text-ink sm:text-lg">
              <span className="inline-block h-2 w-2 rounded-full bg-live" aria-hidden="true" />
              {openNowCount}
            </strong>
            <span className="text-[11px] text-muted sm:text-xs">hazırda açıq</span>
          </div>
        </div>
      </div>
    </section>
  );
}
