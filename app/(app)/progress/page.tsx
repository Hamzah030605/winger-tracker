import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarHeatmap } from '@/components/progress/calendar-heatmap'
import { WeeklyBarChart } from '@/components/progress/weekly-bar-chart'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 84)

  const { data: logs } = await supabase
    .from('session_logs')
    .select('id, completed_at, plan_type, session_name, week_number, overall_notes')
    .eq('user_id', user.id)
    .gte('completed_at', ninetyDaysAgo.toISOString())
    .order('completed_at', { ascending: true })

  const allLogs = logs ?? []

  // Fetch exercise logs for the 15 most recent sessions to show in history
  type ExRow = { session_log_id: string; exercise_name: string; sets: number | null; reps: number | null; weight: number | null; rpe: number | null; notes: string | null }
  const recentSessionIds = [...allLogs].reverse().slice(0, 15).map((l) => l.id)
  let exerciseLogRows: ExRow[] = []
  if (recentSessionIds.length > 0) {
    const { data } = await supabase
      .from('exercise_logs')
      .select('session_log_id, exercise_name, sets, reps, weight, rpe, notes')
      .in('session_log_id', recentSessionIds)
    exerciseLogRows = (data ?? []) as ExRow[]
  }

  const exercisesBySession: Record<string, ExRow[]> = {}
  for (const ex of exerciseLogRows) {
    if (!exercisesBySession[ex.session_log_id]) exercisesBySession[ex.session_log_id] = []
    exercisesBySession[ex.session_log_id]!.push(ex)
  }

  // Build weekly stats (last 8 weeks)
  const weeklyStats: Array<{ label: string; gym: number; football: number }> = []
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7) - w * 7)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const weekLogs = allLogs.filter((l) => {
      const d = new Date(l.completed_at)
      return d >= weekStart && d < weekEnd
    })

    const label = weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    weeklyStats.push({
      label,
      gym: weekLogs.filter((l) => l.plan_type === 'gym').length,
      football: weekLogs.filter((l) => l.plan_type === 'football').length,
    })
  }

  const totalGym = allLogs.filter((l) => l.plan_type === 'gym').length
  const totalFootball = allLogs.filter((l) => l.plan_type === 'football').length

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--primary)' }}>
          📊 Progress
        </p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Training History</h1>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total sessions', value: allLogs.length, color: 'var(--foreground)' },
          { label: 'Gym', value: totalGym, color: 'var(--gym-accent)' },
          { label: 'Football', value: totalFootball, color: 'var(--football-accent)' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-wide mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Calendar heatmap */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
          12-Week Calendar
        </h2>
        <CalendarHeatmap logs={allLogs.map((l) => ({ date: l.completed_at, type: l.plan_type as 'gym' | 'football' }))} />
      </div>

      {/* Weekly bar chart */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Sessions Per Week
        </h2>
        <WeeklyBarChart weeks={weeklyStats} />
      </div>

      {/* Recent sessions list */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Recent Sessions
        </h2>
        <div className="space-y-2">
          {[...allLogs].reverse().slice(0, 15).map((log, i) => {
            const exercises = exercisesBySession[log.id] ?? []
            const gymColor = 'var(--gym-accent)'
            const footballColor = 'var(--football-accent)'
            const accentColor = log.plan_type === 'gym' ? gymColor : footballColor
            return (
              <div
                key={i}
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{log.session_name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      Wk {log.week_number} ·{' '}
                      {new Date(log.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', weekday: 'short' })}
                    </p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{
                      background: log.plan_type === 'gym' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                      color: accentColor,
                    }}
                  >
                    {log.plan_type === 'gym' ? '🏋️' : '⚽'} {exercises.length > 0 ? `${exercises.length} ex` : ''}
                  </span>
                </div>
                {exercises.length > 0 && (
                  <div className="px-4 pb-3 pt-2 space-y-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    {exercises.map((ex, j) => (
                      <div key={j}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium leading-tight" style={{ color: 'var(--foreground)' }}>{ex.exercise_name}</p>
                          <div className="flex gap-1 flex-wrap justify-end shrink-0">
                            {ex.sets != null && ex.reps != null && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded-md" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                                {ex.sets}×{ex.reps}
                              </span>
                            )}
                            {ex.weight != null && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded-md font-semibold" style={{ background: log.plan_type === 'gym' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: accentColor }}>
                                {ex.weight}kg
                              </span>
                            )}
                            {ex.rpe != null && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded-md" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                                RPE {ex.rpe}
                              </span>
                            )}
                          </div>
                        </div>
                        {ex.notes && (
                          <p className="text-[11px] mt-0.5 italic" style={{ color: 'var(--muted-foreground)' }}>
                            {ex.notes}
                          </p>
                        )}
                      </div>
                    ))}
                    {log.overall_notes && (
                      <p className="text-xs pt-2 border-t italic" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                        Session: {log.overall_notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {allLogs.length === 0 && (
            <p className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
              No sessions logged yet. Start your first session!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
