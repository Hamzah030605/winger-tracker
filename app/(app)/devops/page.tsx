import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DEVOPS_TOPICS, getTotalModules } from '@/lib/devops'
import { calculateStreak } from '@/lib/utils'
import Link from 'next/link'

export default async function DevOpsDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [{ data: topicRows }, { data: recentLogs }] = await Promise.all([
    supabase.from('devops_topics').select('*').eq('user_id', user.id),
    supabase
      .from('devops_logs')
      .select('logged_at, topic_slug, duration_minutes')
      .eq('user_id', user.id)
      .gte('logged_at', thirtyDaysAgo.toISOString())
      .order('logged_at', { ascending: false }),
  ])

  const topicMap = new Map((topicRows ?? []).map((r) => [r.topic_slug, r]))
  const streak = calculateStreak((recentLogs ?? []).map((l) => l.logged_at))
  const totalMins = (recentLogs ?? []).reduce((sum, l) => sum + l.duration_minutes, 0)
  const topicsStarted = (topicRows ?? []).filter((r) => r.completed_modules > 0 || r.confidence > 0).length
  const totalDone = (topicRows ?? []).reduce((sum, r) => sum + r.completed_modules, 0)
  const totalAll = getTotalModules()
  const overallPct = Math.round((totalDone / totalAll) * 100)

  const featuredTopics = DEVOPS_TOPICS.slice(0, 5)

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            DevOps
          </p>
          <h1 className="text-2xl font-bold mt-0.5" style={{ color: 'var(--foreground)' }}>
            Learning Tracker
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--devops-accent, #3b82f6)' }}>
            CoderCo · KodeKloud · G-Research
          </p>
        </div>
        <div
          className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl"
          style={{ background: streak > 0 ? 'rgba(251,191,36,0.15)' : 'var(--card)', border: '1px solid var(--border)' }}
        >
          <span className="text-2xl font-bold" style={{ color: streak > 0 ? 'var(--streak-gold)' : 'var(--muted-foreground)' }}>
            {streak}
          </span>
          <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
            day streak
          </span>
        </div>
      </div>

      {/* Overall progress */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Overall progress</p>
          <span className="text-sm font-bold" style={{ color: 'var(--devops-accent, #3b82f6)' }}>{overallPct}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${overallPct}%`, background: 'var(--devops-accent, #3b82f6)' }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
          {totalDone} of {totalAll} modules done across {DEVOPS_TOPICS.length} topics
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Topics started', value: topicsStarted, color: 'var(--devops-accent, #3b82f6)' },
          { label: 'Mins studied (30d)', value: totalMins, color: 'var(--football-accent)' },
          { label: 'Day streak', value: streak, color: 'var(--streak-gold)' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-wide mt-1" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/devops/daily', label: 'Daily\nChecklist', icon: '✅' },
          { href: '/devops/topics', label: 'All\nTopics', icon: '📚' },
          { href: '/devops/progress', label: 'Weekly\nProgress', icon: '📈' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl p-4 flex flex-col items-center gap-2 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-semibold whitespace-pre-line" style={{ color: 'var(--foreground)' }}>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Topic snapshot */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            Topics
          </h2>
          <Link href="/devops/topics" className="text-xs font-semibold" style={{ color: 'var(--devops-accent, #3b82f6)' }}>
            See all →
          </Link>
        </div>
        <div className="space-y-2">
          {featuredTopics.map((topic) => {
            const row = topicMap.get(topic.slug)
            const done = row?.completed_modules ?? 0
            const pct = Math.round((done / topic.totalModules) * 100)
            const conf = row?.confidence ?? 0
            return (
              <Link
                key={topic.slug}
                href={`/devops/topics/${topic.slug}`}
                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>{topic.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--devops-accent, #3b82f6)' }} />
                    </div>
                    <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{done}/{topic.totalModules}</span>
                  </div>
                </div>
                {conf > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--devops-accent, #3b82f6)' }}>
                    {conf}/5
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
