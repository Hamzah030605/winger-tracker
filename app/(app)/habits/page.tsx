import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { seedHabitsIfMissing } from '@/lib/habits'
import { HabitChecklist } from '@/components/habits/habit-checklist'
import Link from 'next/link'
import type { Habit } from '@/types/database'

export default async function HabitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await seedHabitsIfMissing(supabase, user.id)

  const todayStr = new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD

  const [{ data: habits }, { data: logs }] = await Promise.all([
    supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('user_id', user.id)
      .eq('logged_date', todayStr),
  ])

  const loggedIds = new Set((logs ?? []).map((l) => l.habit_id))
  const habitsWithLog = (habits ?? [] as Habit[]).map((h) => ({
    ...h,
    logged_today: loggedIds.has(h.id),
  }))

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--primary)' }}>
            Life OS
          </p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Habits</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{today}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/habits/history"
            className="text-xs font-medium px-3 py-2 rounded-xl"
            style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
          >
            History
          </Link>
          <Link
            href="/habits/settings"
            className="text-xs font-medium px-3 py-2 rounded-xl"
            style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
          >
            Settings
          </Link>
        </div>
      </div>

      <HabitChecklist habits={habitsWithLog} todayStr={todayStr} userId={user.id} />
    </div>
  )
}
