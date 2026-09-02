type MapPreviewProps = {
  clubCount: number;
};

const tiles = [
  [1306, 771], [1307, 771], [1308, 771],
  [1306, 772], [1307, 772], [1308, 772],
  [1306, 773], [1307, 773], [1308, 773],
] as const;

const markers = [
  ['42%', '20%', '#7C5CFC', true],
  ['46%', '24%', '#7C5CFC', true],
  ['49%', '28%', '#06AED4', true],
  ['52%', '31%', '#7C5CFC', false],
  ['45%', '34%', '#06AED4', true],
  ['55%', '36%', '#7C5CFC', true],
  ['48%', '39%', '#7C5CFC', true],
  ['59%', '41%', '#06AED4', true],
  ['52%', '44%', '#7C5CFC', true],
  ['43%', '47%', '#7C5CFC', true],
  ['57%', '49%', '#06AED4', true],
  ['51%', '53%', '#7C5CFC', true],
  ['46%', '56%', '#7C5CFC', true],
  ['40%', '60%', '#06AED4', true],
  ['37%', '64%', '#7C5CFC', true],
  ['52%', '66%', '#7C5CFC', false],
  ['38%', '82%', '#06AED4', true],
] as const;

function PreviewMarker({ top, left, color, open }: { top: string; left: string; color: string; open: boolean }) {
  return (
    <span
      className="absolute -translate-x-1/2 -translate-y-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.18)]"
      style={{ top, left }}
      aria-hidden="true"
    >
      <span className="relative block h-7 w-6">
        <svg viewBox="0 0 40 40" className="h-7 w-7 overflow-visible">
          <path d="M20 4C13.4 4 8 9.4 8 16c0 8.6 12 20 12 20s12-11.4 12-20C32 9.4 26.6 4 20 4Z" fill={color} stroke="#fff" strokeWidth="2.2" />
          <circle cx="20" cy="16" r="4" fill="#fff" />
          {open ? <circle cx="30.5" cy="8.5" r="4.5" fill="#16A34A" stroke="#fff" strokeWidth="2" /> : null}
        </svg>
      </span>
    </span>
  );
}

export function MapPreview({ clubCount }: MapPreviewProps) {
  return (
    <div
      aria-label="Xəritə önizləməsi"
      className="gameyer-map-preview relative h-full w-full overflow-hidden rounded-[18px] border border-border"
    >
      <div className="gameyer-map-preview-tiles absolute inset-0 grid grid-cols-3 grid-rows-3" aria-hidden="true">
        {tiles.map(([x, y]) => (
          <div
            key={`${x}-${y}`}
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage: `url(https://tile.openstreetmap.org/11/${x}/${y}.png)`,
            }}
          />
        ))}
      </div>

      <div className="gameyer-map-preview-wash absolute inset-0" aria-hidden="true" />

      {markers.map(([top, left, color, open], index) => (
        <PreviewMarker key={`${top}-${left}-${index}`} top={top} left={left} color={color} open={open} />
      ))}

      <div className="absolute left-3 top-3 rounded-xl border border-border bg-surface/95 px-3 py-2 text-xs font-semibold text-ink shadow-card backdrop-blur">
        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-live" aria-hidden="true" />
        Xəritədə {clubCount} klub
      </div>

      <div className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface/95 text-sm font-semibold text-muted shadow-card backdrop-blur" aria-hidden="true">
        ⌖
      </div>

      <div className="gameyer-map-preview-attribution absolute bottom-1 right-2 rounded px-1.5 py-0.5 text-[9px] shadow-sm" aria-hidden="true">
        © OpenStreetMap contributors
      </div>
    </div>
  );
}
