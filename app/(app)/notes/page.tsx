import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotesClient } from '@/components/notes/notes-client'
import type { NoteTask } from '@/types/database'

export const dynamic = 'force-dynamic'

function getToday(): string {
  return new Date().toLocaleDateString('sv-SE')
}

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = getToday()
  const todayLabel = new Date(today + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const [{ data: existing }, { data: pastRows }, { data: topicRows }, { data: profile }] = await Promise.all([
    supabase.from('daily_notes').select('*').eq('user_id', user.id).eq('note_date', today).maybeSingle(),
    supabase.from('daily_notes').select('*').eq('user_id', user.id).neq('note_date', today).order('note_date', { ascending: false }).limit(60),
    supabase.from('devops_topics').select('topic_slug, confidence, completed_modules').eq('user_id', user.id),
    supabase.from('profiles').select('plan_start_date').eq('user_id', user.id).maybeSingle(),
  ])

  // Roll incomplete tasks forward from the most recent past note when today has no note yet
  let rolledOverTasks: NoteTask[] = []
  if (!existing && pastRows && pastRows.length > 0) {
    const recentTasks = (pastRows[0].tasks as NoteTask[] | null) ?? []
    rolledOverTasks = recentTasks
      .filter(t => !t.done)
      .map(t => ({
        id: Math.random().toString(36).slice(2, 10),
        text: t.text,
        done: false,
        priority: t.priority,
        rolledOver: true,
      }))
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-3">
      <div className="flex items-baseline gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--muted-foreground)' }}>
          Daily Planning
        </p>
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>·</span>
        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{todayLabel}</p>
      </div>

      <NotesClient
        userId={user.id}
        today={today}
        existing={existing ?? null}
        pastNotes={pastRows ?? []}
        topicRows={topicRows ?? []}
        planStartDate={profile?.plan_start_date ?? today}
        rolledOverTasks={rolledOverTasks}
      />
    </div>
  )
}
