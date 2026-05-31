'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { FocusSession } from '@/types/database'

// ─── Constants ────────────────────────────────────────────────────────────────
const FOCUS_MS = 25 * 60 * 1000
const BREAK_MS = 5 * 60 * 1000
const LS_KEY = 'winger-focus-state'

// ─── Types ────────────────────────────────────────────────────────────────────
type SessionType = 'devops' | 'arabic' | 'reading' | 'deep_work' | 'training'

type Phase =
  | 'idle'
  | 'focus-running'
  | 'focus-paused'
  | 'focus-complete'
  | 'break-running'
  | 'break-paused'

interface TimerState {
  phase: Phase
  sessionType: SessionType
  /** Date.now() when this focus block was first started */
  focusStartedAt: number | null
  /** Date.now() when the current run segment started (after latest resume) */
  runStartedAt: number | null
  /** Accumulated ms from previous run segments (before latest pause) */
  elapsedMs: number
}

const DEFAULT_STATE: TimerState = {
  phase: 'idle',
  sessionType: 'devops',
  focusStartedAt: null,
  runStartedAt: null,
  elapsedMs: 0,
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
function loadState(): TimerState {
  if (typeof window === 'undefined') return DEFAULT_STATE
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE
  } catch {
    return DEFAULT_STATE
  }
}

function persistState(s: TimerState) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)) } catch { /* noop */ }
}

function clearPersistedState() {
  try { localStorage.removeItem(LS_KEY) } catch { /* noop */ }
}

// ─── Time helpers ─────────────────────────────────────────────────────────────
function getTotalElapsed(s: TimerState, now = Date.now()): number {
  const running = s.phase === 'focus-running' || s.phase === 'break-running'
  return s.elapsedMs + (running && s.runStartedAt ? now - s.runStartedAt : 0)
}

function msToDisplay(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Audio ────────────────────────────────────────────────────────────────────
function playCompletionSound(ctx: AudioContext | null) {
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') ctx.resume()
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.28, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9)

    const freqs = [880, 1100, 1320]
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.connect(gain)
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.start(ctx.currentTime + i * 0.18)
      osc.stop(ctx.currentTime + i * 0.18 + 0.28)
    })
  } catch { /* noop */ }
}

// ─── Notification ─────────────────────────────────────────────────────────────
function fireNotification(title: string, body: string) {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try { new Notification(title, { body, icon: '/icon-192x192.png' }) } catch { /* noop */ }
}

// ─── Session type metadata ─────────────────────────────────────────────────────
const SESSION_TYPES: {
  value: SessionType
  label: string
  emoji: string
  color: string
}[] = [
  { value: 'devops',    label: 'DevOps',    emoji: '💻', color: '#3b82f6' },
  { value: 'arabic',    label: 'Arabic',    emoji: '🌙', color: '#f97316' },
  { value: 'reading',   label: 'Reading',   emoji: '📚', color: '#8b5cf6' },
  { value: 'deep_work', label: 'Deep Work', emoji: '🎯', color: '#f59e0b' },
  { value: 'training',  label: 'Training',  emoji: '⚽', color: '#10b981' },
]

function getTypeMeta(value: SessionType) {
  return SESSION_TYPES.find((t) => t.value === value) ?? SESSION_TYPES[0]!
}

const WEEKLY_SESSION_GOAL = 5
const DAILY_SESSION_MIN   = 1

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  userId: string
  todaySessions: FocusSession[]
  weeklyMinutes: number
  weeklySessionCount: number
}

export function PomodoroTimer({ userId, todaySessions: initSessions, weeklyMinutes: initWeekMins, weeklySessionCount: initWeekCount }: Props) {
  const router = useRouter()
  const [timerState, setTimerState] = useState<TimerState>(DEFAULT_STATE)
  const [tick, setTick] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [todaySessions, setTodaySessions] = useState(initSessions)
  const [weeklyMinutes, setWeeklyMinutes] = useState(initWeekMins)
  const [weeklySessionCount, setWeeklySessionCount] = useState(initWeekCount)

  const audioRef = useRef<AudioContext | null>(null)
  const didCompleteRef = useRef(false)

  // Sync props after router.refresh()
  useEffect(() => { setTodaySessions(initSessions) }, [initSessions])
  useEffect(() => { setWeeklyMinutes(initWeekMins) }, [initWeekMins])
  useEffect(() => { setWeeklySessionCount(initWeekCount) }, [initWeekCount])

  // Restore from localStorage on first mount
  useEffect(() => {
    const saved = loadState()
    setTimerState(saved)
  }, [])

  // Tick interval — only for re-renders; actual time uses Date.now()
  useEffect(() => {
    const running = timerState.phase === 'focus-running' || timerState.phase === 'break-running'
    if (!running) return
    const id = setInterval(() => setTick((n) => n + 1), 500)
    return () => clearInterval(id)
  }, [timerState.phase])

  const initAudio = useCallback(() => {
    if (!audioRef.current && typeof window !== 'undefined') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch { /* noop */ }
    }
  }, [])

  // Auto-complete when timer reaches zero
  useEffect(() => {
    if (didCompleteRef.current) return

    if (timerState.phase === 'focus-running') {
      const elapsed = getTotalElapsed(timerState)
      if (elapsed >= FOCUS_MS) {
        didCompleteRef.current = true
        playCompletionSound(audioRef.current)
        fireNotification('Focus session complete 🎯', 'Great work. Take a 5-minute break.')
        const next: TimerState = {
          ...timerState,
          phase: 'focus-complete',
          elapsedMs: FOCUS_MS,
          runStartedAt: null,
        }
        setTimerState(next)
        persistState(next)
      }
    }

    if (timerState.phase === 'break-running') {
      const elapsed = getTotalElapsed(timerState)
      if (elapsed >= BREAK_MS) {
        didCompleteRef.current = true
        playCompletionSound(audioRef.current)
        fireNotification('Break over 💪', "Lock back in — let's go.")
        setTimerState(DEFAULT_STATE)
        clearPersistedState()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  // ── Save to Supabase ─────────────────────────────────────────────────────
  async function doSave(st: TimerState, noteText: string) {
    if (!st.focusStartedAt) return
    setSaving(true)
    setSaveError('')
    const supabase = createClient()
    const { error } = await supabase.from('focus_sessions').insert({
      user_id: userId,
      session_type: st.sessionType,
      duration_minutes: 25,
      started_at: new Date(st.focusStartedAt).toISOString(),
      completed_at: new Date().toISOString(),
      notes: noteText.trim() || null,
    })
    setSaving(false)
    if (error) {
      setSaveError('Could not save session. Check Supabase migration.')
      return
    }
    router.refresh()
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleStart() {
    initAudio()
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    didCompleteRef.current = false
    const next: TimerState = {
      ...DEFAULT_STATE,
      phase: 'focus-running',
      sessionType: timerState.sessionType,
      focusStartedAt: Date.now(),
      runStartedAt: Date.now(),
      elapsedMs: 0,
    }
    setTimerState(next)
    persistState(next)
    setNotes('')
    setSaveError('')
  }

  function handlePause() {
    const elapsedMs = getTotalElapsed(timerState)
    const next: TimerState = {
      ...timerState,
      phase: timerState.phase === 'focus-running' ? 'focus-paused' : 'break-paused',
      elapsedMs,
      runStartedAt: null,
    }
    setTimerState(next)
    persistState(next)
  }

  function handleResume() {
    didCompleteRef.current = false
    const next: TimerState = {
      ...timerState,
      phase: timerState.phase === 'focus-paused' ? 'focus-running' : 'break-running',
      runStartedAt: Date.now(),
    }
    setTimerState(next)
    persistState(next)
  }

  function handleReset() {
    didCompleteRef.current = false
    setTimerState(DEFAULT_STATE)
    clearPersistedState()
    setNotes('')
    setSaveError('')
  }

  /** User clicks Done ✓ before timer ends — transitions to focus-complete (save happens on Start Break / Skip) */
  function handleCompleteEarly() {
    didCompleteRef.current = true
    playCompletionSound(audioRef.current)
    const elapsedMs = getTotalElapsed(timerState)
    const next: TimerState = {
      ...timerState,
      phase: 'focus-complete',
      elapsedMs,
      runStartedAt: null,
    }
    setTimerState(next)
    persistState(next)
  }

  async function handleStartBreak() {
    await doSave(timerState, notes)
    didCompleteRef.current = false
    setNotes('')
    const next: TimerState = {
      ...DEFAULT_STATE,
      phase: 'break-running',
      sessionType: timerState.sessionType,
      runStartedAt: Date.now(),
    }
    setTimerState(next)
    persistState(next)
  }

  async function handleSkipBreak() {
    await doSave(timerState, notes)
    didCompleteRef.current = false
    setNotes('')
    setTimerState(DEFAULT_STATE)
    clearPersistedState()
  }

  function handleChangeType(type: SessionType) {
    if (timerState.phase !== 'idle') return
    setTimerState((prev) => ({ ...prev, sessionType: type }))
  }

  // ── Derived display values ─────────────────────────────────────────────
  const { phase, sessionType } = timerState
  const isIdle = phase === 'idle'
  const isFocusRunning = phase === 'focus-running'
  const isFocusPaused = phase === 'focus-paused'
  const isFocusComplete = phase === 'focus-complete'
  const isBreakRunning = phase === 'break-running'
  const isBreakPaused = phase === 'break-paused'
  const isBreakPhase = isBreakRunning || isBreakPaused
  const isRunning = isFocusRunning || isBreakRunning
  const isPaused = isFocusPaused || isBreakPaused
  const isFocusActive = isFocusRunning || isFocusPaused

  const durationMs = isBreakPhase ? BREAK_MS : FOCUS_MS
  const totalElapsed = getTotalElapsed(timerState)
  const remainingMs = Math.max(0, durationMs - totalElapsed)
  const progress = Math.min(1, totalElapsed / durationMs)

  const typeMeta = getTypeMeta(sessionType)
  const accentColor = isBreakPhase ? '#10b981' : typeMeta.color

  // SVG ring
  const R = 84
  const CIRC = 2 * Math.PI * R
  // Fill-up style: empty at start, full at end
  const dashOffset = CIRC - CIRC * progress

  const phaseLabel = isFocusComplete
    ? '✓ Focus Complete'
    : isBreakPhase
    ? 'Break'
    : isIdle
    ? 'Ready'
    : isFocusPaused
    ? 'Paused'
    : 'Focus'

  return (
    <div className="space-y-4">

      {/* ── Session type selector ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2.5" style={{ color: 'var(--muted-foreground)' }}>
          Session type
        </p>
        <div className="flex gap-2 flex-wrap">
          {SESSION_TYPES.map((t) => {
            const active = sessionType === t.value
            return (
              <button
                key={t.value}
                onClick={() => handleChangeType(t.value)}
                disabled={!isIdle}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: active ? `${t.color}18` : 'var(--card)',
                  border: `1px solid ${active ? t.color + '55' : 'var(--border)'}`,
                  color: active ? t.color : 'var(--muted-foreground)',
                  opacity: !isIdle && !active ? 0.35 : 1,
                }}
              >
                <span>{t.emoji}</span>
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Timer ring card ── */}
      <div
        className="rounded-3xl flex flex-col items-center py-8 px-4"
        style={{
          background: 'linear-gradient(160deg, #16161a 0%, #181420 100%)',
          border: `1px solid ${accentColor}30`,
          transition: 'border-color 0.4s ease',
        }}
      >
        {/* Phase label */}
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em] mb-5"
          style={{ color: accentColor, transition: 'color 0.4s ease' }}
        >
          {phaseLabel}
        </p>

        {/* SVG ring */}
        <div style={{ width: 196, height: 196 }}>
          <svg width="196" height="196" viewBox="0 0 196 196">
            {/* Track */}
            <circle
              cx="98" cy="98" r={R}
              fill="none"
              stroke="var(--secondary)"
              strokeWidth="9"
            />
            {/* Progress arc */}
            <circle
              cx="98" cy="98" r={R}
              fill="none"
              stroke={accentColor}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 98 98)"
              style={{
                transition: isRunning ? 'stroke-dashoffset 0.5s linear, stroke 0.4s ease' : 'stroke 0.4s ease',
              }}
            />
            {/* Center: time */}
            <text
              x="98" y="88"
              textAnchor="middle"
              fontSize="38"
              fontWeight="800"
              fill="var(--foreground)"
              fontFamily="var(--font-geist-sans), system-ui"
            >
              {msToDisplay(remainingMs)}
            </text>
            {/* Center: label */}
            <text
              x="98" y="112"
              textAnchor="middle"
              fontSize="12"
              fill="var(--muted-foreground)"
              fontFamily="var(--font-geist-sans), system-ui"
            >
              {isBreakPhase ? '5:00 break' : '25:00 focus'}
            </text>
            {/* Session type emoji */}
            {!isBreakPhase && (
              <text x="98" y="134" textAnchor="middle" fontSize="16">
                {typeMeta.emoji}
              </text>
            )}
          </svg>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-5 flex-wrap justify-center">
          {isIdle && (
            <button
              onClick={handleStart}
              className="px-10 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
              style={{ background: accentColor, color: '#fff', minHeight: 48 }}
            >
              Start Focus
            </button>
          )}

          {(isRunning || isPaused) && (
            <>
              {isRunning ? (
                <button
                  onClick={handlePause}
                  className="px-7 py-3.5 rounded-2xl text-sm font-semibold"
                  style={{
                    background: 'var(--secondary)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                    minHeight: 48,
                  }}
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="px-7 py-3.5 rounded-2xl text-sm font-bold"
                  style={{ background: accentColor, color: '#fff', minHeight: 48 }}
                >
                  Resume
                </button>
              )}

              <button
                onClick={handleReset}
                className="px-5 py-3.5 rounded-2xl text-sm font-semibold"
                style={{
                  background: 'var(--secondary)',
                  color: 'var(--muted-foreground)',
                  border: '1px solid var(--border)',
                  minHeight: 48,
                }}
              >
                Reset
              </button>

              {/* Complete early — focus phase only */}
              {isFocusActive && (
                <button
                  onClick={handleCompleteEarly}
                  className="px-5 py-3.5 rounded-2xl text-sm font-semibold"
                  style={{
                    background: 'rgba(16,185,129,0.12)',
                    color: '#10b981',
                    border: '1px solid rgba(16,185,129,0.3)',
                    minHeight: 48,
                  }}
                >
                  Done ✓
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Post-focus: notes + transition options ── */}
      {isFocusComplete && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: 'var(--card)', border: '1px solid rgba(16,185,129,0.3)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>
              Barakallahu feek — session logged.
            </p>
          </div>

          <textarea
            placeholder="Session notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
            style={{
              background: 'var(--secondary)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              outline: 'none',
            }}
          />

          {saveError && (
            <p className="text-xs" style={{ color: '#ef4444' }}>{saveError}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleStartBreak}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
              style={{
                background: 'rgba(16,185,129,0.18)',
                color: '#10b981',
                border: '1px solid rgba(16,185,129,0.35)',
                minHeight: 48,
              }}
            >
              {saving ? 'Saving…' : 'Start 5 min break'}
            </button>
            <button
              onClick={handleSkipBreak}
              disabled={saving}
              className="px-5 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{
                background: 'var(--secondary)',
                color: 'var(--muted-foreground)',
                border: '1px solid var(--border)',
                minHeight: 48,
              }}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* ── Goals card ── */}
      {(() => {
        const weekDone   = Math.min(weeklySessionCount, WEEKLY_SESSION_GOAL)
        const weekGoalMet = weekDone >= WEEKLY_SESSION_GOAL
        const weekColor  = weekGoalMet ? '#10b981' : weekDone >= 3 ? '#f59e0b' : 'var(--primary)'
        const todayDone  = todaySessions.length >= DAILY_SESSION_MIN
        return (
          <div
            className="rounded-2xl px-4 py-4 space-y-3"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {/* Weekly goal */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--muted-foreground)' }}>
                  Weekly goal
                </p>
                <span className="text-[11px] font-bold" style={{ color: weekColor }}>
                  {weekDone} / {WEEKLY_SESSION_GOAL} sessions
                  {weekGoalMet && ' ✓'}
                </span>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: WEEKLY_SESSION_GOAL }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-2.5 rounded-full transition-all"
                    style={{
                      background: i < weekDone ? weekColor : 'var(--secondary)',
                      border: i < weekDone ? 'none' : '1px solid var(--border)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Daily minimum */}
            <div
              className="flex items-center justify-between rounded-xl px-3 py-2.5"
              style={{
                background: todayDone ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${todayDone ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'}`,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{todayDone ? '✅' : '⏳'}</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                    Daily minimum
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                    {DAILY_SESSION_MIN} session per day
                  </p>
                </div>
              </div>
              <span
                className="text-[11px] font-bold"
                style={{ color: todayDone ? '#10b981' : '#ef4444' }}
              >
                {todayDone ? 'Done' : `${todaySessions.length}/${DAILY_SESSION_MIN}`}
              </span>
            </div>
          </div>
        )
      })()}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-2">
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <p className="text-2xl font-bold" style={{ color: typeMeta.color }}>
            {weeklyMinutes}
          </p>
          <p className="text-[10px] uppercase tracking-wide mt-1 font-semibold" style={{ color: 'var(--muted-foreground)' }}>
            Mins this week
          </p>
        </div>
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            {todaySessions.length}
          </p>
          <p className="text-[10px] uppercase tracking-wide mt-1 font-semibold" style={{ color: 'var(--muted-foreground)' }}>
            Sessions today
          </p>
        </div>
      </div>

      {/* Today's completed sessions */}
      {todaySessions.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: 'var(--muted-foreground)' }}>
            Today&apos;s sessions
          </p>
          <div className="space-y-2">
            {todaySessions.map((s) => {
              const meta = getTypeMeta(s.session_type as SessionType)
              const completedAt = s.completed_at
                ? new Date(s.completed_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                : ''
              return (
                <div
                  key={s.id}
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <span className="text-lg flex-shrink-0">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      {meta.label}
                    </p>
                    {s.notes && (
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                        {s.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold" style={{ color: meta.color }}>
                      {s.duration_minutes} min
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {completedAt}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
