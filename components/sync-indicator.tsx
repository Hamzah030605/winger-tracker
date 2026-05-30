'use client'

import { useEffect, useState } from 'react'
import { getQueueLength, flushQueue } from '@/lib/offline-queue'
import { createClient } from '@/lib/supabase/client'

export function SyncIndicator() {
  const [queueLen, setQueueLen] = useState(0)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const check = () => setQueueLen(getQueueLength())
    check()
    const id = setInterval(check, 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (queueLen === 0 || syncing) return
    if (!navigator.onLine) return

    const trySync = async () => {
      setSyncing(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSyncing(false); return }

      const count = await flushQueue(async (log) => {
        try {
          const { data: session, error: sessionErr } = await supabase
            .from('session_logs')
            .insert({
              user_id: user.id,
              plan_type: log.planType,
              session_name: log.sessionName,
              week_number: log.weekNumber,
              completed_at: log.completedAt,
              overall_notes: log.overallNotes ?? null,
            })
            .select('id')
            .single()
          if (sessionErr || !session) return false

          if (log.exercises.length > 0) {
            const { error: exErr } = await supabase.from('exercise_logs').insert(
              log.exercises.map((ex) => ({
                session_log_id: session.id,
                exercise_name: ex.exerciseName,
                sets: ex.sets ?? null,
                reps: ex.reps ?? null,
                weight: ex.weight ?? null,
                rpe: ex.rpe ?? null,
                quality_rating: ex.qualityRating ?? null,
                confidence_rating: ex.confidenceRating ?? null,
                weak_foot_notes: ex.weakFootNotes ?? null,
                notes: ex.notes ?? null,
              }))
            )
            if (exErr) return false
          }
          return true
        } catch {
          return false
        }
      })

      setQueueLen(getQueueLength())
      setSyncing(false)
    }

    trySync()
  }, [queueLen, syncing])

  if (queueLen === 0) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-1 text-xs font-medium"
      style={{ background: syncing ? 'var(--primary)' : '#f59e0b', color: 'white' }}
    >
      {syncing ? (
        <>
          <span className="animate-pulse">⟳</span>
          Syncing {queueLen} session{queueLen !== 1 ? 's' : ''}…
        </>
      ) : (
        <>⚠ {queueLen} session{queueLen !== 1 ? 's' : ''} saved offline — connect to sync</>
      )}
    </div>
  )
}
