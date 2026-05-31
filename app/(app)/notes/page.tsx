import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotesClient } from '@/components/notes/notes-client'

function getToday(): string {
  return new Date().toLocaleDateString('sv-SE')
}

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = getToday()

  const [{ data: existing }, { data: pastRows }, { data: topicRows }, { data: profile }] = await Promise.all([
    supabase.from('daily_notes').select('*').eq('user_id', user.id).eq('note_date', today).maybeSingle(),
    supabase.from('daily_notes').select('*').eq('user_id', user.id).neq('note_date', today).order('note_date', { ascending: false }).limit(60),
    supabase.from('devops_topics').select('topic_slug, confidence, completed_modules').eq('user_id', user.id),
    supabase.from('profiles').select('plan_start_date').eq('user_id', user.id).maybeSingle(),
  ])

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--muted-foreground)' }}>
          Daily Planning
        </p>
        <h1 className="text-xl font-bold mt-0.5" style={{ color: 'var(--foreground)' }}>
          {new Date(today + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h1>
      </div>

      <NotesClient
        userId={user.id}
        today={today}
        existing={existing ?? null}
        pastNotes={pastRows ?? []}
        topicRows={topicRows ?? []}
        planStartDate={profile?.plan_start_date ?? today}
      />
    </div>
  )
}
