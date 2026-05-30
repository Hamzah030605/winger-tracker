import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getTopicBySlug } from '@/lib/devops'
import { ConfidenceRater } from '@/components/devops/confidence-rater'
import { ModuleCounter } from '@/components/devops/module-counter'
import { NotesEditor } from '@/components/devops/notes-editor'
import Link from 'next/link'

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const topic = getTopicBySlug(slug)
  if (!topic) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: row } = await supabase
    .from('devops_topics')
    .select('*')
    .eq('user_id', user.id)
    .eq('topic_slug', slug)
    .maybeSingle()

  const completedModules = row?.completed_modules ?? 0
  const confidence = row?.confidence ?? 0
  const notes = row?.notes ?? ''

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/devops/topics" className="text-xs mb-3 flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
          ← All Topics
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--devops-accent, #3b82f6)' }}>
          DevOps · {topic.totalModules} modules
        </p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{topic.name}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{topic.description}</p>
      </div>

      {/* Module progress */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--muted-foreground)' }}>
          Module Progress
        </p>
        <ModuleCounter slug={slug} totalModules={topic.totalModules} initialCompleted={completedModules} />
      </div>

      {/* Module list */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Modules
        </p>
        <div className="space-y-2">
          {topic.modules.map((mod, i) => {
            const isDone = i < completedModules
            return (
              <div
                key={i}
                className="flex items-center gap-3 py-2"
                style={{ borderBottom: i < topic.modules.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div
                  className="flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold"
                  style={{
                    borderColor: isDone ? 'var(--devops-accent, #3b82f6)' : 'var(--border)',
                    background: isDone ? 'var(--devops-accent, #3b82f6)' : 'transparent',
                    color: isDone ? 'white' : 'var(--muted-foreground)',
                  }}
                >
                  {isDone ? '✓' : i + 1}
                </div>
                <p
                  className="text-sm"
                  style={{ color: isDone ? 'var(--muted-foreground)' : 'var(--foreground)', textDecoration: isDone ? 'line-through' : 'none' }}
                >
                  {mod}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Confidence */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--muted-foreground)' }}>
          Confidence Rating
        </p>
        <ConfidenceRater slug={slug} initialConfidence={confidence} />
      </div>

      {/* Notes */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Notes
        </p>
        <NotesEditor slug={slug} initialNotes={notes} />
      </div>
    </div>
  )
}
