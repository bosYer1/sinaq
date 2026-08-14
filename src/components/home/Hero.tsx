interface HeroProps {
  clubCount: number;
  districtCount: number;
  openNowCount: number;
}

export function Hero({ clubCount, districtCount, openNowCount }: HeroProps) {
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">
          <span className="text-primary">PC</span> və{' '}
          <span className="text-ps">PlayStation</span> klublarını tap
        </h1>

        <p className="mt-1 text-sm text-muted">
          Bakıda sənə ən yaxın gaming məkanını tap.
        </p>

        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <strong className="text-lg text-ink">{clubCount}</strong>{' '}
            <span className="text-muted">klub</span>
          </div>

          <div>
            <strong className="text-lg text-ink">{districtCount}</strong>{' '}
            <span className="text-muted">rayon</span>
          </div>

          <div>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-live" />
            <strong className="text-lg text-ink">{openNowCount}</strong>{' '}
            <span className="text-muted">hazırda açıq</span>
          </div>
        </div>
      </div>
    </section>
  );
}
