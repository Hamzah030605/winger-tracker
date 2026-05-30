'use client'

type DayLog = { date: string; type: 'gym' | 'football' }

export function CalendarHeatmap({ logs }: { logs: DayLog[] }) {
  // Build 12 weeks × 7 days grid ending today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startDate = new Date(today)
  // Go back to the start of the current week's Monday, then subtract 11 more weeks
  const dayOfWeek = (today.getDay() + 6) % 7 // 0 = Monday
  startDate.setDate(startDate.getDate() - dayOfWeek - 11 * 7)

  const days: Date[] = []
  for (let i = 0; i < 84; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    days.push(d)
  }

  // Map date string → counts
  const dayMap: Record<string, { gym: number; football: number }> = {}
  for (const log of logs) {
    const key = new Date(log.date).toDateString()
    if (!dayMap[key]) dayMap[key] = { gym: 0, football: 0 }
    dayMap[key][log.type]++
  }

  const weeks: Date[][] = []
  for (let i = 0; i < 12; i++) {
    weeks.push(days.slice(i * 7, i * 7 + 7))
  }

  function getColor(d: Date): string {
    const key = d.toDateString()
    const counts = dayMap[key]
    if (!counts) return 'var(--border)'
    if (counts.gym > 0 && counts.football > 0) return '#a78bfa' // both = purple
    if (counts.gym > 0) return 'var(--gym-accent)'
    if (counts.football > 0) return 'var(--football-accent)'
    return 'var(--border)'
  }

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* Day labels */}
      <div className="flex gap-1 mb-1 pl-8">
        {dayLabels.map((l, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[9px] uppercase"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {l}
          </div>
        ))}
      </div>

      {/* Grid: weeks as rows */}
      <div className="flex flex-col gap-1">
        {weeks.map((week, wi) => {
          const monthLabel = week[0].toLocaleDateString('en-GB', { month: 'short' })
          const showMonth = wi === 0 || week[0].getDate() <= 7

          return (
            <div key={wi} className="flex items-center gap-1">
              <div
                className="w-7 text-[9px] text-right pr-1 flex-shrink-0"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {showMonth ? monthLabel : ''}
              </div>
              {week.map((day, di) => {
                const isToday = day.toDateString() === today.toDateString()
                const isFuture = day > today
                const color = isFuture ? 'transparent' : getColor(day)
                const key = day.toDateString()
                const counts = dayMap[key]

                return (
                  <div
                    key={di}
                    title={`${day.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}${counts ? ` — gym:${counts.gym} football:${counts.football}` : ''}`}
                    className="flex-1 aspect-square rounded-sm"
                    style={{
                      background: color,
                      border: isToday ? '2px solid var(--primary)' : 'none',
                      opacity: isFuture ? 0 : 1,
                    }}
                  />
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        {[
          { color: 'var(--gym-accent)', label: 'Gym' },
          { color: 'var(--football-accent)', label: 'Football' },
          { color: '#a78bfa', label: 'Both' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: l.color }} />
            <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
