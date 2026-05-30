import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calculateCurrentWeek, isPreStart, getNextMonday } from '@/lib/utils'
import { getTodaySessions, GYM_PLAN } from '@/lib/plans'
import { seedHabitsIfMissing } from '@/lib/habits'
import { calculatePlacementScore } from '@/lib/devops'
import { TodaySessionCard } from '@/components/dashboard/today-session-card'
import { AdvanceWeekButton } from '@/components/dashboard/advance-week-button'
import { MissionCard } from '@/components/dashboard/mission-card'
import { DevOpsWidget } from '@/components/dashboard/devops-widget'
import { LifeScoreCard } from '@/components/dashboard/life-score-card'
import Link from 'next/link'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getTodayName(): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    new Date().getDay()
  ]!
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await seedHabitsIfMissing(supabase, user.id)

  const todayStr = new Date().toLocaleDateString('sv-SE')

  // Monday of this calendar week
  const thisWeekStart = new Date()
  thisWeekStart.setDate(thisWeekStart.getDate() - ((thisWeekStart.getDay() + 6) % 7))
  thisWeekStart.setHours(0, 0, 0, 0)

  const [
    { data: profile },
    { data: habits },
    { data: todayLogs },
    { data: weekSessionLogs },
    { data: devopsTopics },
    { data: devopsLastLog },
    { data: weekDevopsLogs },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
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
      .from('session_logs')
      .select('completed_at, plan_type, session_name')
      .eq('user_id', user.id)
      .gte('completed_at', thisWeekStart.toISOString())
      .order('completed_at', { ascending: false }),
    supabase
      .from('devops_topics')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('devops_logs')
      .select('logged_at')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(1),
    supabase
      .from('devops_logs')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .gte('logged_at', thisWeekStart.toISOString()),
  ])

  // ── Week calculation ──────────────────────────────────────────────────────
  const planStartDate = profile?.plan_start_date ?? getNextMonday()
  const preStart = isPreStart(planStartDate)
  const currentWeek = preStart ? 0 : calculateCurrentWeek(planStartDate)

  const today = getTodayName()
  const { gym: gymSession, football: footballSession } = preStart
    ? { gym: null, football: null }
    : getTodaySessions(today)

  const hasFootballToday = !!footballSession

  // ── Habits ────────────────────────────────────────────────────────────────
  const activeHabits = habits ?? []
  const loggedIds = new Set((todayLogs ?? []).map((l) => l.habit_id))
  const doneCount = activeHabits.filter((h) => loggedIds.has(h.id)).length
  const totalCount = activeHabits.length
  const habitPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  const habitsWithLog = activeHabits.map((h) => ({ ...h, logged_today: loggedIds.has(h.id) }))

  // ── Session counts ────────────────────────────────────────────────────────
  const thisWeekLogs = weekSessionLogs ?? []
  const gymSessionsThisWeek = thisWeekLogs.filter((l) => l.plan_type === 'gym').length
  const footballSessionsThisWeek = thisWeekLogs.filter((l) => l.plan_type === 'football').length

  // ── Life Score components ─────────────────────────────────────────────────
  const habitScore = habitPct

  const gymScore = Math.min(Math.round((gymSessionsThisWeek / 5) * 100), 100)

  const footballScore = Math.min(Math.round((footballSessionsThisWeek / 3) * 100), 100)

  const devopsMinsThisWeek = (weekDevopsLogs ?? []).reduce(
    (sum, l) => sum + (l.duration_minutes ?? 0), 0
  )
  const devopsScore = Math.min(Math.round((devopsMinsThisWeek / 300) * 100), 100)

  const arabicHabit = activeHabits.find((h) => h.name === 'Arabic Study')
  const arabicScore = arabicHabit && loggedIds.has(arabicHabit.id) ? 100 : 0

  // ── Programme phase ───────────────────────────────────────────────────────
  const gymPhase = currentWeek > 0
    ? GYM_PLAN.weeklyProgressions.find((p) => {
        const [start, end] = p.weekRange.split('-').map(Number)
        return currentWeek >= start && currentWeek <= end
      })
    : undefined

  // ── DevOps ────────────────────────────────────────────────────────────────
  const currentDevOpsTopic = (devopsTopics ?? [])[0] ?? null
  const lastDevOpsStudied = (devopsLastLog ?? [])[0]?.logged_at ?? null
  const placementScore = calculatePlacementScore(devopsTopics ?? [])

  // ── UI ────────────────────────────────────────────────────────────────────
  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const r = 30
  const circ = 2 * Math.PI * r
  const dashOffset = circ - (circ * habitPct) / 100
  const ringColor = habitPct === 100 ? '#10b981' : habitPct > 50 ? '#f59e0b' : 'var(--primary)'

  const planStartFormatted = new Date(planStartDate + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="px-4 pt-5 pb-6 max-w-lg mx-auto space-y-3">

      {/* ── 1. Greeting + Habit Ring ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--muted-foreground)' }}>
            {greeting()}
          </p>
          <h1 className="text-[22px] font-bold leading-tight mt-0.5" style={{ color: 'var(--foreground)' }}>
            {profile?.name ?? 'Winger'}
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{dateLabel}</p>
          {preStart ? (
            <p className="text-[11px] mt-1 font-semibold" style={{ color: 'var(--muted-foreground)' }}>
              Pre-start · Setup phase
            </p>
          ) : gymPhase ? (
            <p className="text-[11px] mt-1 font-semibold" style={{ color: 'var(--primary)' }}>
              Week {currentWeek} · {gymPhase.label}
            </p>
          ) : null}
        </div>

        {/* ── 2. Habit Ring ── */}
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

      {/* Pre-start banner */}
      {preStart && (
        <div
          className="rounded-2xl px-4 py-4 flex items-center gap-3"
          style={{
            background: 'linear-gradient(135deg, #16161a 0%, #1e1a2e 100%)',
            border: '1px solid rgba(255,77,28,0.3)',
          }}
        >
          <span className="text-2xl flex-shrink-0">📅</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
              Programme starts {planStartFormatted}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Use this time to set up habits, review the plan, and prepare your kit.
            </p>
          </div>
        </div>
      )}

      {/* ── 3. Today's Mission ── */}
      {totalCount > 0 && (
        <MissionCard
          habits={habitsWithLog}
          todayStr={todayStr}
          userId={user.id}
          hasFootballToday={hasFootballToday}
        />
      )}

      {/* ── 4. Life Score ── */}
      <LifeScoreCard
        habitScore={habitScore}
        gymScore={gymScore}
        footballScore={footballScore}
        devopsScore={devopsScore}
        arabicScore={arabicScore}
        preStart={preStart}
      />

      {/* ── 5. Today's Training ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2 px-0.5" style={{ color: 'var(--muted-foreground)' }}>
          Today&apos;s Training
        </p>
        {preStart ? (
          <div
            className="rounded-2xl px-4 py-4 flex items-center gap-3"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <span className="text-xl">📋</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                Programme starts {planStartFormatted}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Week 1 sessions unlock on Monday.
              </p>
            </div>
          </div>
        ) : !gymSession && !footballSession ? (
          <div
            className="rounded-2xl px-4 py-4 flex items-center gap-3"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <span className="text-xl">���</span>
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
                  (l) =>
                    l.plan_type === 'gym' &&
                    l.session_name === gymSession.name &&
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
                  (l) =>
                    l.plan_type === 'football' &&
                    l.session_name === footballSession.name &&
                    new Date(l.completed_at).toDateString() === new Date().toDateString()
                )}
              />
            )}
          </div>
        )}
      </div>

      {/* ── 6. DevOps Focus ── */}
      <DevOpsWidget topicRow={currentDevOpsTopic} lastStudied={lastDevOpsStudied} placementScore={placementScore} />

      {/* ── 7. Focus Session widget (placeholder until /focus is built) ── */}
      <Link
        href="/focus"
        className="rounded-2xl px-4 py-4 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #16161a 0%, #16201a 100%)',
          border: '1px solid rgba(16,185,129,0.2)',
          display: 'flex',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">⏱</span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: '#10b981' }}>
              Focus Session
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              25 min deep work · Pomodoro timer
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
          Start →
        </span>
      </Link>

      {/* ── 8. Quick Progress Cards ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Habits', value: doneCount, suffix: `/${totalCount}`, color: ringColor },
          { label: 'Gym this wk', value: gymSessionsThisWeek, suffix: preStart ? '' : '/5', color: 'var(--gym-accent)' },
          {
            label: preStart ? 'Pre-start' : `Week ${currentWeek}`,
            value: preStart ? '–' : `Wk ${currentWeek}`,
            suffix: '',
            color: preStart ? 'var(--muted-foreground)' : 'var(--primary)',
          },
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

      {!preStart && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Football this wk', value: footballSessionsThisWeek, total: 3, color: 'var(--football-accent)' },
            { label: 'DevOps mins', value: devopsMinsThisWeek, total: 300, color: 'var(--devops-accent)' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-3 text-center"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <p className="text-lg font-bold leading-tight" style={{ color: s.color }}>
                {s.value}
                <span className="text-[10px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  /{s.total}
                </span>
              </p>
              <p className="text-[9px] mt-0.5 uppercase tracking-wide font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Weekly Review ── */}
      <Link
        href="/review"
        className="rounded-2xl px-4 py-4 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #16161a 0%, #1e1a2e 100%)',
          border: '1px solid rgba(139,92,246,0.25)',
          display: 'flex',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📝</span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: '#8b5cf6' }}>
              Weekly Review
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Reflect on your week · Set next focus
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>
          Review →
        </span>
      </Link>

      {/* ── Programme status ── */}
      <AdvanceWeekButton
        currentWeek={currentWeek}
        maxWeek={GYM_PLAN.totalWeeks}
        planStartDate={planStartDate}
        preStart={preStart}
      />
    </div>
  )
}
