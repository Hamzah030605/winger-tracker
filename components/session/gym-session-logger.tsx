'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GymSession, GymExercise } from '@/types/plans'
import { createClient } from '@/lib/supabase/client'
import { enqueueSession } from '@/lib/offline-queue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface ExerciseLog {
  done: boolean
  sets: string
  reps: string
  weight: string
  rpe: string
  notes: string
}

export function GymSessionLogger({
  session,
  week,
  userId,
}: {
  session: GymSession
  week: number
  userId: string
}) {
  const router = useRouter()
  const allExercises = session.blocks.flatMap((b) => b.exercises)

  const [logs, setLogs] = useState<Record<string, ExerciseLog>>(
    Object.fromEntries(
      allExercises.map((ex) => [
        ex.name,
        { done: false, sets: ex.sets, reps: ex.reps, weight: '', rpe: '', notes: '' },
      ])
    )
  )
  const [overallNotes, setOverallNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedEx, setExpandedEx] = useState<string | null>(null)

  const doneCount = Object.values(logs).filter((l) => l.done).length
  const totalCount = allExercises.length

  function updateLog(name: string, field: keyof ExerciseLog, value: string | boolean) {
    setLogs((prev) => ({ ...prev, [name]: { ...prev[name], [field]: value } }))
  }

  async function handleFinish() {
    setSaving(true)
    const now = new Date().toISOString()
    const exercises = allExercises
      .filter((ex) => logs[ex.name]?.done)
      .map((ex) => {
        const log = logs[ex.name]
        return {
          exerciseName: ex.name,
          sets: parseInt(log.sets) || undefined,
          reps: parseInt(log.reps) || undefined,
          weight: parseFloat(log.weight) || undefined,
          rpe: parseFloat(log.rpe) || undefined,
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
          plan_type: 'gym',
          session_name: session.name,
          week_number: week,
          completed_at: now,
          overall_notes: overallNotes || null,
        })
        .select('id')
        .single()

      if (sessionErr || !sessionLog) {
        console.error('[gym-logger] session_logs insert failed:', {
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
            sets: ex.sets ?? null,
            reps: ex.reps ?? null,
            weight: ex.weight ?? null,
            rpe: ex.rpe ?? null,
            notes: ex.notes ?? null,
          }))
        )
        if (exErr) {
          console.error('[gym-logger] exercise_logs insert failed:', {
            message: exErr.message,
            code: exErr.code,
            details: exErr.details,
            hint: exErr.hint,
          })
          // Session was saved — do not throw, just log. Exercises are lost for this attempt.
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error('[gym-logger] save failed, enqueueing offline:', errMsg)
      enqueueSession({
        planType: 'gym',
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
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--gym-accent)' }}>
          Week {week} · 🏋️ Gym
        </p>
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{session.name}</h1>

        {/* Progress bar */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(doneCount / totalCount) * 100}%`, background: 'var(--gym-accent)' }}
            />
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--gym-accent)' }}>
            {doneCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Exercises by block */}
      {session.blocks.map((block) => (
        <div key={block.name} className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>
            {block.name}
          </p>
          <div className="space-y-2">
            {block.exercises.map((ex) => (
              <ExerciseRow
                key={ex.name}
                exercise={ex}
                log={logs[ex.name]}
                isExpanded={expandedEx === ex.name}
                onToggleExpand={() => setExpandedEx(expandedEx === ex.name ? null : ex.name)}
                onUpdate={(field, value) => updateLog(ex.name, field, value)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* SAQ finisher */}
      {session.hasSAQ && session.saqBlocks && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--primary)' }}>
            SAQ Finisher (20 min)
          </p>
          {session.saqBlocks.map((block) => (
            <div
              key={block.name}
              className="rounded-xl p-3 mb-2"
              style={{ background: 'rgba(255,77,28,0.08)', border: '1px solid rgba(255,77,28,0.2)' }}
            >
              <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{block.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {block.duration} — {block.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Overall notes */}
      <div className="mb-6">
        <label className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'var(--muted-foreground)' }}>
          Session Notes
        </label>
        <Textarea
          placeholder="How did it feel? PRs hit? What to improve next time…"
          value={overallNotes}
          onChange={(e) => setOverallNotes(e.target.value)}
          className="min-h-[90px] text-sm"
          style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />
      </div>

      {/* Finish button */}
      <Button
        onClick={handleFinish}
        disabled={saving}
        className="w-full h-14 text-base font-bold touch-target rounded-2xl"
        style={{ background: 'var(--primary)', color: 'white' }}
      >
        {saving ? 'Saving…' : `Complete Session (${doneCount}/${totalCount} done)`}
      </Button>
    </div>
  )
}

function ExerciseRow({
  exercise,
  log,
  isExpanded,
  onToggleExpand,
  onUpdate,
}: {
  exercise: GymExercise
  log: ExerciseLog
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: (field: keyof ExerciseLog, value: string | boolean) => void
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${log.done ? 'var(--gym-accent)' : 'var(--border)'}`,
        background: log.done ? 'rgba(245,158,11,0.05)' : 'var(--card)',
      }}
    >
      <div className="flex items-center gap-3 p-4" style={{ minHeight: '64px' }}>
        {/* Checkbox */}
        <button
          onClick={() => onUpdate('done', !log.done)}
          className="flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors"
          style={{
            borderColor: log.done ? 'var(--gym-accent)' : 'var(--border)',
            background: log.done ? 'var(--gym-accent)' : 'transparent',
          }}
        >
          {log.done && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l4 4 6-7" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Name + badges */}
        <button className="flex-1 text-left" onClick={onToggleExpand}>
          <p className="font-semibold text-sm" style={{ color: log.done ? 'var(--gym-accent)' : 'var(--foreground)' }}>
            {exercise.name}
          </p>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
              {exercise.sets}×{exercise.reps}
            </span>
            {exercise.tempo && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                {exercise.tempo}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
              {exercise.rest}
            </span>
          </div>
        </button>

        <button onClick={onToggleExpand} style={{ color: 'var(--muted-foreground)' }}>
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
          {exercise.notes && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
              📝 {exercise.notes}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Sets done</label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder={exercise.sets}
                value={log.sets}
                onChange={(e) => onUpdate('sets', e.target.value)}
                className="h-11 text-base"
                style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Reps done</label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder={exercise.reps}
                value={log.reps}
                onChange={(e) => onUpdate('reps', e.target.value)}
                className="h-11 text-base"
                style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Weight (kg)</label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={log.weight}
                onChange={(e) => onUpdate('weight', e.target.value)}
                className="h-11 text-base"
                style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>RPE (1–10)</label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="7"
                min="1"
                max="10"
                value={log.rpe}
                onChange={(e) => onUpdate('rpe', e.target.value)}
                className="h-11 text-base"
                style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Notes</label>
            <Input
              type="text"
              placeholder="How it felt, form cues…"
              value={log.notes}
              onChange={(e) => onUpdate('notes', e.target.value)}
              className="h-11 text-sm"
              style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
