'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { DailyTask } from '@/lib/devops'

const CATEGORY_COLORS: Record<DailyTask['category'], string> = {
  learn: '#3b82f6',
  practice: '#10b981',
  review: '#f59e0b',
}

export function DailyChecklist({
  tasks,
  completedKeys,
  todayStr,
}: {
  tasks: DailyTask[]
  completedKeys: string[]
  todayStr: string
}) {
  const router = useRouter()
  const [checked, setChecked] = useState<Set<string>>(new Set(completedKeys))
  const [pending, setPending] = useState<Set<string>>(new Set())

  async function toggle(key: string) {
    if (pending.has(key)) return
    const isChecked = checked.has(key)
    setChecked((prev) => {
      const next = new Set(prev)
      isChecked ? next.delete(key) : next.add(key)
      return next
    })
    setPending((prev) => new Set(prev).add(key))

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setPending((prev) => { const n = new Set(prev); n.delete(key); return n })
      return
    }

    let error: unknown = null
    if (isChecked) {
      const { error: err } = await supabase
        .from('devops_tasks')
        .delete()
        .eq('user_id', user.id)
        .eq('task_key', key)
        .eq('task_date', todayStr)
      if (err) {
        console.error('[daily-checklist] delete failed:', { message: err.message, code: err.code, details: err.details })
        error = err
      }
    } else {
      const { error: err } = await supabase.from('devops_tasks').upsert(
        { user_id: user.id, task_key: key, task_date: todayStr },
        { onConflict: 'user_id,task_key,task_date' }
      )
      if (err) {
        console.error('[daily-checklist] upsert failed:', { message: err.message, code: err.code, details: err.details })
        error = err
      }
    }

    setPending((prev) => { const n = new Set(prev); n.delete(key); return n })
    if (error) {
      setChecked((prev) => {
        const next = new Set(prev)
        isChecked ? next.add(key) : next.delete(key)
        return next
      })
      return
    }
    router.refresh()
  }

  const doneCount = checked.size

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
          Daily Checklist
        </p>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--devops-accent, #3b82f6)' }}
        >
          {doneCount}/{tasks.length}
        </span>
      </div>

      {tasks.map((task) => {
        const isChecked = checked.has(task.key)
        const isPending = pending.has(task.key)
        return (
          <button
            key={task.key}
            onClick={() => toggle(task.key)}
            disabled={isPending}
            className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
            style={{
              background: isChecked ? 'rgba(59,130,246,0.08)' : 'var(--card)',
              border: `1px solid ${isChecked ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
              opacity: isPending ? 0.6 : 1,
            }}
          >
            <div
              className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
              style={{
                borderColor: isChecked ? CATEGORY_COLORS[task.category] : 'var(--border)',
                background: isChecked ? CATEGORY_COLORS[task.category] : 'transparent',
              }}
            >
              {isChecked && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: isChecked ? 'var(--muted-foreground)' : 'var(--foreground)', textDecoration: isChecked ? 'line-through' : 'none' }}>
                {task.label}
              </p>
            </div>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
            >
              {task.category}
            </span>
          </button>
        )
      })}
    </div>
  )
}
