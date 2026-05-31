'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { DailyNote, NoteTask } from '@/types/database'
import { DEVOPS_TOPICS } from '@/lib/devops'

// ─── Config ──────────────────────────────────────────────────────────────────

const DEADLINE = '2026-07-13'

const BOARD_TOPICS = [
  { slug: 'linux-fundamentals', short: 'Linux'      },
  { slug: 'bash-scripting',     short: 'Bash'       },
  { slug: 'docker',             short: 'Docker'     },
  { slug: 'networking',         short: 'Networking' },
  { slug: 'kubernetes',         short: 'K8s'        },
  { slug: 'git-github',         short: 'Git'        },
]

const ROADMAP_SLUGS = ['linux-fundamentals', 'docker', 'networking']

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopicProgress {
  topic_slug: string
  confidence: number
  completed_modules: number
}

interface Props {
  userId: string
  today: string
  existing: DailyNote | null
  pastNotes: DailyNote[]
  topicRows: TopicProgress[]
  planStartDate: string
}

interface DayDot { dayChar: string; completion: number; hasData: boolean }

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function genId() { return Math.random().toString(36).slice(2, 10) }

function daysUntilDeadline(today: string): number {
  const ms = new Date(DEADLINE + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()
  return Math.max(0, Math.ceil(ms / 86400000))
}

function countdownPct(start: string, today: string): number {
  const s = new Date(start + 'T00:00:00').getTime()
  const e = new Date(DEADLINE + 'T00:00:00').getTime()
  const n = new Date(today + 'T00:00:00').getTime()
  if (n >= e) return 100
  if (n <= s) return 0
  return Math.round(((n - s) / (e - s)) * 100)
}

function urgencyColor(days: number) {
  if (days > 30) return '#ff4d1c'
  if (days > 14) return '#f59e0b'
  return '#ef4444'
}

function barHue(pct: number) {
  if (pct < 60) return '#ff4d1c'
  if (pct < 80) return '#f59e0b'
  return '#ef4444'
}

function computeStreak(today: string, pastNotes: DailyNote[]): number {
  let streak = 0
  const base = new Date(today + 'T00:00:00')
  for (let i = 1; i <= 60; i++) {
    const d = new Date(base); d.setDate(d.getDate() - i)
    const note = pastNotes.find(n => n.note_date === d.toLocaleDateString('sv-SE'))
    if (!note) break
    const t = (note.tasks as NoteTask[] | null) ?? []
    if (t.some(x => x.done) || note.content?.trim()) streak++
    else break
  }
  return streak
}

function computeBestStreak(pastNotes: DailyNote[]): number {
  const active = pastNotes
    .filter(n => { const t = (n.tasks as NoteTask[] | null) ?? []; return t.some(x => x.done) || !!n.content?.trim() })
    .sort((a, b) => new Date(a.note_date).getTime() - new Date(b.note_date).getTime())
  let best = 0, cur = 0, prev: Date | null = null
  for (const note of active) {
    const d = new Date(note.note_date + 'T00:00:00')
    cur = prev && Math.round((d.getTime() - prev.getTime()) / 86400000) === 1 ? cur + 1 : 1
    best = Math.max(best, cur); prev = d
  }
  return best
}

function computeHistory(today: string, pastNotes: DailyNote[]): DayDot[] {
  const base = new Date(today + 'T00:00:00')
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base); d.setDate(d.getDate() - (7 - i))
    const note = pastNotes.find(n => n.note_date === d.toLocaleDateString('sv-SE')) ?? null
    const tasks = (note?.tasks as NoteTask[] | null) ?? []
    const done = tasks.filter(t => t.done).length, total = tasks.length
    const completion = note ? (total > 0 ? Math.round((done / total) * 100) : (note.content?.trim() ? 50 : 0)) : 0
    return { dayChar: d.toLocaleDateString('en-US', { weekday: 'narrow' }), completion, hasData: !!note }
  })
}

function dotStyle(dot: DayDot) {
  if (!dot.hasData) return { bg: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)' }
  if (dot.completion === 100) return { bg: 'rgba(16,185,129,0.7)', border: '1.5px solid #10b981' }
  if (dot.completion >= 50) return { bg: 'rgba(245,158,11,0.5)', border: '1.5px solid #f59e0b' }
  if (dot.completion > 0) return { bg: 'rgba(239,68,68,0.4)', border: '1.5px solid #ef4444' }
  return { bg: '#1e1e24', border: '1.5px solid rgba(255,255,255,0.08)' }
}

// ─── Completion Ring ──────────────────────────────────────────────────────────

const RING_R = 21, RING_C = 2 * Math.PI * RING_R

function CompletionRing({ done, total }: { done: number; total: number }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t) }, [])
  const pct = total > 0 ? done / total : 0
  const allDone = total > 0 && done === total
  const offset = mounted ? RING_C * (1 - pct) : RING_C
  const arc = allDone ? '#10b981' : pct > 0 ? '#ff4d1c' : 'rgba(255,255,255,0.06)'
  return (
    <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="26" cy="26" r={RING_R} stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" fill="none" />
        <circle cx="26" cy="26" r={RING_R} stroke={arc} strokeWidth="3.5" fill="none" strokeLinecap="round"
          strokeDasharray={RING_C} strokeDashoffset={offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '26px 26px', transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.3s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {total > 0 ? (
          <>
            <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1, color: allDone ? '#4ade80' : 'var(--foreground)' }}>{done}</span>
            <span style={{ fontSize: 9, lineHeight: 1, marginTop: 2, color: 'var(--muted-foreground)' }}>/{total}</span>
          </>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>—</span>
        )}
      </div>
    </div>
  )
}

// ─── Star icon ────────────────────────────────────────────────────────────────

function Star({ on }: { on: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24"
      fill={on ? '#f59e0b' : 'none'} stroke={on ? '#f59e0b' : 'rgba(255,255,255,0.2)'} strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

// ─── Label ────────────────────────────────────────────────────────────────────

function Label({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--muted-foreground)' }}>
        {children}
      </span>
      {right}
    </div>
  )
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, onToggle, onDelete, onPin, focus = false }: {
  task: NoteTask; onToggle: () => void; onDelete: () => void; onPin: () => void; focus?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
      style={{
        background: task.done ? 'rgba(16,185,129,0.04)' : focus ? 'rgba(255,77,28,0.05)' : 'rgba(255,255,255,0.025)',
        border: task.done ? '1px solid rgba(16,185,129,0.1)' : focus ? '1px solid rgba(255,77,28,0.12)' : '1px solid rgba(255,255,255,0.05)',
        opacity: task.done ? 0.6 : 1,
        transition: 'opacity 0.25s ease',
      }}>
      {/* Checkbox */}
      <button onClick={onToggle} style={{ width: 28, height: 28, minWidth: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%', border: '2px solid',
          borderColor: task.done ? '#10b981' : focus ? 'rgba(255,77,28,0.5)' : 'rgba(255,255,255,0.18)',
          background: task.done ? '#10b981' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s ease, border-color 0.15s ease',
        }}>
          {task.done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </div>
      </button>
      {/* Text */}
      <span className="flex-1 text-[13.5px] leading-snug"
        style={{ color: task.done ? 'var(--muted-foreground)' : 'var(--foreground)', textDecoration: task.done ? 'line-through' : 'none', transition: 'color 0.2s ease' }}>
        {task.text}
      </span>
      {/* Pin */}
      <button onClick={onPin} style={{ width: 28, height: 28, minWidth: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Star on={!!task.priority} />
      </button>
      {/* Delete */}
      <button onClick={onDelete} style={{ width: 28, height: 28, minWidth: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.18)' }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M9.5 1.5L1.5 9.5M1.5 1.5l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotesClient({ userId, today, existing, pastNotes, topicRows, planStartDate }: Props) {
  const [tasks, setTasks] = useState<NoteTask[]>((existing?.tasks as NoteTask[] | null) ?? [])
  const [content, setContent] = useState(existing?.content ?? '')
  const [newTask, setNewTask] = useState('')
  const [noteOpen, setNoteOpen] = useState(!!(existing?.content?.trim()))
  const [roadmapOpen, setRoadmapOpen] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Derived task state
  const focusTasks = tasks.filter(t => t.priority)
  const otherPending = tasks.filter(t => !t.priority && !t.done)
  const otherDone = tasks.filter(t => !t.priority && t.done)
  const doneCount = tasks.filter(t => t.done).length
  const total = tasks.length
  const allDone = total > 0 && doneCount === total
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0

  // Mission data
  const streak = computeStreak(today, pastNotes)
  const best = computeBestStreak(pastNotes)
  const history = computeHistory(today, pastNotes)
  const daysLeft = daysUntilDeadline(today)
  const cPct = countdownPct(planStartDate, today)
  const topicMap = new Map(topicRows.map(r => [r.topic_slug, r]))

  // ── Save logic ───────────────────────────────────────────────────────────────

  const persist = useCallback(async (t: NoteTask[], c: string) => {
    setSaving(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('daily_notes').upsert(
      { user_id: userId, note_date: today, tasks: t, content: c.trim() || null, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,note_date' }
    )
    setSaving(false)
    if (err) setError('Could not save — check Migration 4 is applied in Supabase.')
  }, [userId, today])

  function schedule(t: NoteTask[], c: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persist(t, c), 600)
  }

  // ── Task actions ─────────────────────────────────────────────────────────────

  function addTask() {
    const text = newTask.trim(); if (!text) return
    const next = [...tasks, { id: genId(), text, done: false }]
    setTasks(next); setNewTask(''); schedule(next, content)
    inputRef.current?.focus()
  }
  function toggleTask(id: string) {
    const next = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
    setTasks(next); schedule(next, content)
  }
  function deleteTask(id: string) {
    const next = tasks.filter(t => t.id !== id)
    setTasks(next); schedule(next, content)
  }
  function pinTask(id: string) {
    const task = tasks.find(t => t.id === id); if (!task) return
    const pins = tasks.filter(t => t.priority && t.id !== id).length
    if (!task.priority && pins >= 3) return
    const next = tasks.map(t => t.id === id ? { ...t, priority: !t.priority } : t)
    setTasks(next); schedule(next, content)
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">

      {/* ── MISSION CARD ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1c1108 0%, #17100a 50%, #120e10 100%)',
          borderTop: '2px solid #ff4d1c',
          borderLeft: '1px solid rgba(255,77,28,0.2)',
          borderRight: '1px solid rgba(255,77,28,0.2)',
          borderBottom: '1px solid rgba(255,77,28,0.12)',
        }}>
        <div className="px-4 pt-4 pb-0">
          {/* Goal + days */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(255,77,28,0.65)' }}>
                Mission
              </p>
              <p className="text-[18px] font-bold leading-tight mt-1" style={{ color: 'var(--foreground)' }}>
                Placement-Ready
              </p>
              <p className="text-[15px] font-semibold leading-tight" style={{ color: 'rgba(255,255,255,0.55)' }}>
                for G-Research
              </p>
            </div>
            <div className="text-right flex-shrink-0 pt-1">
              <p className="text-[40px] font-black leading-none" style={{ color: urgencyColor(daysLeft), letterSpacing: '-2px' }}>
                {daysLeft}
              </p>
              <p className="text-[10px] font-semibold mt-0.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
                days left
              </p>
            </div>
          </div>

          {/* Streak row */}
          <div className="flex items-center gap-2 mt-3 mb-4">
            {streak > 0 ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <span style={{ fontSize: 11 }}>🔥</span>
                <span className="text-[11px] font-semibold" style={{ color: '#fbbf24' }}>{streak} day streak</span>
              </div>
            ) : (
              <div className="px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Start your streak today</span>
              </div>
            )}
            {best > 1 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.1)' }}>
                <span style={{ fontSize: 11 }}>🏆</span>
                <span className="text-[11px] font-medium" style={{ color: 'rgba(251,191,36,0.65)' }}>Best: {best}</span>
              </div>
            )}
          </div>
        </div>

        {/* Countdown bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.05)' }}>
          <div style={{ height: '100%', width: `${cPct}%`, background: barHue(cPct), transition: 'width 1s ease' }} />
        </div>
        <div className="flex justify-between px-4 py-1.5">
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>Goal start</span>
          <span className="text-[10px] font-semibold" style={{ color: urgencyColor(daysLeft) }}>Jul 13, 2026</span>
        </div>
      </div>

      {/* ── ALL DONE BANNER ───────────────────────────────────────────────── */}
      {allDone && (
        <div className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
          style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(16,185,129,0.18)' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2.5 7.5l3.5 3.5L12.5 4" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: '#4ade80' }}>Everything done. You showed up.</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(74,222,128,0.45)' }}>
              {total} task{total !== 1 ? 's' : ''} completed today
            </p>
          </div>
        </div>
      )}

      {/* ── PLACEMENT PROGRESS ────────────────────────────────────────────── */}
      <div className="rounded-2xl px-4 pt-3.5 pb-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <Label right={
          <Link href="/devops" className="text-[10px] font-semibold" style={{ color: '#3b82f6' }}>
            View all →
          </Link>
        }>
          Placement Progress
        </Label>
        <div className="grid grid-cols-2 gap-x-5 gap-y-3.5">
          {BOARD_TOPICS.map(({ slug, short }) => {
            const row = topicMap.get(slug)
            const def = DEVOPS_TOPICS.find(t => t.slug === slug)
            const tot = def?.totalModules ?? 1
            const done = row?.completed_modules ?? 0
            const pct = Math.round((done / tot) * 100)
            const conf = row?.confidence ?? 0
            const col = conf >= 4 ? '#10b981' : conf >= 2 ? '#f59e0b' : done > 0 ? '#3b82f6' : 'rgba(255,255,255,0.1)'
            return (
              <Link key={slug} href={`/devops/topics/${slug}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold" style={{ color: done > 0 ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                    {short}
                  </span>
                  <span className="text-[10px] font-bold" style={{ color: col }}>{done}/{tot}</span>
                </div>
                <div className="h-[2.5px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: col, transition: 'width 0.7s ease' }} />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── TOP 3 PRIORITIES ──────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: focusTasks.length > 0 ? 'linear-gradient(145deg, #1c1410 0%, #19120e 100%)' : 'var(--card)',
          border: focusTasks.length > 0 ? '1px solid rgba(255,77,28,0.18)' : '1px solid var(--border)',
        }}>
        <div className="px-4 pt-3.5 pb-1.5">
          <Label right={
            focusTasks.length > 0
              ? <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,77,28,0.12)', color: 'rgba(255,100,50,0.85)' }}>
                  {focusTasks.length}/3
                </span>
              : tasks.length > 0
              ? <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>Tap ★ on a task</span>
              : null
          }>
            Top 3 Priorities
          </Label>
        </div>
        <div className="px-3 pb-3.5 space-y-1.5">
          {focusTasks.length === 0 ? (
            <div className="py-3 px-1">
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                No priorities pinned yet.
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.12)' }}>
                Add tasks below, then tap ★ to surface your top 3 here.
              </p>
            </div>
          ) : (
            focusTasks.map(task => (
              <TaskRow key={task.id} task={task} focus
                onToggle={() => toggleTask(task.id)}
                onDelete={() => deleteTask(task.id)}
                onPin={() => pinTask(task.id)} />
            ))
          )}
        </div>
      </div>

      {/* ── TASKS ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="px-4 pt-3.5 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <Label right={
                <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {total === 0 ? 'Nothing queued' : `${doneCount} of ${total} done`}
                </span>
              }>
                Tasks
              </Label>
              <div className="h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full"
                  style={{ width: `${progress}%`, background: allDone ? '#10b981' : '#ff4d1c', transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1), background 0.3s ease' }} />
              </div>
            </div>
            <CompletionRing done={doneCount} total={total} />
          </div>
        </div>

        <div className="px-3 pt-2 pb-2 space-y-1.5">
          {total === 0 && (
            <div className="py-4 text-center">
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Nothing queued yet.
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.12)' }}>
                What moves you closer to G-Research today?
              </p>
            </div>
          )}

          {otherPending.map(task => (
            <TaskRow key={task.id} task={task}
              onToggle={() => toggleTask(task.id)}
              onDelete={() => deleteTask(task.id)}
              onPin={() => pinTask(task.id)} />
          ))}

          {otherDone.length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-1.5 pb-0.5">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.15)' }}>Done</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
              {otherDone.map(task => (
                <TaskRow key={task.id} task={task}
                  onToggle={() => toggleTask(task.id)}
                  onDelete={() => deleteTask(task.id)}
                  onPin={() => pinTask(task.id)} />
              ))}
            </>
          )}

          {/* Add input */}
          <div className="flex items-center gap-2 mt-1 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, color: 'rgba(255,255,255,0.18)' }}>
              <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input ref={inputRef} type="text" value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="Add a task…"
              className="flex-1 bg-transparent text-[13px]"
              style={{ color: 'var(--foreground)', outline: 'none', border: 'none' }} />
            {newTask.trim() && (
              <button onClick={addTask}
                className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                style={{ background: '#ff4d1c', color: '#fff' }}>
                Add
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CAREER ROADMAP ───────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="px-4 pt-3.5 pb-1.5">
          <Label right={
            <Link href="/devops/topics" className="text-[10px] font-semibold" style={{ color: '#3b82f6' }}>
              All topics →
            </Link>
          }>
            Career Roadmap
          </Label>
        </div>
        <div className="pb-2">
          {ROADMAP_SLUGS.map((slug, si) => {
            const def = DEVOPS_TOPICS.find(t => t.slug === slug)
            if (!def) return null
            const row = topicMap.get(slug)
            const doneMods = row?.completed_modules ?? 0
            const pct = Math.round((doneMods / def.totalModules) * 100)
            const isOpen = roadmapOpen === slug
            return (
              <div key={slug} style={{ borderTop: si > 0 ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
                <button onClick={() => setRoadmapOpen(isOpen ? null : slug)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-opacity active:opacity-70">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px] font-semibold"
                        style={{ color: doneMods > 0 ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                        {def.name}
                      </span>
                      <span className="text-[10px] font-bold ml-2 flex-shrink-0"
                        style={{ color: pct === 100 ? '#10b981' : doneMods > 0 ? '#3b82f6' : 'rgba(255,255,255,0.2)' }}>
                        {doneMods}/{def.totalModules}
                      </span>
                    </div>
                    <div className="h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : '#3b82f6', transition: 'width 0.7s ease' }} />
                    </div>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16, flexShrink: 0 }}>{isOpen ? '−' : '+'}</span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-3.5 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="pt-2 space-y-2">
                      {def.modules.map((mod, idx) => {
                        const done = idx < doneMods
                        return (
                          <div key={idx} className="flex items-start gap-2.5">
                            <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: done ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.05)' }}>
                              {done
                                ? <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2L7.5 2" stroke="#4ade80" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                : <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
                              }
                            </div>
                            <span className="text-[12px] leading-snug"
                              style={{ color: done ? 'rgba(74,222,128,0.65)' : 'var(--muted-foreground)' }}>
                              {mod}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <Link href={`/devops/topics/${slug}`}
                      className="block pt-2 text-[11px] font-semibold" style={{ color: '#3b82f6' }}>
                      Update progress →
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── NOTE ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        {!noteOpen ? (
          <button onClick={() => { setNoteOpen(true); setTimeout(() => noteRef.current?.focus(), 60) }}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-opacity active:opacity-60">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: 'rgba(255,255,255,0.2)' }}>
              <path d="M1.5 2.5h11M1.5 6.5h7M1.5 10.5h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span className="flex-1 text-[13px] truncate" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {content.trim() ? content.slice(0, 55) + (content.length > 55 ? '…' : '') : 'Add a note for today…'}
            </span>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0, color: 'rgba(255,255,255,0.15)' }}>
              <path d="M3.5 1.5l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <div className="px-4 pt-3.5 pb-4">
            <div className="flex items-center justify-between mb-2.5">
              <Label>Note</Label>
              <div className="flex items-center gap-2">
                {saving && <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>saving…</span>}
                <button onClick={() => setNoteOpen(false)} style={{ color: 'rgba(255,255,255,0.2)' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
            <textarea ref={noteRef} value={content}
              onChange={e => { setContent(e.target.value); schedule(tasks, e.target.value) }}
              onBlur={() => { if (saveTimer.current) clearTimeout(saveTimer.current); persist(tasks, content) }}
              placeholder="Anything else on your mind today…"
              rows={4}
              className="w-full text-[13px] leading-relaxed resize-none bg-transparent"
              style={{ color: 'var(--foreground)', outline: 'none', border: 'none' }} />
          </div>
        )}
      </div>

      {/* ── 7-DAY HISTORY ────────────────────────────────────────────────── */}
      {pastNotes.length > 0 && (
        <div className="rounded-2xl px-4 pt-3.5 pb-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <Label>Past 7 Days</Label>
          <div className="flex items-end justify-between mt-1">
            {history.map((dot, i) => {
              const s = dotStyle(dot)
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full" style={{ background: s.bg, border: s.border }} />
                  <span className="text-[9px] font-medium" style={{ color: 'rgba(255,255,255,0.22)' }}>{dot.dayChar}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {error && <p className="text-[12px] px-1" style={{ color: '#ef4444' }}>{error}</p>}
    </div>
  )
}
