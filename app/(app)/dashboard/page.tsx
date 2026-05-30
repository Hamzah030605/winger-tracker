import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDayOfWeek } from '@/lib/utils'
import { getTodaySessions, GYM_PLAN } from '@/lib/plans'
import { seedHabitsIfMissing, CATEGORY_META, type HabitCategory } from '@/lib/habits'
import { TodaySessionCard } from '@/components/dashboard/today-session-card'
import { AdvanceWeekButton } from '@/components/dashboard/advance-week-button'
import { QuickHabits } from '@/components/dashboard/quick-habits'

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

  const [{ data: profile }, { data: recentLogs }, { data: habits }, { data: todayLogs }] =
    await Promise.all([
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
    ])

  const currentWeek = profile?.current_week ?? 1
  const today = getDayOfWeek()
  const { gym: gymSession, football: footballSession } = getTodaySessions(today)

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

  // Pick top 5 incomplete habits to show (deen first, then in order)
  const habitsWithLog = activeHabits.map((h) => ({ ...h, logged_today: loggedIds.has(h.id) }))
  const incomplete = habitsWithLog.filter((h) => !h.logged_today).slice(0, 4)
  const quickHabits = incomplete.length > 0
    ? incomplete
    : habitsWithLog.slice(0, 4)

  const gymPhase = GYM_PLAN.weeklyProgressions.find((p) => {
    const [start, end] = p.weekRange.split('-').map(Number)
    return currentWeek >= start && currentWeek <= end
  })

  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  // Habit ring circle
  const r = 28
  const circ = 2 * Math.PI * r
  const dashOffset = circ - (circ * habitPct) / 100

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            {greeting()}
          </p>
          <h1 className="text-2xl font-bold mt-0.5" style={{ color: 'var(--foreground)' }}>
            {profile?.name ?? 'Winger'}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{dateLabel}</p>
          {gymPhase && (
            <p className="text-xs mt-1 font-medium" style={{ color: 'var(--primary)' }}>
              Week {currentWeek} · {gymPhase.label}
            </p>
          )}
        </div>

        {/* Habit ring */}
        <div className="flex flex-col items-center">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r={r} fill="none" stroke="var(--secondary)" strokeWidth="6" />
            <circle
              cx="36"
              cy="36"
              r={r}
              fill="none"
              stroke={habitPct === 100 ? '#10b981' : 'var(--primary)'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
            <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--foreground)">
              {habitPct}%
            </text>
          </svg>
          <p className="text-[10px] mt-0.5 font-medium uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
            Habits
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Habits done', value: doneCount, suffix: `/${totalCount}`, color: habitPct === 100 ? '#10b981' : 'var(--primary)' },
          { label: 'Sessions wk', value: thisWeekLogs.length, suffix: '', color: 'var(--football-accent)' },
          { label: 'Programme', value: currentWeek, suffix: `/${GYM_PLAN.totalWeeks}`, color: 'var(--gym-accent)' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-3 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="text-xl font-bold" style={{ color: stat.color }}>
              {stat.value}
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{stat.suffix}</span>
            </p>
            <p className="text-[10px] mt-0.5 uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Quick habits */}
      {totalCount > 0 && (
        <QuickHabits
          habits={quickHabits}
          todayStr={todayStr}
          userId={user.id}
          doneCount={doneCount}
          totalCount={totalCount}
        />
      )}

      {/* Today's training */}
      <div>
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
          Today&apos;s Training
        </h2>
        {!gymSession && !footballSession ? (
          <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-lg mb-1">🧘</p>
            <p className="font-medium" style={{ color: 'var(--foreground)' }}>Rest Day</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Recovery is part of the programme.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
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

      {/* Advance week */}
      <AdvanceWeekButton currentWeek={currentWeek} maxWeek={GYM_PLAN.totalWeeks} />
    </div>
  )
}
