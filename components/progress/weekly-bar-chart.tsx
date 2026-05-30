'use client'

type Week = { label: string; gym: number; football: number }

export function WeeklyBarChart({ weeks }: { weeks: Week[] }) {
  const maxTotal = Math.max(...weeks.map((w) => w.gym + w.football), 1)

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-end gap-2 h-32">
        {weeks.map((week, i) => {
          const total = week.gym + week.football
          const totalPct = (total / maxTotal) * 100
          const gymPct = total > 0 ? (week.gym / total) * 100 : 0

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-lg overflow-hidden flex flex-col-reverse"
                style={{ height: `${Math.max(totalPct, total > 0 ? 4 : 0)}%` }}
              >
                <div style={{ height: `${gymPct}%`, background: 'var(--gym-accent)', minHeight: week.gym > 0 ? '4px' : '0' }} />
                <div style={{ height: `${100 - gymPct}%`, background: 'var(--football-accent)', minHeight: week.football > 0 ? '4px' : '0' }} />
              </div>
              {total > 0 && (
                <span className="text-[9px] font-bold" style={{ color: 'var(--foreground)' }}>{total}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* X-axis labels — show every other week */}
      <div className="flex gap-2 mt-2">
        {weeks.map((week, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[8px]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {i % 2 === 0 ? week.label : ''}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--gym-accent)' }} />
          <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>Gym</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--football-accent)' }} />
          <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>Football</span>
        </div>
      </div>
    </div>
  )
}
