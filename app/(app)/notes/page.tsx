import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotesClient } from '@/components/notes/notes-client'

function getToday(): string {
  return new Date().toLocaleDateString('sv-SE')
}

function formatTodayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = getToday()
  const todayLabel = formatTodayLabel(today)

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
          Planning
        </p>
        <h1 className="text-2xl font-bold mt-0.5" style={{ color: 'var(--foreground)' }}>
          Notes
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--primary)' }}>
          Plan · Focus · Execute
        </p>
      </div>

      <NotesClient
        userId={user.id}
        today={today}
        todayLabel={todayLabel}
        existing={existing ?? null}
        pastNotes={pastRows ?? []}
      />
    </div>
  )
}
