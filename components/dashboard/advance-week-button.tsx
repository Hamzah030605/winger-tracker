'use client'

// Week advances automatically from plan_start_date — this component shows
// programme completion status only. The old manual-advance button is removed.
export function AdvanceWeekButton({
  currentWeek,
  maxWeek,
  planStartDate,
  preStart,
}: {
  currentWeek: number
  maxWeek: number
  planStartDate: string
  preStart: boolean
}) {
  if (preStart) {
    const d = new Date(planStartDate + 'T00:00:00')
    const formatted = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    return (
      <div
        className="rounded-2xl p-4 text-center"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p className="font-semibold text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Programme starts {formatted}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Week 1 begins automatically on Monday.
        </p>
      </div>
    )
  }

  if (currentWeek >= maxWeek) {
    return (
      <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="font-bold" style={{ color: 'var(--primary)' }}>🏆 Programme Complete!</p>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          You finished all {maxWeek} weeks. Incredible work.
        </p>
      </div>
    )
  }

  // During weeks 1–5: show next week info passively (no manual advance)
  return (
    <div
      className="rounded-2xl p-3.5 flex items-center justify-between"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Week {currentWeek + 1} unlocks next Monday
      </p>
      <span
        className="text-xs font-semibold px-2 py-1 rounded-full"
        style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
      >
        Wk {currentWeek}/{maxWeek}
      </span>
    </div>
  )
}
