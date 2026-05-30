import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DAILY_TASKS } from '@/lib/devops'
import { DailyChecklist } from '@/components/devops/daily-checklist'
import { LogSessionForm } from '@/components/devops/log-session-form'
import Link from 'next/link'

export default async function DailyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const { data: completedTasks } = await supabase
    .from('devops_tasks')
    .select('task_key')
    .eq('user_id', user.id)
    .eq('task_date', todayStr)

  const completedKeys = (completedTasks ?? []).map((t) => t.task_key)

  const dayLabel = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/devops" className="text-xs mb-3 flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
          ← DevOps
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--devops-accent, #3b82f6)' }}>
          {dayLabel}
        </p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Daily Learning</h1>
      </div>

      {/* Checklist */}
      <DailyChecklist tasks={DAILY_TASKS} completedKeys={completedKeys} todayStr={todayStr} />

      {/* Log a session */}
      <LogSessionForm />
    </div>
  )
}
