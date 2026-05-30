'use client'

interface DayEntry {
  date: string
  total: number
  done: number
}

function getColor(pct: number): string {
  if (pct === 0) return 'var(--secondary)'
  if (pct < 0.4) return 'rgba(255,77,28,0.25)'
  if (pct < 0.7) return 'rgba(255,77,28,0.5)'
  if (pct < 1) return 'rgba(255,77,28,0.75)'
  return '#10b981'
}

export function HistoryHeatmap({ days }: { days: DayEntry[] }) {
  return (
    <div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <p key={i} className="text-center text-[10px] font-medium pb-1" style={{ color: 'var(--muted-foreground)' }}>
            {d}
          </p>
        ))}
        {days.map((day) => {
          const pct = day.total > 0 ? day.done / day.total : 0
          const label = new Date(day.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
          return (
            <div
              key={day.date}
              title={`${label}: ${day.done}/${day.total} habits`}
              className="aspect-square rounded-md"
              style={{ background: getColor(pct) }}
            />
          )
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 justify-end">
        {[
          { color: 'var(--secondary)', label: '0%' },
          { color: 'rgba(255,77,28,0.5)', label: '<70%' },
          { color: '#10b981', label: '100%' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: item.color }} />
            <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
