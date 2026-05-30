import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDayOfWeek } from '@/lib/utils'
import { getTodaySessions, GYM_PLAN } from '@/lib/plans'
import { seedHabitsIfMissing } from '@/lib/habits'
import { TodaySessionCard } from '@/components/dashboard/today-session-card'
import { AdvanceWeekButton } from '@/components/dashboard/advance-week-button'
import { MissionCard } from '@/components/dashboard/mission-card'
import { DevOpsWidget } from '@/components/dashboard/devops-widget'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await seedHabitsIfMissing(supabase, user.id)

  const todayStr = new Date().toLocaleDateString('sv-SE')

  const [
    { data: profile },
    { data: recentLogs },
    { data: habits },
    { data: todayLogs },
    { data: devopsTopics },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase
      .from('session_logs')
      .select('completed_at, plan_type, session_name')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(60),
    supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('user_id', user.id)
      .eq('logged_date', todayStr),
    supabase
      .from('devops_topics')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1),
  ])

  const currentWeek = profile?.current_week ?? 1
  const today = getDayOfWeek()
  const { gym: gymSession, football: footballSession } = getTodaySessions(today)
  const hasFootballToday = !!footballSession

  // Training this week
  const thisWeekStart = new Date()
  thisWeekStart.setDate(thisWeekStart.getDate() - ((thisWeekStart.getDay() + 6) % 7))
  thisWeekStart.setHours(0, 0, 0, 0)
  const thisWeekLogs = (recentLogs ?? []).filter(
    (l) => new Date(l.completed_at) >= thisWeekStart
  )

  // Habits
  const activeHabits = habits ?? []
  const loggedIds = new Set((todayLogs ?? []).map((l) => l.habit_id))
  const doneCount = activeHabits.filter((h) => loggedIds.has(h.id)).length
  const totalCount = activeHabits.length
  const habitPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const habitsWithLog = activeHabits.map((h) => ({ ...h, logged_today: loggedIds.has(h.id) }))

  const gymPhase = GYM_PLAN.weeklyProgressions.find((p) => {
    const [start, end] = p.weekRange.split('-').map(Number)
    return currentWeek >= start && currentWeek <= end
  })

  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const r = 30
  const circ = 2 * Math.PI * r
  const dashOffset = circ - (circ * habitPct) / 100
  const ringColor = habitPct === 100 ? '#10b981' : habitPct > 50 ? '#f59e0b' : 'var(--primary)'

  const currentDevOpsTopic = (devopsTopics ?? [])[0] ?? null

  return (
    <div className="px-4 pt-5 pb-6 max-w-lg mx-auto space-y-3">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--muted-foreground)' }}>
            {greeting()}
          </p>
          <h1 className="text-[22px] font-bold leading-tight mt-0.5" style={{ color: 'var(--foreground)' }}>
            {profile?.name ?? 'Winger'}
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{dateLabel}</p>
          {gymPhase && (
            <p className="text-[11px] mt-1 font-semibold" style={{ color: 'var(--primary)' }}>
              Week {currentWeek} · {gymPhase.label}
            </p>
          )}
        </div>

        {/* Habit ring */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <svg width="68" height="68" viewBox="0 0 76 76">
            <circle cx="38" cy="38" r={r} fill="none" stroke="var(--secondary)" strokeWidth="7" />
            <circle
              cx="38" cy="38" r={r}
              fill="none"
              stroke={ringColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 38 38)"
              style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
            />
            <text x="38" y="43" textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--foreground)">
              {habitPct}%
            </text>
          </svg>
          <p className="text-[9px] mt-0.5 font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            Habits
          </p>
        </div>
      </div>

      {/* ── Today's Mission ── */}
      {totalCount > 0 && (
        <MissionCard
          habits={habitsWithLog}
          todayStr={todayStr}
          userId={user.id}
          hasFootballToday={hasFootballToday}
        />
      )}

      {/* ── DevOps Focus ── */}
      <DevOpsWidget topicRow={currentDevOpsTopic} />

      {/* ── Today's Training ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2 px-0.5" style={{ color: 'var(--muted-foreground)' }}>
          Today&apos;s Training
        </p>
        {!gymSession && !footballSession ? (
          <div
            className="rounded-2xl px-4 py-4 flex items-center gap-3"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <span className="text-xl">🧘</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Rest Day</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Recovery is part of the programme.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {gymSession && (
              <TodaySessionCard
                session={gymSession}
                planType="gym"
                week={currentWeek}
                completedToday={thisWeekLogs.some(
                  (l) => l.plan_type === 'gym' && l.session_name === gymSession.name &&
                    new Date(l.completed_at).toDateString() === new Date().toDateString()
                )}
              />
            )}
            {footballSession && (
              <TodaySessionCard
                session={footballSession}
                planType="football"
                week={currentWeek}
                completedToday={thisWeekLogs.some(
                  (l) => l.plan_type === 'football' && l.session_name === footballSession.name &&
                    new Date(l.completed_at).toDateString() === new Date().toDateString()
                )}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Habits', value: doneCount, suffix: `/${totalCount}`, color: ringColor },
          { label: 'Sessions', value: thisWeekLogs.length, suffix: ' this wk', color: 'var(--football-accent)' },
          { label: 'Programme', value: `Wk ${currentWeek}`, suffix: '', color: 'var(--gym-accent)' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-3 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="text-lg font-bold leading-tight" style={{ color: stat.color }}>
              {stat.value}
              {stat.suffix && (
                <span className="text-[10px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  {stat.suffix}
                </span>
              )}
            </p>
            <p className="text-[9px] mt-0.5 uppercase tracking-wide font-semibold" style={{ color: 'var(--muted-foreground)' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Advance week (secondary) ── */}
      <AdvanceWeekButton currentWeek={currentWeek} maxWeek={GYM_PLAN.totalWeeks} />
    </div>
  )
}
