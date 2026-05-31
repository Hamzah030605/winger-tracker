'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DailyNote, NoteTask } from '@/types/database'

interface Props {
  userId: string
  today: string
  todayLabel: string
  existing: DailyNote | null
  pastNotes: DailyNote[]
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
}

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

export function NotesClient({ userId, today, todayLabel, existing, pastNotes }: Props) {
  const [tasks, setTasks] = useState<NoteTask[]>(
    (existing?.tasks as NoteTask[] | null) ?? []
  )
  const [content, setContent] = useState(existing?.content ?? '')
  const [newTask, setNewTask] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [expandedPast, setExpandedPast] = useState<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback(async (nextTasks: NoteTask[], nextContent: string) => {
    setSaving(true)
    setSaved(false)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase
      .from('daily_notes')
      .upsert(
        {
          user_id: userId,
          note_date: today,
          tasks: nextTasks,
          content: nextContent.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,note_date' }
      )
    setSaving(false)
    if (err) {
      setError('Could not save. Make sure Migration 4 is applied in Supabase.')
      return
    }
    setSaved(true)
  }, [userId, today])

  function scheduleSave(nextTasks: NoteTask[], nextContent: string) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => persist(nextTasks, nextContent), 800)
  }

  function addTask() {
    const text = newTask.trim()
    if (!text) return
    const next = [...tasks, { id: genId(), text, done: false }]
    setTasks(next)
    setNewTask('')
    setSaved(false)
    scheduleSave(next, content)
  }

  function toggleTask(id: string) {
    const next = tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t)
    setTasks(next)
    setSaved(false)
    scheduleSave(next, content)
  }

  function deleteTask(id: string) {
    const next = tasks.filter((t) => t.id !== id)
    setTasks(next)
    setSaved(false)
    scheduleSave(next, content)
  }

  function handleContentBlur() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    persist(tasks, content)
  }

  const done = tasks.filter((t) => t.done).length
  const total = tasks.length

  return (
    <div className="space-y-4">

      {/* Today's note card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #16161a 0%, #1a1e2e 100%)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3.5 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--primary)' }}>
              Today&apos;s Plan
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {todayLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {total > 0 && (
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: done === total ? 'rgba(16,185,129,0.18)' : 'var(--secondary)',
                  color: done === total ? '#4ade80' : 'var(--muted-foreground)',
                }}
              >
                {done}/{total}
              </span>
            )}
            {saved && (
              <span
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(16,185,129,0.18)', color: '#4ade80' }}
              >
                ✓ Saved
              </span>
            )}
            {saving && (
              <span
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
              >
                Saving…
              </span>
            )}
          </div>
        </div>

        <div className="px-4 pt-4 pb-4 space-y-4">

          {/* Add task input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add a task for today…"
              className="flex-1 rounded-xl px-3 py-2.5 text-sm"
              style={{
                background: 'var(--secondary)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                outline: 'none',
              }}
            />
            <button
              onClick={addTask}
              disabled={!newTask.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-30"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              Add
            </button>
          </div>

          {/* Task list */}
          {tasks.length > 0 && (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: 'var(--secondary)' }}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                    style={{
                      borderColor: task.done ? '#10b981' : 'var(--muted-foreground)',
                      background: task.done ? '#10b981' : 'transparent',
                    }}
                  >
                    {task.done && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <span
                    className="flex-1 text-sm"
                    style={{
                      color: task.done ? 'var(--muted-foreground)' : 'var(--foreground)',
                      textDecoration: task.done ? 'line-through' : 'none',
                    }}
                  >
                    {task.text}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg transition-all active:scale-95"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {tasks.length === 0 && (
            <p className="text-xs text-center py-2" style={{ color: 'var(--muted-foreground)' }}>
              No tasks yet — add something to get started
            </p>
          )}

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)' }} />

          {/* Free notes */}
          <div>
            <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>
              Notes
            </p>
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                setSaved(false)
              }}
              onBlur={handleContentBlur}
              placeholder="Anything to keep in mind today…"
              rows={4}
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
              style={{
                background: 'var(--secondary)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
          )}

          <button
            onClick={() => persist(tasks, content)}
            disabled={saving}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40"
            style={{
              background: saved ? 'rgba(16,185,129,0.2)' : 'var(--primary)',
              color: saved ? '#4ade80' : '#fff',
              border: saved ? '1px solid rgba(16,185,129,0.4)' : 'none',
            }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* Past notes */}
      {pastNotes.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2.5" style={{ color: 'var(--muted-foreground)' }}>
            Recent Days
          </p>
          <div className="space-y-2">
            {pastNotes.map((note) => {
              const noteTasks = note.tasks as NoteTask[]
              const noteDone = noteTasks.filter((t) => t.done).length
              const noteTotal = noteTasks.length
              const isOpen = expandedPast === note.id
              return (
                <div
                  key={note.id}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <button
                    onClick={() => setExpandedPast(isOpen ? null : note.id)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                        {formatDateLabel(note.note_date)}
                      </p>
                      {!isOpen && noteTotal > 0 && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                          {noteDone}/{noteTotal} tasks done
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {noteTotal > 0 && (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: noteDone === noteTotal ? 'rgba(16,185,129,0.18)' : 'var(--secondary)',
                            color: noteDone === noteTotal ? '#4ade80' : 'var(--muted-foreground)',
                          }}
                        >
                          {noteDone}/{noteTotal}
                        </span>
                      )}
                      <span style={{ color: 'var(--muted-foreground)', fontSize: 18 }}>
                        {isOpen ? '−' : '+'}
                      </span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                      {noteTasks.length > 0 && (
                        <div className="pt-3 space-y-2">
                          {noteTasks.map((t) => (
                            <div key={t.id} className="flex items-center gap-2.5">
                              <div
                                className="flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                                style={{
                                  borderColor: t.done ? '#10b981' : 'var(--muted-foreground)',
                                  background: t.done ? '#10b981' : 'transparent',
                                }}
                              >
                                {t.done && (
                                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                                    <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </div>
                              <span
                                className="text-sm"
                                style={{
                                  color: t.done ? 'var(--muted-foreground)' : 'var(--foreground)',
                                  textDecoration: t.done ? 'line-through' : 'none',
                                }}
                              >
                                {t.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {note.content && (
                        <div className={noteTasks.length > 0 ? '' : 'pt-3'}>
                          <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>
                            Notes
                          </p>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
                            {note.content}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
