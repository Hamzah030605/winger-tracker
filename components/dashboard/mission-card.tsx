'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_META, type HabitCategory } from '@/lib/habits'
import Link from 'next/link'
import type { Habit } from '@/types/database'

const MISSION_NAMES = [
  'Pray 5 Salah in the Mosque',
  'Quran 10–20 mins',
  'DevOps Study 60+ mins',
  'Arabic Study',
  'Football Session / Ball Mastery',
]

interface HabitWithLog extends Habit {
  logged_today: boolean
}

export function MissionCard({
  habits,
  todayStr,
  userId,
  hasFootballToday,
}: {
  habits: HabitWithLog[]
  todayStr: string
  userId: string
  hasFootballToday: boolean
}) {
  const router = useRouter()
  const missionHabits = habits.filter((h) => {
    if (!MISSION_NAMES.includes(h.name)) return false
    if (h.name === 'Football Session / Ball Mastery' && !hasFootballToday) return false
    return true
  })

  const [checked, setChecked] = useState<Set<string>>(
    new Set(missionHabits.filter((h) => h.logged_today).map((h) => h.id))
  )
  const [pending, setPending] = useState<Set<string>>(new Set())

  const doneCount = checked.size
  const totalCount = missionHabits.length
  const allDone = doneCount === totalCount && totalCount > 0

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
        console.error('[mission-card] delete failed:', { message: err.message, code: err.code, details: err.details })
        error = err
      }
    } else {
      const { error: err } = await supabase.from('habit_logs').upsert(
        { user_id: userId, habit_id: habitId, logged_date: todayStr },
        { onConflict: 'habit_id,logged_date' }
      )
      if (err) {
        console.error('[mission-card] upsert failed:', { message: err.message, code: err.code, details: err.details })
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

  if (missionHabits.length === 0) return null

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: allDone
          ? 'linear-gradient(135deg, #052e16 0%, #14532d22 100%)'
          : 'linear-gradient(135deg, #16161a 0%, #1e1a2e 100%)',
        border: `1px solid ${allDone ? '#16a34a55' : 'var(--border)'}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: allDone ? '#4ade80' : 'var(--primary)' }}>
            Today&apos;s Mission
          </p>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{
              background: allDone ? '#16a34a33' : 'rgba(255,77,28,0.15)',
              color: allDone ? '#4ade80' : 'var(--primary)',
            }}
          >
            {doneCount}/{totalCount}
          </span>
        </div>
        <Link href="/habits" className="text-[11px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
          All habits →
        </Link>
      </div>

      {/* Mission items */}
      <div className="px-3 pb-3 space-y-1">
        {missionHabits.map((habit) => {
          const meta = CATEGORY_META[habit.category as HabitCategory]
          const isChecked = checked.has(habit.id)
          const isPending = pending.has(habit.id)
          return (
            <button
              key={habit.id}
              onClick={() => toggle(habit.id)}
              disabled={isPending}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
              style={{
                background: isChecked ? `${meta.color}14` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isChecked ? meta.color + '40' : 'rgba(255,255,255,0.06)'}`,
                opacity: isPending ? 0.6 : 1,
              }}
            >
              <div
                className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                style={{
                  borderColor: isChecked ? meta.color : 'var(--border)',
                  background: isChecked ? meta.color : 'transparent',
                }}
              >
                {isChecked && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-base leading-none">{meta.emoji}</span>
              <p
                className="text-[13px] font-medium flex-1"
                style={{
                  color: isChecked ? 'var(--muted-foreground)' : 'var(--foreground)',
                  textDecoration: isChecked ? 'line-through' : 'none',
                }}
              >
                {habit.name}
              </p>
            </button>
          )
        })}
      </div>

      {allDone && (
        <div className="px-4 pb-3.5">
          <p className="text-xs font-semibold text-center" style={{ color: '#4ade80' }}>
            Mission complete. Barakallahu feek. 🌿
          </p>
        </div>
      )}
    </div>
  )
}
