import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GYM_PLAN } from '@/lib/plans'
import { GymPlanView } from '@/components/plan/gym-plan-view'
import { calculateCurrentWeek, getNextMonday } from '@/lib/utils'

export default async function GymPlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_start_date')
    .eq('user_id', user.id)
    .single()

  const planStartDate = profile?.plan_start_date ?? getNextMonday()
  // Show week 1 as minimum so the plan always renders usefully
  const currentWeek = Math.max(calculateCurrentWeek(planStartDate), 1)

  const { data: logs } = await supabase
    .from('session_logs')
    .select('session_name, completed_at')
    .eq('user_id', user.id)
    .eq('plan_type', 'gym')
    .order('completed_at', { ascending: false })

  const lastCompleted: Record<string, string> = {}
  for (const row of logs ?? []) {
    if (row.session_name && !lastCompleted[row.session_name]) {
      lastCompleted[row.session_name] = row.completed_at
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <GymPlanView plan={GYM_PLAN} currentWeek={currentWeek} lastCompleted={lastCompleted} />
    </div>
  )
}
