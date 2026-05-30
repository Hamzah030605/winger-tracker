import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FOOTBALL_PLAN } from '@/lib/plans'
import { FootballPlanView } from '@/components/plan/football-plan-view'
import { calculateCurrentWeek, getNextMonday } from '@/lib/utils'

export default async function FootballPlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_start_date')
    .eq('user_id', user.id)
    .single()

  const planStartDate = profile?.plan_start_date ?? getNextMonday()
  const currentWeek = Math.max(calculateCurrentWeek(planStartDate), 1)

  return (
    <div className="max-w-lg mx-auto">
      <FootballPlanView plan={FOOTBALL_PLAN} currentWeek={currentWeek} />
    </div>
  )
}
