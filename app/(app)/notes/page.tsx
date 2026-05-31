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

  const [{ data: existing }, { data: pastRows }] = await Promise.all([
    supabase
      .from('daily_notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('note_date', today)
      .maybeSingle(),
    supabase
      .from('daily_notes')
      .select('*')
      .eq('user_id', user.id)
      .neq('note_date', today)
      .order('note_date', { ascending: false })
      .limit(14),
  ])

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
          Daily Planning
        </p>
        <h1 className="text-2xl font-bold mt-0.5" style={{ color: 'var(--foreground)' }}>
          Today
        </h1>
      </div>

      <NotesClient
        userId={user.id}
        today={today}
        existing={existing ?? null}
        pastNotes={pastRows ?? []}
      />
    </div>
  )
}
