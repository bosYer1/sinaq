type MapPreviewProps = {
  clubCount: number;
};

const markerPositions = [
  ['22%', '29%'],
  ['37%', '61%'],
  ['51%', '38%'],
  ['64%', '70%'],
  ['76%', '45%'],
  ['84%', '63%'],
] as const;

export function MapPreview({ clubCount }: MapPreviewProps) {
  const visibleMarkers = Math.min(markerPositions.length, Math.max(3, Math.ceil(clubCount / 8)));

  return (
    <div
      aria-label="Xəritə önizləməsi"
      className="relative h-full w-full overflow-hidden rounded-[18px] border border-border bg-surface-alt"
    >
      <div
        className="absolute inset-0 opacity-90"
        aria-hidden="true"
        style={{
          backgroundImage: [
            'linear-gradient(28deg, transparent 0 45%, rgba(148,163,184,.22) 46% 49%, transparent 50% 100%)',
            'linear-gradient(102deg, transparent 0 38%, rgba(148,163,184,.18) 39% 42%, transparent 43% 100%)',
            'repeating-linear-gradient(0deg, transparent 0 38px, rgba(148,163,184,.10) 39px 40px)',
            'repeating-linear-gradient(90deg, transparent 0 52px, rgba(148,163,184,.10) 53px 54px)',
          ].join(', '),
        }}
      />

      <div className="absolute left-[8%] top-[11%] h-20 w-24 rounded-2xl bg-primary/5" aria-hidden="true" />
      <div className="absolute bottom-[13%] right-[9%] h-24 w-28 rounded-3xl bg-pc-tint/70" aria-hidden="true" />
      <div className="absolute left-[11%] top-[16%] text-[10px] font-semibold tracking-wide text-muted/75" aria-hidden="true">Bakı</div>
      <div className="absolute right-[12%] top-[21%] text-[9px] text-muted/60" aria-hidden="true">Nərimanov</div>
      <div className="absolute bottom-[19%] left-[15%] text-[9px] text-muted/60" aria-hidden="true">Yasamal</div>

      {markerPositions.slice(0, visibleMarkers).map(([top, left], index) => (
        <span
          key={`${top}-${left}`}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ top, left }}
          aria-hidden="true"
        >
          <span className="block h-4 w-4 rounded-full border-[3px] border-surface bg-primary shadow-card" />
          {index === 0 ? <span className="mx-auto mt-0.5 block h-1.5 w-1.5 rotate-45 bg-primary" /> : null}
        </span>
      ))}

      <div className="absolute left-3 top-3 rounded-xl border border-border bg-surface/95 px-3 py-2 text-xs font-semibold text-ink shadow-card backdrop-blur">
        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-live" aria-hidden="true" />
        Xəritədə {clubCount} klub
      </div>

      <div className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface/95 text-sm font-semibold text-muted shadow-card backdrop-blur" aria-hidden="true">
        ⌖
      </div>

      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface-alt/55 to-transparent" aria-hidden="true" />
    </div>
  );
}
