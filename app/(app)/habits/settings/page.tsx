import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { seedHabitsIfMissing } from '@/lib/habits'
import { HabitSettingsForm } from '@/components/habits/habit-settings-form'
import Link from 'next/link'

export default async function HabitsSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await seedHabitsIfMissing(supabase, user.id)

  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--primary)' }}>
            Life OS
          </p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Habit Settings</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Toggle habits on or off for daily tracking</p>
        </div>
        <Link
          href="/habits"
          className="text-xs font-medium px-3 py-2 rounded-xl"
          style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
        >
          ← Back
        </Link>
      </div>

      <HabitSettingsForm habits={habits ?? []} />
    </div>
  )
}
