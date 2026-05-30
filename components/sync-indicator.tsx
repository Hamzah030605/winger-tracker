'use client'

import { useEffect, useRef, useState } from 'react'
import { getQueueLength, flushQueue, clearQueue } from '@/lib/offline-queue'
import { createClient } from '@/lib/supabase/client'

const RETRY_DELAY_MS = 30_000

export function SyncIndicator() {
  const [queueLen, setQueueLen] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  // Ref tracks in-flight state so effect deps don't create an infinite loop
  const isSyncingRef = useRef(false)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Poll queue length every 5 s
  useEffect(() => {
    const check = () => setQueueLen(getQueueLength())
    check()
    const id = setInterval(check, 5000)
    return () => clearInterval(id)
  }, [])

  // Kick off a sync attempt whenever the queue gains items
  useEffect(() => {
    if (queueLen === 0) { setSyncError(null); return }
    if (isSyncingRef.current) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) return
    attemptSync()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueLen])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (retryTimerRef.current) clearTimeout(retryTimerRef.current) }
  }, [])

  async function attemptSync() {
    if (isSyncingRef.current) return
    isSyncingRef.current = true
    setSyncing(true)
    setSyncError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.error('[sync] No authenticated user — aborting sync')
        scheduleRetry('Not logged in')
        return
      }

      const { failed } = await flushQueue(async (log) => {
        // ── session_logs insert ──
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

        if (sessionErr || !session) {
          console.error('[sync] session_logs insert failed', {
            message: sessionErr?.message,
            code: sessionErr?.code,
            details: sessionErr?.details,
            hint: sessionErr?.hint,
            localId: log.localId,
            failCount: log.failCount,
          })
          return false
        }

        // ── exercise_logs insert ──
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
          if (exErr) {
            // Session was saved — return true so we don't re-insert it and create a duplicate.
            // Exercise data is lost for this item; log clearly.
            console.error('[sync] exercise_logs insert failed (session was saved, exercises lost)', {
              message: exErr.message,
              code: exErr.code,
              details: exErr.details,
              hint: exErr.hint,
              localId: log.localId,
            })
          }
        }

        return true
      })

      const remaining = getQueueLength()
      setQueueLen(remaining)

      if (failed > 0 || remaining > 0) {
        scheduleRetry(`${remaining} session${remaining !== 1 ? 's' : ''} failed to sync`)
        return
      }
    } catch (err) {
      console.error('[sync] unexpected error during flush:', err)
      scheduleRetry('Unexpected sync error')
    }

    isSyncingRef.current = false
    setSyncing(false)
  }

  function scheduleRetry(errorMsg: string) {
    console.error(`[sync] ${errorMsg} — retrying in ${RETRY_DELAY_MS / 1000}s`)
    setSyncError(errorMsg)
    setSyncing(false)
    retryTimerRef.current = setTimeout(() => {
      isSyncingRef.current = false
      if (getQueueLength() > 0) attemptSync()
    }, RETRY_DELAY_MS)
  }

  function handleRetryNow() {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    isSyncingRef.current = false
    setSyncing(false)
    setSyncError(null)
    attemptSync()
  }

  function handleDiscard() {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    clearQueue()
    isSyncingRef.current = false
    setSyncing(false)
    setSyncError(null)
    setQueueLen(0)
  }

  if (queueLen === 0) return null

  if (syncError) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 px-4 py-2 text-xs font-medium"
        style={{ background: '#ef4444', color: 'white' }}
      >
        <span>⚠ {syncError}</span>
        <button
          onClick={handleRetryNow}
          className="font-bold underline underline-offset-2"
        >
          Retry now
        </button>
        <span style={{ opacity: 0.5 }}>·</span>
        <button
          onClick={handleDiscard}
          className="font-bold underline underline-offset-2"
        >
          Discard
        </button>
      </div>
    )
  }

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
