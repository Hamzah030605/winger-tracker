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
    return <GymSessionLogger session={session} week={week} userId={user.id} />
  }

  const session = getFootballSessionById(sessionSlug)
  if (!session) notFound()
  return <FootballSessionLogger session={session} week={week} userId={user.id} />
}
