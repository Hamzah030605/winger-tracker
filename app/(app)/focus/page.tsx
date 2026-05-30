import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PomodoroTimer } from '@/components/focus/pomodoro-timer'
import type { FocusSession } from '@/types/database'

export default async function FocusPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const todayStr = new Date().toLocaleDateString('sv-SE')

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)

  const [{ data: todaySessions }, { data: weekSessions }] = await Promise.all([
    supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', `${todayStr}T00:00:00`)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false }),
    supabase
      .from('focus_sessions')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .gte('started_at', weekStart.toISOString())
      .not('completed_at', 'is', null),
  ])

  const weeklyMinutes = (weekSessions ?? []).reduce(
    (sum, s) => sum + (s.duration_minutes ?? 0), 0
  )

  return (
    <div className="px-4 pt-5 pb-6 max-w-lg mx-auto space-y-4">

      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--muted-foreground)' }}>
          Focus
        </p>
        <h1 className="text-[22px] font-bold leading-tight mt-0.5" style={{ color: 'var(--foreground)' }}>
          Pomodoro Timer
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          25 min focus · 5 min break · background-accurate
        </p>
      </div>

      <PomodoroTimer
        userId={user.id}
        todaySessions={(todaySessions ?? []) as FocusSession[]}
        weeklyMinutes={weeklyMinutes}
      />
    </div>
  )
}
