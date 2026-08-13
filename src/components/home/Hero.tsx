interface HeroProps {
  clubCount: number;
  districtCount: number;
  openNowCount: number;
}

/**
 * Yığcam hero bandı. Ana səhifənin flex-col axınında öz təbii hündürlüyünü
 * tutur — ExploreView (flex-1) qalan sahəni avtomatik doldurduğu üçün
 * layout hesablamalarına toxunmadan əlavə olunur.
 */
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
      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">
          <span className="text-primary">PC</span> &amp; <span className="text-ps">PlayStation</span> klublarını tap
        </h1>
        <p className="mt-1.5 max-w-md text-sm text-muted">
          Bakıda ən yaxın gaming məkanını rayon, tip və qiymətə görə filtrləyib saniyələr içində tap.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm sm:gap-6">
          <span className="flex items-baseline gap-1.5">
            <span className="font-display text-lg font-bold text-ink">{clubCount}</span>
            <span className="text-muted">klub</span>
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="font-display text-lg font-bold text-ink">{districtCount}</span>
            <span className="text-muted">rayon</span>
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-live" />
            <span className="font-display text-lg font-bold text-ink">{openNowCount}</span>
            <span className="text-muted">hazırda açıq</span>
          </span>
        </div>
      </div>
    </div>
  );
}
