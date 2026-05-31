'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DailyNote, NoteTask } from '@/types/database'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  userId: string
  today: string
  existing: DailyNote | null
  pastNotes: DailyNote[]
}

interface DayDot {
  dayChar: string
  completion: number
  hasData: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

function computeStreak(today: string, pastNotes: DailyNote[]): number {
  let streak = 0
  const base = new Date(today + 'T00:00:00')
  for (let i = 1; i <= 60; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString('sv-SE')
    const note = pastNotes.find(n => n.note_date === dateStr)
    if (!note) break
    const t = (note.tasks as NoteTask[] | null) ?? []
    if (t.some(x => x.done) || note.content?.trim()) streak++
    else break
  }
  return streak
}

function computeHistory(today: string, pastNotes: DailyNote[]): DayDot[] {
  const base = new Date(today + 'T00:00:00')
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() - (7 - i))
    const dateStr = d.toLocaleDateString('sv-SE')
    const dayChar = d.toLocaleDateString('en-US', { weekday: 'narrow' })
    const note = pastNotes.find(n => n.note_date === dateStr) ?? null
    const tasks = (note?.tasks as NoteTask[] | null) ?? []
    const doneCount = tasks.filter(t => t.done).length
    const totalCount = tasks.length
    let completion = 0
    if (note) {
      completion = totalCount > 0
        ? Math.round((doneCount / totalCount) * 100)
        : note.content?.trim() ? 50 : 0
    }
    return { dayChar, completion, hasData: !!note }
  })
}

function dotStyle(dot: DayDot): { bg: string; border: string } {
  if (!dot.hasData) return { bg: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)' }
  if (dot.completion === 100) return { bg: 'rgba(16,185,129,0.7)', border: '1.5px solid rgba(16,185,129,0.9)' }
  if (dot.completion >= 50) return { bg: 'rgba(245,158,11,0.5)', border: '1.5px solid rgba(245,158,11,0.8)' }
  if (dot.completion > 0) return { bg: 'rgba(239,68,68,0.4)', border: '1.5px solid rgba(239,68,68,0.7)' }
  return { bg: '#1e1e24', border: '1.5px solid rgba(255,255,255,0.08)' }
}

// ─── Completion Ring ──────────────────────────────────────────────────────────

const R = 21
const CIRC = 2 * Math.PI * R

function CompletionRing({ done, total }: { done: number; total: number }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t) }, [])

  const pct = total > 0 ? done / total : 0
  const allDone = total > 0 && done === total
  const offset = mounted ? CIRC * (1 - pct) : CIRC
  const trackColor = 'rgba(255,255,255,0.06)'
  const arcColor = allDone ? '#10b981' : pct > 0 ? 'var(--primary)' : 'rgba(255,255,255,0.06)'

  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="28" cy="28" r={R} stroke={trackColor} strokeWidth="4" fill="none" />
        <circle
          cx="28" cy="28" r={R}
          stroke={arcColor}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '28px 28px',
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease',
          }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {total > 0 ? (
          <>
            <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1, color: allDone ? '#4ade80' : 'var(--foreground)' }}>
              {done}
            </span>
            <span style={{ fontSize: 9, lineHeight: 1, marginTop: 2, color: 'var(--muted-foreground)' }}>
              /{total}
            </span>
          </>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>—</span>
        )}
      </div>
    </div>
  )
}

// ─── Star Icon ────────────────────────────────────────────────────────────────

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? '#f59e0b' : 'none'} stroke={filled ? '#f59e0b' : 'rgba(255,255,255,0.2)'} strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  onToggle,
  onDelete,
  onTogglePriority,
  isFocus = false,
}: {
  task: NoteTask
  onToggle: () => void
  onDelete: () => void
  onTogglePriority: () => void
  isFocus?: boolean
}) {
  const bg = task.done
    ? 'rgba(16,185,129,0.04)'
    : isFocus
    ? 'rgba(255,77,28,0.05)'
    : 'rgba(255,255,255,0.03)'
  const border = task.done
    ? '1px solid rgba(16,185,129,0.1)'
    : isFocus
    ? '1px solid rgba(255,77,28,0.12)'
    : '1px solid rgba(255,255,255,0.05)'

  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
      style={{ background: bg, border, opacity: task.done ? 0.65 : 1, transition: 'opacity 0.25s ease, background 0.2s ease' }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="flex-shrink-0 flex items-center justify-center"
        style={{ width: 28, height: 28, minWidth: 28 }}
      >
        <div
          className="flex items-center justify-center rounded-full border-2"
          style={{
            width: 20, height: 20,
            borderColor: task.done ? '#10b981' : isFocus ? 'rgba(255,77,28,0.5)' : 'rgba(255,255,255,0.18)',
            background: task.done ? '#10b981' : 'transparent',
            transition: 'background 0.15s ease, border-color 0.15s ease',
          }}
        >
          {task.done && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </button>

      {/* Label */}
      <span
        className="flex-1 text-[13.5px] leading-snug"
        style={{
          color: task.done ? 'var(--muted-foreground)' : 'var(--foreground)',
          textDecoration: task.done ? 'line-through' : 'none',
          transition: 'color 0.2s ease',
        }}
      >
        {task.text}
      </span>

      {/* Star */}
      <button
        onClick={onTogglePriority}
        className="flex-shrink-0 flex items-center justify-center"
        style={{ width: 28, height: 28, minWidth: 28 }}
        title={task.priority ? 'Remove from focus' : 'Pin to focus'}
      >
        <StarIcon filled={!!task.priority} />
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="flex-shrink-0 flex items-center justify-center"
        style={{ width: 28, height: 28, minWidth: 28, color: 'rgba(255,255,255,0.18)' }}
        title="Remove"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M9.5 1.5L1.5 9.5M1.5 1.5l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--muted-foreground)' }}>
        {children}
      </p>
      {right}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NotesClient({ userId, today, existing, pastNotes }: Props) {
  const [tasks, setTasks] = useState<NoteTask[]>((existing?.tasks as NoteTask[] | null) ?? [])
  const [content, setContent] = useState(existing?.content ?? '')
  const [newTask, setNewTask] = useState('')
  const [noteOpen, setNoteOpen] = useState(!!(existing?.content?.trim()))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Derived
  const focusTasks = tasks.filter(t => t.priority)
  const otherTasks = tasks.filter(t => !t.priority)
  const pendingOther = otherTasks.filter(t => !t.done)
  const doneOther = otherTasks.filter(t => t.done)
  const done = tasks.filter(t => t.done).length
  const total = tasks.length
  const allDone = total > 0 && done === total
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  const streak = computeStreak(today, pastNotes)
  const history = computeHistory(today, pastNotes)

  const todayDate = new Date(today + 'T00:00:00')
  const dayName = todayDate.toLocaleDateString('en-GB', { weekday: 'long' })
  const dateStr = todayDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })

  // ── Persistence ──────────────────────────────────────────────────────────────

  const persist = useCallback(async (nextTasks: NoteTask[], nextContent: string) => {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase
      .from('daily_notes')
      .upsert(
        { user_id: userId, note_date: today, tasks: nextTasks, content: nextContent.trim() || null, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,note_date' }
      )
    setSaving(false)
    if (err) setError('Could not save — check Migration 4 is applied in Supabase.')
  }, [userId, today])

  function save(nextTasks: NoteTask[], nextContent: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persist(nextTasks, nextContent), 600)
  }

  // ── Task actions ─────────────────────────────────────────────────────────────

  function addTask() {
    const text = newTask.trim()
    if (!text) return
    const next = [...tasks, { id: genId(), text, done: false }]
    setTasks(next)
    setNewTask('')
    save(next, content)
    inputRef.current?.focus()
  }

  function toggleTask(id: string) {
    const next = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
    setTasks(next)
    save(next, content)
  }

  function deleteTask(id: string) {
    const next = tasks.filter(t => t.id !== id)
    setTasks(next)
    save(next, content)
  }

  function togglePriority(id: string) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const focusCount = tasks.filter(t => t.priority && t.id !== id).length
    if (!task.priority && focusCount >= 3) return
    const next = tasks.map(t => t.id === id ? { ...t, priority: !t.priority } : t)
    setTasks(next)
    save(next, content)
  }

  function handleNoteChange(val: string) {
    setContent(val)
    save(tasks, val)
  }

  function handleNoteBlur() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    persist(tasks, content)
  }

  function openNote() {
    setNoteOpen(true)
    setTimeout(() => noteRef.current?.focus(), 60)
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">

      {/* ── Day Header ──────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl px-4 py-4 flex items-center justify-between gap-3"
        style={{
          background: 'linear-gradient(145deg, #131318 0%, #15121e 100%)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="min-w-0">
          <h2
            className="text-[26px] font-bold leading-none tracking-tight"
            style={{ color: 'var(--foreground)' }}
          >
            {dayName}
          </h2>
          <p className="text-[13px] mt-1 leading-none" style={{ color: 'var(--muted-foreground)' }}>
            {dateStr}
          </p>

          {streak > 0 ? (
            <div
              className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}
            >
              <span style={{ fontSize: 11 }}>🔥</span>
              <span className="text-[11px] font-semibold" style={{ color: '#fbbf24' }}>
                {streak} day streak
              </span>
            </div>
          ) : (
            <p className="text-[11px] mt-3" style={{ color: 'rgba(255,255,255,0.18)' }}>
              Start your streak today
            </p>
          )}
        </div>

        <CompletionRing done={done} total={total} />
      </div>

      {/* ── All Done Banner ──────────────────────────────────────────────────── */}
      {allDone && (
        <div
          className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
          style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(16,185,129,0.18)' }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2.5 7.5l3.5 3.5L12.5 4" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-semibold leading-snug" style={{ color: '#4ade80' }}>
              Everything done. You showed up.
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(74,222,128,0.5)' }}>
              {total} task{total !== 1 ? 's' : ''} completed today
            </p>
          </div>
        </div>
      )}

      {/* ── Focus Zone ──────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: focusTasks.length > 0 ? 'linear-gradient(145deg, #1c1410 0%, #1a1210 100%)' : 'var(--card)',
          border: focusTasks.length > 0 ? '1px solid rgba(255,77,28,0.18)' : '1px solid var(--border)',
        }}
      >
        <div className="px-4 pt-3.5 pb-1.5 flex items-center justify-between">
          <SectionLabel
            right={
              focusTasks.length > 0
                ? <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,77,28,0.12)', color: 'rgba(255,100,50,0.9)' }}>
                    {focusTasks.length}/3
                  </span>
                : tasks.length > 0
                ? <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>Tap ★ on a task</span>
                : null
            }
          >
            Focus
          </SectionLabel>
        </div>

        <div className="px-3 pb-3.5 space-y-1.5">
          {focusTasks.length === 0 ? (
            <div className="py-3 px-1">
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                What must get done today?
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.12)' }}>
                Add tasks below, then tap ★ to pin your top 3 here.
              </p>
            </div>
          ) : (
            focusTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => toggleTask(task.id)}
                onDelete={() => deleteTask(task.id)}
                onTogglePriority={() => togglePriority(task.id)}
                isFocus
              />
            ))
          )}
        </div>
      </div>

      {/* ── Task List ───────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="px-4 pt-3.5 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <SectionLabel
            right={
              <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {total === 0 ? 'No tasks yet' : `${done} of ${total} done`}
              </span>
            }
          >
            Tasks
          </SectionLabel>

          {/* Progress bar */}
          <div className="h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: allDone ? '#10b981' : 'var(--primary)',
                transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1), background 0.3s ease',
              }}
            />
          </div>
        </div>

        <div className="px-3 pt-2 pb-2 space-y-1.5">
          {/* Empty state */}
          {total === 0 && (
            <div className="py-4 px-1 text-center">
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Your runway is clear.
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.12)' }}>
                Add what needs to get done today.
              </p>
            </div>
          )}

          {/* Pending */}
          {pendingOther.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task.id)}
              onDelete={() => deleteTask(task.id)}
              onTogglePriority={() => togglePriority(task.id)}
            />
          ))}

          {/* Completed separator + done tasks */}
          {doneOther.length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-1.5 pb-0.5">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.15)' }}>
                  Done
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
              {doneOther.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  onDelete={() => deleteTask(task.id)}
                  onTogglePriority={() => togglePriority(task.id)}
                />
              ))}
            </>
          )}

          {/* Add task input */}
          <div
            className="flex items-center gap-2 mt-1 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, color: 'rgba(255,255,255,0.18)' }}>
              <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="Add a task…"
              className="flex-1 bg-transparent text-[13px]"
              style={{ color: 'var(--foreground)', outline: 'none', border: 'none' }}
            />
            {newTask.trim() && (
              <button
                onClick={addTask}
                className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                Add
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Note ────────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        {!noteOpen ? (
          <button
            onClick={openNote}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-opacity active:opacity-60"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: 'rgba(255,255,255,0.2)' }}>
              <path d="M1.5 2.5h11M1.5 6.5h7M1.5 10.5h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span className="flex-1 text-[13px] truncate" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {content.trim()
                ? content.slice(0, 55) + (content.length > 55 ? '…' : '')
                : 'Add a note for today…'}
            </span>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0, color: 'rgba(255,255,255,0.15)' }}>
              <path d="M3.5 1.5l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : (
          <div className="px-4 pt-3.5 pb-4">
            <div className="flex items-center justify-between mb-2.5">
              <SectionLabel>Note</SectionLabel>
              <div className="flex items-center gap-2">
                {saving && (
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>saving…</span>
                )}
                <button
                  onClick={() => setNoteOpen(false)}
                  className="transition-opacity active:opacity-50"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
            <textarea
              ref={noteRef}
              value={content}
              onChange={e => handleNoteChange(e.target.value)}
              onBlur={handleNoteBlur}
              placeholder="Anything else on your mind today…"
              rows={4}
              className="w-full text-[13px] leading-relaxed resize-none bg-transparent"
              style={{ color: 'var(--foreground)', outline: 'none', border: 'none' }}
            />
          </div>
        )}
      </div>

      {/* ── 7-Day History ───────────────────────────────────────────────────── */}
      {pastNotes.length > 0 && (
        <div
          className="rounded-2xl px-4 pt-3.5 pb-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <SectionLabel>Past 7 Days</SectionLabel>
          <div className="flex items-end justify-between mt-1">
            {history.map((dot, i) => {
              const s = dotStyle(dot)
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-7 h-7 rounded-full"
                    style={{ background: s.bg, border: s.border }}
                    title={dot.hasData ? `${dot.completion}% done` : 'No data'}
                  />
                  <span className="text-[9px] font-medium" style={{ color: 'rgba(255,255,255,0.22)' }}>
                    {dot.dayChar}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {error && (
        <p className="text-[12px] px-1" style={{ color: '#ef4444' }}>{error}</p>
      )}
    </div>
  )
}
