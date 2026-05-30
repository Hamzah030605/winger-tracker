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
    let error: unknown = null
    if (isChecked) {
      const { error: err } = await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('logged_date', todayStr)
      if (err) {
        console.error('[habit-checklist] delete failed:', { message: err.message, code: err.code, details: err.details })
        error = err
      }
    } else {
      const { error: err } = await supabase.from('habit_logs').upsert(
        { user_id: userId, habit_id: habitId, logged_date: todayStr },
        { onConflict: 'habit_id,logged_date' }
      )
      if (err) {
        console.error('[habit-checklist] upsert failed:', { message: err.message, code: err.code, details: err.details })
        error = err
      }
    }
    setPending((prev) => { const n = new Set(prev); n.delete(habitId); return n })
    if (error) {
      // Revert optimistic update — DB write failed
      setChecked((prev) => {
        const next = new Set(prev)
        isChecked ? next.add(habitId) : next.delete(habitId)
        return next
      })
      return
    }
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
    <div className="space-y-2">
      {/* Overall progress */}
      <div
        className="rounded-2xl px-4 py-3.5"
        style={{
          background: pct === 100
            ? 'linear-gradient(135deg, #052e16 0%, #14532d22 100%)'
            : 'linear-gradient(135deg, #16161a 0%, #1a1a22 100%)',
          border: `1px solid ${pct === 100 ? '#16a34a55' : 'var(--border)'}`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Today&apos;s Habits</p>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: pct === 100 ? '#16a34a33' : 'rgba(255,77,28,0.15)',
              color: pct === 100 ? '#4ade80' : 'var(--primary)',
            }}
          >
            {doneCount}/{activeHabits.length} · {pct}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct === 100 ? '#10b981' : pct > 50 ? '#f59e0b' : 'var(--primary)',
            }}
          />
        </div>
        {pct === 100 && (
          <p className="text-xs mt-2 font-semibold text-center" style={{ color: '#4ade80' }}>
            Perfect day. Allah ybarek. 🌿
          </p>
        )}
      </div>

      {/* Category cards */}
      {CATEGORY_ORDER.map((cat) => {
        const group = grouped[cat] ?? []
        if (group.length === 0) return null
        const meta = CATEGORY_META[cat as HabitCategory]
        const catDone = group.filter((h) => checked.has(h.id)).length
        const catPct = group.length > 0 ? Math.round((catDone / group.length) * 100) : 0
        const catComplete = catDone === group.length

        return (
          <div
            key={cat}
            className="rounded-2xl overflow-hidden"
            style={{
              background: catComplete ? `${meta.color}0d` : 'var(--card)',
              border: `1px solid ${catComplete ? meta.color + '33' : 'var(--border)'}`,
            }}
          >
            {/* Category header */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{
                background: `linear-gradient(90deg, ${meta.color}14 0%, transparent 100%)`,
                borderBottom: `1px solid ${catComplete ? meta.color + '25' : 'var(--border)'}`,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{meta.emoji}</span>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: meta.color }}>
                  {meta.label}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Mini progress bar */}
                <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${catPct}%`, background: meta.color }}
                  />
                </div>
                <span className="text-[10px] font-bold w-8 text-right" style={{ color: catComplete ? meta.color : 'var(--muted-foreground)' }}>
                  {catPct}%
                </span>
              </div>
            </div>

            {/* Habits */}
            <div className="p-2 space-y-1">
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
