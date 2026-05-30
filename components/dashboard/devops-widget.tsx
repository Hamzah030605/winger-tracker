import Link from 'next/link'
import { getTopicBySlug } from '@/lib/devops'
import type { DevOpsTopicRow } from '@/types/database'

export function DevOpsWidget({ topicRow }: { topicRow: DevOpsTopicRow | null }) {
  if (!topicRow) {
    return (
      <div
        className="rounded-2xl px-4 py-3.5 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #16161a 0%, #0f1a2e 100%)',
          border: '1px solid var(--border)',
        }}
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color: 'var(--devops-accent)' }}>
            DevOps Focus
          </p>
          <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>No topic started yet</p>
        </div>
        <Link
          href="/devops"
          className="text-xs font-semibold px-3 py-2 rounded-xl flex-shrink-0"
          style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--devops-accent)' }}
        >
          Start →
        </Link>
      </div>
    )
  }

  const topic = getTopicBySlug(topicRow.topic_slug)
  if (!topic) return null

  const confidence = topicRow.confidence ?? 0
  const completedMods = topicRow.completed_modules ?? 0
  const totalMods = topic.totalModules
  const modPct = totalMods > 0 ? (completedMods / totalMods) * 100 : 0
  const confPct = (confidence / 5) * 100

  return (
    <div
      className="rounded-2xl px-4 py-3.5"
      style={{
        background: 'linear-gradient(135deg, #16161a 0%, #0f1a2e 100%)',
        border: '1px solid rgba(59,130,246,0.2)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--devops-accent)' }}>
          DevOps Focus
        </p>
        <Link
          href="/devops"
          className="text-[11px] font-semibold"
          style={{ color: 'var(--devops-accent)' }}
        >
          Continue →
        </Link>
      </div>

      {/* Topic name */}
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
        {topic.name}
      </p>

      {/* Bars */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wide font-medium" style={{ color: 'var(--muted-foreground)' }}>
              Confidence
            </span>
            <span className="text-[10px] font-bold" style={{ color: 'var(--devops-accent)' }}>
              {confidence}/5
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${confPct}%`, background: 'var(--devops-accent)' }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wide font-medium" style={{ color: 'var(--muted-foreground)' }}>
              Modules
            </span>
            <span className="text-[10px] font-bold" style={{ color: 'var(--devops-accent)' }}>
              {completedMods}/{totalMods}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${modPct}%`, background: 'var(--devops-accent)' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
