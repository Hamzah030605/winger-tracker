import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { parseSessionId } from '@/lib/utils'
import { getGymSessionBySlug, getFootballSessionById } from '@/lib/plans'
import { GymSessionLogger } from '@/components/session/gym-session-logger'
import { FootballSessionLogger } from '@/components/session/football-session-logger'

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = parseSessionId(id)
  if (!parsed) notFound()

  const { planType, week, sessionSlug } = parsed

  if (planType === 'gym') {
    const session = getGymSessionBySlug(sessionSlug)
    if (!session) notFound()

    // Fetch most recent exercise logs for this session so the logger can pre-fill them
    const { data: prevSession } = await supabase
      .from('session_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('session_name', session.name)
      .eq('plan_type', 'gym')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    type PrevLog = { sets: number | null; reps: number | null; weight: number | null; rpe: number | null; notes: string | null }
    const previousLogs: Record<string, PrevLog> = {}

    if (prevSession) {
      const { data: prevExercises } = await supabase
        .from('exercise_logs')
        .select('exercise_name, sets, reps, weight, rpe, notes')
        .eq('session_log_id', prevSession.id)
      for (const ex of prevExercises ?? []) {
        previousLogs[ex.exercise_name] = { sets: ex.sets, reps: ex.reps, weight: ex.weight, rpe: ex.rpe, notes: ex.notes }
      }
    }

    return <GymSessionLogger session={session} week={week} userId={user.id} previousLogs={previousLogs} />
  }

  const session = getFootballSessionById(sessionSlug)
  if (!session) notFound()
  return <FootballSessionLogger session={session} week={week} userId={user.id} />
}
