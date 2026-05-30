export function WeekProgressRing({
  label,
  done,
  total,
  color,
}: {
  label: string
  done: number
  total: number
  color: string
}) {
  const pct = Math.min(1, done / total)
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = pct * circ

  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <svg width="68" height="68" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 34 34)"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
        <text
          x="34"
          y="39"
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="var(--foreground)"
        >
          {done}/{total}
        </text>
      </svg>
      <p className="text-xs font-medium leading-tight" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </p>
    </div>
  )
}
