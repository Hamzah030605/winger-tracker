'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { FootballSession, FootballDrill } from '@/types/plans'
import { createClient } from '@/lib/supabase/client'
import { enqueueSession } from '@/lib/offline-queue'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface DrillLog {
  done: boolean
  qualityRating: number
  confidenceRating: number
  weakFootNotes: string
  notes: string
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Below avg',
  3: 'Average',
  4: 'Good',
  5: 'Elite',
}

export function FootballSessionLogger({
  session,
  week,
  userId,
}: {
  session: FootballSession
  week: number
  userId: string
}) {
  const router = useRouter()
  const allDrills = session.blocks.flatMap((b) => b.drills)

  const [logs, setLogs] = useState<Record<string, DrillLog>>(
    Object.fromEntries(
      allDrills.map((d) => [
        d.id,
        { done: false, qualityRating: 0, confidenceRating: 0, weakFootNotes: '', notes: '' },
      ])
    )
  )
  const [overallNotes, setOverallNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedDrill, setExpandedDrill] = useState<string | null>(null)

  const doneCount = Object.values(logs).filter((l) => l.done).length

  function updateLog(id: string, field: keyof DrillLog, value: string | number | boolean) {
    setLogs((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  async function handleFinish() {
    setSaving(true)
    const now = new Date().toISOString()
    const exercises = allDrills
      .filter((d) => {
        const log = logs[d.id]
        return log?.done || !!log?.qualityRating || !!log?.confidenceRating || !!log?.weakFootNotes || !!log?.notes
      })
      .map((d) => {
        const log = logs[d.id]
        return {
          exerciseName: d.name,
          qualityRating: log.qualityRating || undefined,
          confidenceRating: log.confidenceRating || undefined,
          weakFootNotes: log.weakFootNotes || undefined,
          notes: log.notes || undefined,
        }
      })

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('not authenticated')

      const { data: sessionLog, error: sessionErr } = await supabase
        .from('session_logs')
        .insert({
          user_id: userId,
          plan_type: 'football',
          session_name: session.name,
          week_number: week,
          completed_at: now,
          overall_notes: overallNotes || null,
        })
        .select('id')
        .single()

      if (sessionErr || !sessionLog) {
        console.error('[football-logger] session_logs insert failed:', {
          message: sessionErr?.message,
          code: sessionErr?.code,
          details: sessionErr?.details,
          hint: sessionErr?.hint,
        })
        throw sessionErr ?? new Error('session insert returned no data')
      }

      if (exercises.length > 0) {
        const { error: exErr } = await supabase.from('exercise_logs').insert(
          exercises.map((ex) => ({
            session_log_id: sessionLog.id,
            exercise_name: ex.exerciseName,
            quality_rating: ex.qualityRating ?? null,
            confidence_rating: ex.confidenceRating ?? null,
            weak_foot_notes: ex.weakFootNotes ?? null,
            notes: ex.notes ?? null,
          }))
        )
        if (exErr) {
          console.error('[football-logger] exercise_logs insert failed:', {
            message: exErr.message,
            code: exErr.code,
            details: exErr.details,
            hint: exErr.hint,
          })
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error('[football-logger] save failed, enqueueing offline:', errMsg)
      enqueueSession({
        planType: 'football',
        sessionName: session.name,
        weekNumber: week,
        completedAt: now,
        overallNotes: overallNotes || undefined,
        exercises,
      })
    } finally {
      setSaving(false)
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      {/* Header */}
      <div className="mb-5">
        <button onClick={() => router.back()} className="text-xs mb-3 flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
          ← Back
        </button>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--football-accent)' }}>
          Week {week} · ⚽ Session {session.number}
        </p>
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{session.name}</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>85 min · {session.day}</p>

        {/* Progress */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(doneCount / allDrills.length) * 100}%`, background: 'var(--football-accent)' }}
            />
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--football-accent)' }}>
            {doneCount}/{allDrills.length}
          </span>
        </div>
      </div>

      {/* Drills by block */}
      {session.blocks.map((block) => (
        <div key={block.name} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
              {block.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{block.timeRange}</p>
          </div>
          <div className="space-y-2">
            {block.drills.map((drill) => (
              <DrillRow
                key={drill.id}
                drill={drill}
                log={logs[drill.id]}
                isExpanded={expandedDrill === drill.id}
                onToggleExpand={() => setExpandedDrill(expandedDrill === drill.id ? null : drill.id)}
                onUpdate={(field, value) => updateLog(drill.id, field, value)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Overall notes */}
      <div className="mb-6">
        <label className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'var(--muted-foreground)' }}>
          Session Notes
        </label>
        <Textarea
          placeholder="Decision cues working? Weak foot feeling? What clicked?"
          value={overallNotes}
          onChange={(e) => setOverallNotes(e.target.value)}
          className="min-h-[90px] text-sm"
          style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />
      </div>

      <Button
        onClick={handleFinish}
        disabled={saving}
        className="w-full h-14 text-base font-bold rounded-2xl"
        style={{ background: 'var(--primary)', color: 'white' }}
      >
        {saving ? 'Saving…' : `Complete Session (${doneCount}/${allDrills.length} done)`}
      </Button>
    </div>
  )
}

function DrillRow({
  drill,
  log,
  isExpanded,
  onToggleExpand,
  onUpdate,
}: {
  drill: FootballDrill
  log: DrillLog
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: (field: keyof DrillLog, value: string | number | boolean) => void
}) {
  const styleColor =
    drill.style === 'Neymar' ? '#818cf8' :
    drill.style === 'CR7' ? 'var(--primary)' :
    'var(--football-accent)'

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${log.done ? 'var(--football-accent)' : 'var(--border)'}`,
        background: log.done ? 'rgba(16,185,129,0.05)' : 'var(--card)',
      }}
    >
      <div className="flex items-center gap-3 p-4" style={{ minHeight: '64px' }}>
        <button
          onClick={() => onUpdate('done', !log.done)}
          className="flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors"
          style={{
            borderColor: log.done ? 'var(--football-accent)' : 'var(--border)',
            background: log.done ? 'var(--football-accent)' : 'transparent',
          }}
        >
          {log.done && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l4 4 6-7" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <button className="flex-1 text-left" onClick={onToggleExpand}>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-sm" style={{ color: log.done ? 'var(--football-accent)' : 'var(--foreground)' }}>
              {drill.name}
            </p>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${styleColor}20`, color: styleColor }}>
              {drill.style}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {drill.reps} · Rest: {drill.rest}
          </p>
        </button>

        <button onClick={onToggleExpand} style={{ color: 'var(--muted-foreground)' }}>
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
          {drill.setup && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
              📐 {drill.setup}
            </p>
          )}
          {drill.decisionCue && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(255,77,28,0.08)', color: 'var(--primary)' }}>
              🎯 {drill.decisionCue}
            </p>
          )}
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <span style={{ color: 'var(--foreground)' }}>Trains: </span>{drill.trains}
          </p>

          {/* Ratings */}
          <div className="space-y-3">
            <RatingInput
              label="Quality rating"
              value={log.qualityRating}
              onChange={(v) => onUpdate('qualityRating', v)}
              color="var(--football-accent)"
            />
            <RatingInput
              label="Confidence rating"
              value={log.confidenceRating}
              onChange={(v) => onUpdate('confidenceRating', v)}
              color="var(--primary)"
            />
          </div>

          {/* Weak foot notes */}
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Weak foot notes</label>
            <input
              type="text"
              placeholder="How did left foot feel? What to improve?"
              value={log.weakFootNotes}
              onChange={(e) => onUpdate('weakFootNotes', e.target.value)}
              className="w-full h-11 px-3 rounded-xl text-sm"
              style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Notes</label>
            <input
              type="text"
              placeholder="Decision cues, move felt? Adjustments?"
              value={log.notes}
              onChange={(e) => onUpdate('notes', e.target.value)}
              className="w-full h-11 px-3 rounded-xl text-sm"
              style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function RatingInput({
  label,
  value,
  onChange,
  color,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  color: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
        {value > 0 && (
          <span className="text-xs font-medium" style={{ color }}>{RATING_LABELS[value]}</span>
        )}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className="flex-1 h-10 rounded-xl text-sm font-bold transition-colors"
            style={{
              background: value >= n ? color : 'var(--secondary)',
              color: value >= n ? (color === 'var(--primary)' ? 'white' : 'black') : 'var(--muted-foreground)',
              border: `1px solid ${value >= n ? color : 'var(--border)'}`,
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
