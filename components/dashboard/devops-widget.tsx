import Link from 'next/link'
import { getTopicBySlug, placementScoreLabel, placementScoreColor } from '@/lib/devops'
import type { DevOpsTopicRow } from '@/types/database'

function revisionStatus(lastStudied: string | null): {
  label: string
  color: string
  borderColor: string
} {
  if (!lastStudied) {
    return { label: 'Not started', color: '#6b6b80', borderColor: 'var(--border)' }
  }
  const daysSince = Math.floor(
    (Date.now() - new Date(lastStudied).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysSince < 3)  return { label: 'Up to date', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }
  if (daysSince <= 7) return { label: 'Due soon',   color: '#f59e0b', borderColor: 'rgba(245,158,11,0.35)' }
  return                     { label: 'Overdue',    color: '#ef4444', borderColor: 'rgba(239,68,68,0.35)' }
}

export function DevOpsWidget({
  topicRow,
  lastStudied,
  placementScore,
}: {
  topicRow: DevOpsTopicRow | null
  lastStudied: string | null
  placementScore: number
}) {
  const status = revisionStatus(lastStudied)
  const pColor = placementScoreColor(placementScore)
  const pLabel = placementScoreLabel(placementScore)

  if (!topicRow) {
    return (
      <div
        className="rounded-2xl px-4 py-3.5"
        style={{
          background: 'linear-gradient(135deg, #16161a 0%, #0f1a2e 100%)',
          border: `1px solid ${status.borderColor}`,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--devops-accent)' }}>
            DevOps Focus
          </p>
          <Link
            href="/devops"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--devops-accent)' }}
          >
            Start →
          </Link>
        </div>
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--muted-foreground)' }}>No topic started yet</p>
        {/* Placement score even with no topics */}
        <div className="pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wide font-medium" style={{ color: 'var(--muted-foreground)' }}>
              Placement Readiness
            </span>
            <span className="text-[10px] font-bold" style={{ color: pColor }}>{placementScore}% · {pLabel}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(59,130,246,0.12)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${placementScore}%`, background: pColor }} />
          </div>
        </div>
      </div>
    )
  }

  const topic = getTopicBySlug(topicRow.topic_slug)
  if (!topic) return null

  const confidence   = topicRow.confidence ?? 0
  const completedMods = topicRow.completed_modules ?? 0
  const totalMods    = topic.totalModules
  const modPct       = totalMods > 0 ? (completedMods / totalMods) * 100 : 0
  const confPct      = (confidence / 5) * 100

  const lastStudiedLabel = lastStudied
    ? new Date(lastStudied).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : 'Never'

  return (
    <div
      className="rounded-2xl px-4 py-3.5"
      style={{
        background: 'linear-gradient(135deg, #16161a 0%, #0f1a2e 100%)',
        border: `1px solid ${status.borderColor}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--devops-accent)' }}>
            DevOps Focus
          </p>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: `${status.color}22`, color: status.color }}
          >
            {status.label}
          </span>
        </div>
        <Link href="/devops" className="text-[11px] font-semibold" style={{ color: 'var(--devops-accent)' }}>
          Continue →
        </Link>
      </div>

      {/* Topic name */}
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
        {topic.name}
      </p>

      {/* Confidence + Modules bars */}
      <div className="grid grid-cols-2 gap-3 mb-2.5">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wide font-medium" style={{ color: 'var(--muted-foreground)' }}>Confidence</span>
            <span className="text-[10px] font-bold" style={{ color: 'var(--devops-accent)' }}>{confidence}/5</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${confPct}%`, background: 'var(--devops-accent)' }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wide font-medium" style={{ color: 'var(--muted-foreground)' }}>Modules</span>
            <span className="text-[10px] font-bold" style={{ color: 'var(--devops-accent)' }}>{completedMods}/{totalMods}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${modPct}%`, background: 'var(--devops-accent)' }} />
          </div>
        </div>
      </div>

      {/* Last studied */}
      <p className="text-[10px] mb-2.5" style={{ color: 'var(--muted-foreground)' }}>
        Last studied: <span style={{ color: status.color }}>{lastStudiedLabel}</span>
      </p>

      {/* Placement Readiness */}
      <div className="pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-wide font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Placement Readiness
          </span>
          <span className="text-[10px] font-bold" style={{ color: pColor }}>
            {placementScore}% · {pLabel}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(59,130,246,0.12)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${placementScore}%`, background: pColor }} />
        </div>
      </div>
    </div>
  )
}
