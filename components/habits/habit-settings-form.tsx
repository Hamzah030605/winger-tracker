'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_META, CATEGORY_ORDER, type HabitCategory } from '@/lib/habits'
import type { Habit } from '@/types/database'

export function HabitSettingsForm({ habits }: { habits: Habit[] }) {
  const router = useRouter()
  const [pending, setPending] = useState<Set<string>>(new Set())

  async function toggle(habit: Habit) {
    if (pending.has(habit.id)) return
    setPending((p) => new Set(p).add(habit.id))
    const supabase = createClient()
    const { error } = await supabase.from('habits').update({ is_active: !habit.is_active }).eq('id', habit.id)
    setPending((p) => { const n = new Set(p); n.delete(habit.id); return n })
    if (error) {
      console.error('[habit-settings] update failed:', { message: error.message, code: error.code, details: error.details })
      return
    }
    router.refresh()
  }

  const grouped = CATEGORY_ORDER.reduce<Record<string, Habit[]>>((acc, cat) => {
    acc[cat] = habits.filter((h) => h.category === cat)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {CATEGORY_ORDER.map((cat) => {
        const meta = CATEGORY_META[cat as HabitCategory]
        const group = grouped[cat] ?? []
        if (group.length === 0) return null
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{meta.emoji}</span>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: meta.color }}>
                {meta.label}
              </p>
            </div>
            <div className="space-y-2">
              {group.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <p
                    className="text-sm font-medium flex-1 mr-4"
                    style={{ color: habit.is_active ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                  >
                    {habit.name}
                  </p>
                  <button
                    onClick={() => toggle(habit)}
                    disabled={pending.has(habit.id)}
                    className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors"
                    style={{
                      background: habit.is_active ? meta.color : 'var(--secondary)',
                      opacity: pending.has(habit.id) ? 0.6 : 1,
                    }}
                    aria-label={habit.is_active ? 'Disable habit' : 'Enable habit'}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                      style={{ transform: habit.is_active ? 'translateX(22px)' : 'translateX(2px)' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
