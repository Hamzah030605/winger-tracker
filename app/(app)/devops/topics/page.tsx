import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DEVOPS_TOPICS } from '@/lib/devops'
import Link from 'next/link'

const CONFIDENCE_LABELS = ['', 'Beginner', 'Shaky', 'Okay', 'Solid', 'Strong']
const CONFIDENCE_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']

export default async function TopicsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: topicRows } = await supabase
    .from('devops_topics')
    .select('topic_slug, confidence, completed_modules')
    .eq('user_id', user.id)

  const topicMap = new Map((topicRows ?? []).map((r) => [r.topic_slug, r]))

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-4">
      <div>
        <Link href="/devops" className="text-xs mb-3 flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
          ← DevOps
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--devops-accent, #3b82f6)' }}>
          All Topics
        </p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Your Roadmap</h1>
      </div>

      <div className="space-y-2">
        {DEVOPS_TOPICS.map((topic) => {
          const row = topicMap.get(topic.slug)
          const done = row?.completed_modules ?? 0
          const conf = row?.confidence ?? 0
          const pct = Math.round((done / topic.totalModules) * 100)
          const started = done > 0 || conf > 0

          return (
            <Link
              key={topic.slug}
              href={`/devops/topics/${topic.slug}`}
              className="block rounded-2xl px-4 py-4"
              style={{
                background: 'var(--card)',
                border: `1px solid ${started ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{topic.name}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                    {topic.description}
                  </p>
                </div>
                {conf > 0 && (
                  <span
                    className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${CONFIDENCE_COLORS[conf]}20`, color: CONFIDENCE_COLORS[conf] }}
                  >
                    {CONFIDENCE_LABELS[conf]}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: 'var(--devops-accent, #3b82f6)' }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: pct === 100 ? 'var(--devops-accent, #3b82f6)' : 'var(--muted-foreground)' }}>
                  {done}/{topic.totalModules}
                  {pct === 100 && ' ✓'}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
