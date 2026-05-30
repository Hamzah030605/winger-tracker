'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_META, type HabitCategory } from '@/lib/habits'
import Link from 'next/link'
import type { Habit } from '@/types/database'

interface HabitWithLog extends Habit {
  logged_today: boolean
}

export function QuickHabits({
  habits,
  todayStr,
  userId,
  doneCount,
  totalCount,
}: {
  habits: HabitWithLog[]
  todayStr: string
  userId: string
  doneCount: number
  totalCount: number
}) {
  const router = useRouter()
  const [checked, setChecked] = useState<Set<string>>(
    new Set(habits.filter((h) => h.logged_today).map((h) => h.id))
  )
  const [pending, setPending] = useState<Set<string>>(new Set())

  const localDone = doneCount - habits.filter((h) => h.logged_today).length + checked.size

  async function toggle(habitId: string) {
    if (pending.has(habitId)) return
    const isChecked = checked.has(habitId)
    setChecked((prev) => {
      const next = new Set(prev)
      isChecked ? next.delete(habitId) : next.add(habitId)
      return next
    })
    setPending((prev) => new Set(prev).add(habitId))
    const supabase = createClient()
    if (isChecked) {
      await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('logged_date', todayStr)
    } else {
      await supabase.from('habit_logs').upsert(
        { user_id: userId, habit_id: habitId, logged_date: todayStr },
        { onConflict: 'habit_id,logged_date' }
      )
    }
    setPending((prev) => { const n = new Set(prev); n.delete(habitId); return n })
    router.refresh()
  }

  const pct = totalCount > 0 ? Math.round((localDone / totalCount) * 100) : 0

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Daily Habits</p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{localDone}/{totalCount} complete</p>
        </div>
        <Link href="/habits" className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
          See all →
        </Link>
      </div>

      {/* Progress bar */}
      <div className="mx-4 mb-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : 'var(--primary)' }}
        />
      </div>

      {/* Quick habits */}
      <div className="px-4 pb-4 space-y-1.5">
        {habits.map((habit) => {
          const meta = CATEGORY_META[habit.category as HabitCategory]
          const isChecked = checked.has(habit.id)
          return (
            <button
              key={habit.id}
              onClick={() => toggle(habit.id)}
              disabled={pending.has(habit.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
              style={{
                background: isChecked ? `${meta.color}12` : 'var(--secondary)',
                border: `1px solid ${isChecked ? meta.color + '44' : 'transparent'}`,
                opacity: pending.has(habit.id) ? 0.6 : 1,
              }}
            >
              <div
                className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                style={{
                  borderColor: isChecked ? meta.color : 'var(--border)',
                  background: isChecked ? meta.color : 'transparent',
                }}
              >
                {isChecked && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <p
                className="text-xs font-medium flex-1"
                style={{
                  color: isChecked ? 'var(--muted-foreground)' : 'var(--foreground)',
                  textDecoration: isChecked ? 'line-through' : 'none',
                }}
              >
                {habit.name}
              </p>
              <span className="text-xs">{meta.emoji}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
