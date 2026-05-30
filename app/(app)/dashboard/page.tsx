import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDayOfWeek, calculateStreak } from '@/lib/utils'
import { getTodaySessions, GYM_PLAN, FOOTBALL_PLAN } from '@/lib/plans'
import { TodaySessionCard } from '@/components/dashboard/today-session-card'
import { StreakCard } from '@/components/dashboard/streak-card'
import { WeekProgressRing } from '@/components/dashboard/week-progress-ring'
import { AdvanceWeekButton } from '@/components/dashboard/advance-week-button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: recentLogs }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase
      .from('session_logs')
      .select('completed_at, plan_type, session_name')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(60),
  ])

  const currentWeek = profile?.current_week ?? 1
  const today = getDayOfWeek()
  const { gym: gymSession, football: footballSession } = getTodaySessions(today)
  const streak = calculateStreak((recentLogs ?? []).map((l) => l.completed_at))

  // Count completions this week for each session type
  const thisWeekStart = new Date()
  thisWeekStart.setDate(thisWeekStart.getDate() - ((thisWeekStart.getDay() + 6) % 7))
  thisWeekStart.setHours(0, 0, 0, 0)

  const thisWeekLogs = (recentLogs ?? []).filter(
    (l) => new Date(l.completed_at) >= thisWeekStart
  )
  const gymDone = thisWeekLogs.filter((l) => l.plan_type === 'gym').length
  const footballDone = thisWeekLogs.filter((l) => l.plan_type === 'football').length

  const gymPhase = GYM_PLAN.weeklyProgressions.find((p) => {
    const [start, end] = p.weekRange.split('-').map(Number)
    return currentWeek >= start && currentWeek <= end
  })

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            {today}
          </p>
          <h1 className="text-2xl font-bold mt-0.5" style={{ color: 'var(--foreground)' }}>
            Week {currentWeek} of {GYM_PLAN.totalWeeks}
          </h1>
          {gymPhase && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--primary)' }}>
              {gymPhase.label}
            </p>
          )}
        </div>
        <div className="text-right">
          <StreakCard streak={streak} />
        </div>
      </div>

      {/* Week progress */}
      <div className="grid grid-cols-2 gap-3">
        <WeekProgressRing
          label="Gym sessions"
          done={gymDone}
          total={5}
          color="var(--gym-accent)"
        />
        <WeekProgressRing
          label="Football sessions"
          done={footballDone}
          total={4}
          color="var(--football-accent)"
        />
      </div>

      {/* Today's sessions */}
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

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Gym done', value: gymDone, suffix: '/5' },
          { label: 'Football done', value: footballDone, suffix: '/4' },
          { label: 'Total sessions', value: (recentLogs ?? []).length, suffix: '' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-3 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
              {stat.value}<span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{stat.suffix}</span>
            </p>
            <p className="text-[10px] mt-0.5 uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
