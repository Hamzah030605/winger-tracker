import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DEVOPS_TOPICS, getTopicBySlug } from '@/lib/devops'
import { calculateStreak } from '@/lib/utils'
import Link from 'next/link'

export default async function DevOpsProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const eightyFourDaysAgo = new Date()
  eightyFourDaysAgo.setDate(eightyFourDaysAgo.getDate() - 84)

  const [{ data: logs }, { data: topicRows }] = await Promise.all([
    supabase
      .from('devops_logs')
      .select('logged_at, topic_slug, duration_minutes, notes')
      .eq('user_id', user.id)
      .gte('logged_at', eightyFourDaysAgo.toISOString())
      .order('logged_at', { ascending: true }),
    supabase
      .from('devops_topics')
      .select('topic_slug, confidence, completed_modules')
      .eq('user_id', user.id),
  ])

  const allLogs = logs ?? []
  const streak = calculateStreak(allLogs.map((l) => l.logged_at))
  const totalMins = allLogs.reduce((sum, l) => sum + l.duration_minutes, 0)
  const uniqueTopics = new Set(allLogs.map((l) => l.topic_slug)).size

  // Weekly stats (last 8 weeks)
  const weeklyStats: Array<{ label: string; mins: number; sessions: number }> = []
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7) - w * 7)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const weekLogs = allLogs.filter((l) => {
      const d = new Date(l.logged_at)
      return d >= weekStart && d < weekEnd
    })

    weeklyStats.push({
      label: weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      mins: weekLogs.reduce((sum, l) => sum + l.duration_minutes, 0),
      sessions: weekLogs.length,
    })
  }

  const maxMins = Math.max(...weeklyStats.map((w) => w.mins), 1)

  // Topics with progress
  const topicMap = new Map((topicRows ?? []).map((r) => [r.topic_slug, r]))
  const topicsInProgress = DEVOPS_TOPICS.filter((t) => {
    const row = topicMap.get(t.slug)
    return row && (row.completed_modules > 0 || row.confidence > 0)
  })

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/devops" className="text-xs mb-3 flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
          ← DevOps
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--devops-accent, #3b82f6)' }}>
          Progress
        </p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Study History</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total sessions', value: allLogs.length, color: 'var(--devops-accent, #3b82f6)' },
          { label: 'Total minutes', value: totalMins, color: 'var(--football-accent)' },
          { label: 'Day streak', value: streak, color: 'var(--streak-gold)' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-wide mt-1" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly bar chart */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Minutes per week
        </h2>
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-end gap-1.5 h-28">
            {weeklyStats.map((week, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end" style={{ height: '88px' }}>
                  <div
                    className="w-full rounded-t-sm transition-all"
                    style={{
                      height: `${Math.max((week.mins / maxMins) * 88, week.mins > 0 ? 4 : 0)}px`,
                      background: week.mins > 0 ? 'var(--devops-accent, #3b82f6)' : 'var(--border)',
                    }}
                  />
                </div>
                <span className="text-[9px] leading-tight text-center" style={{ color: 'var(--muted-foreground)' }}>
                  {week.label.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>8 weeks ago</span>
            <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>This week</span>
          </div>
        </div>
      </div>

      {/* Topics in progress */}
      {topicsInProgress.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
            Topics in progress
          </h2>
          <div className="space-y-2">
            {topicsInProgress.map((topic) => {
              const row = topicMap.get(topic.slug)!
              const pct = Math.round((row.completed_modules / topic.totalModules) * 100)
              return (
                <Link
                  key={topic.slug}
                  href={`/devops/topics/${topic.slug}`}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{topic.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--devops-accent, #3b82f6)' }} />
                      </div>
                      <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                        {row.completed_modules}/{topic.totalModules}
                      </span>
                    </div>
                  </div>
                  {row.confidence > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--devops-accent, #3b82f6)' }}>
                      {row.confidence}/5
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Recent sessions
        </h2>
        <div className="space-y-2">
          {[...allLogs].reverse().slice(0, 15).map((log, i) => {
            const topic = getTopicBySlug(log.topic_slug)
            return (
              <div
                key={i}
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                    {topic?.name ?? log.topic_slug}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {new Date(log.logged_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    {log.notes && ` · ${log.notes.slice(0, 40)}${log.notes.length > 40 ? '…' : ''}`}
                  </p>
                </div>
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--devops-accent, #3b82f6)' }}
                >
                  {log.duration_minutes}m
                </span>
              </div>
            )
          })}
          {allLogs.length === 0 && (
            <p className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
              No sessions logged yet. Use the Daily page to log your first one.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
