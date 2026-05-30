import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GYM_PLAN } from '@/lib/plans'
import { GymPlanView } from '@/components/plan/gym-plan-view'

export default async function GymPlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_week')
    .eq('user_id', user.id)
    .single()

  const currentWeek = profile?.current_week ?? 1

  return (
    <div className="max-w-lg mx-auto">
      <GymPlanView plan={GYM_PLAN} currentWeek={currentWeek} />
    </div>
  )
}
