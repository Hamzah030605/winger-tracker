'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_META, CATEGORY_ORDER, type HabitCategory } from '@/lib/habits'
import { HabitItem } from './habit-item'
import type { Habit } from '@/types/database'

interface HabitWithLog extends Habit {
  logged_today: boolean
}

export function HabitChecklist({
  habits,
  todayStr,
  userId,
}: {
  habits: HabitWithLog[]
  todayStr: string
  userId: string
}) {
  const router = useRouter()
  const [checked, setChecked] = useState<Set<string>>(
    new Set(habits.filter((h) => h.logged_today).map((h) => h.id))
  )
  const [pending, setPending] = useState<Set<string>>(new Set())

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
      await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('logged_date', todayStr)
    } else {
      await supabase.from('habit_logs').upsert(
        { user_id: userId, habit_id: habitId, logged_date: todayStr },
        { onConflict: 'habit_id,logged_date' }
      )
    }

    setPending((prev) => { const n = new Set(prev); n.delete(habitId); return n })
    router.refresh()
  }

  const activeHabits = habits.filter((h) => h.is_active)
  const doneCount = activeHabits.filter((h) => checked.has(h.id)).length
  const pct = activeHabits.length > 0 ? Math.round((doneCount / activeHabits.length) * 100) : 0

  const grouped = CATEGORY_ORDER.reduce<Record<string, HabitWithLog[]>>((acc, cat) => {
    acc[cat] = activeHabits.filter((h) => h.category === cat)
    return acc
  }, {})

  return (
    <div className="space-y-1">
      {/* Overall progress bar */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Today&apos;s Habits
          </p>
          <span className="text-sm font-bold" style={{ color: pct === 100 ? '#10b981' : 'var(--primary)' }}>
            {doneCount}/{activeHabits.length}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct === 100 ? '#10b981' : 'var(--primary)',
            }}
          />
        </div>
        {pct === 100 && (
          <p className="text-xs mt-2 font-medium" style={{ color: '#10b981' }}>
            Perfect day. Allah ybarek. 🌟
          </p>
        )}
      </div>

      {/* Categories */}
      {CATEGORY_ORDER.map((cat) => {
        const group = grouped[cat] ?? []
        if (group.length === 0) return null
        const meta = CATEGORY_META[cat as HabitCategory]
        const catDone = group.filter((h) => checked.has(h.id)).length

        return (
          <div key={cat} className="mb-5">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <span className="text-sm">{meta.emoji}</span>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: meta.color }}>
                  {meta.label}
                </p>
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {catDone}/{group.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {group.map((habit) => (
                <HabitItem
                  key={habit.id}
                  id={habit.id}
                  name={habit.name}
                  color={meta.color}
                  checked={checked.has(habit.id)}
                  pending={pending.has(habit.id)}
                  onToggle={toggle}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
