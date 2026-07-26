// Donut chart ringan berbasis SVG murni (tanpa library) agar bundle tetap kecil.
// Dipakai dashboard untuk menampilkan sebaran data secara menarik.

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  segments,
  size = 176,
  thickness = 26,
  centerLabel = "Total",
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  let acc = 0;

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
        role="img"
        aria-label={`${centerLabel}: ${total}`}
      >
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={thickness}
          />
          {total > 0 &&
            segments.map((seg, i) => {
              if (seg.value <= 0) return null;
              const len = (seg.value / total) * c;
              const circle = (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-acc}
                  strokeLinecap="butt"
                />
              );
              acc += len;
              return circle;
            })}
        </g>
        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          fontSize="30"
          fontWeight="700"
          fill="#0f172a"
        >
          {total}
        </text>
        <text x="50%" y="61%" textAnchor="middle" fontSize="11" fill="#64748b">
          {centerLabel}
        </text>
      </svg>

      <ul className="text-sm space-y-1.5 min-w-[170px] flex-1">
        {segments.map((seg, i) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <li key={i} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ background: seg.color }}
              />
              <span className="text-slate-700 flex-1 truncate">{seg.label}</span>
              <span className="text-slate-500 tabular-nums">
                {seg.value}
                <span className="text-slate-400"> · {pct}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
