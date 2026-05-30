import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { seedHabitsIfMissing, CATEGORY_META, CATEGORY_ORDER, type HabitCategory } from '@/lib/habits'
import { HistoryHeatmap } from '@/components/habits/history-heatmap'
import Link from 'next/link'

export default async function HabitsHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await seedHabitsIfMissing(supabase, user.id)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  const fromStr = thirtyDaysAgo.toLocaleDateString('sv-SE')

  const [{ data: habits }, { data: logs }] = await Promise.all([
    supabase.from('habits').select('id,category,is_active').eq('user_id', user.id),
    supabase
      .from('habit_logs')
      .select('habit_id,logged_date')
      .eq('user_id', user.id)
      .gte('logged_date', fromStr),
  ])

  const activeHabits = (habits ?? []).filter((h) => h.is_active)
  const totalActive = activeHabits.length

  // Build 30-day grid aligned to Monday
  const days: Array<{ date: string; total: number; done: number }> = []
  const logsByDate = new Map<string, Set<string>>()
  for (const log of logs ?? []) {
    if (!logsByDate.has(log.logged_date)) logsByDate.set(log.logged_date, new Set())
    logsByDate.get(log.logged_date)!.add(log.habit_id)
  }

  // Start from the Monday on or before 29 days ago
  const start = new Date(thirtyDaysAgo)
  const dayOfWeek = (start.getDay() + 6) % 7 // 0=Mon
  start.setDate(start.getDate() - dayOfWeek)

  const end = new Date()
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toLocaleDateString('sv-SE')
    const logged = logsByDate.get(dateStr)
    days.push({
      date: dateStr,
      total: totalActive,
      done: logged ? logged.size : 0,
    })
  }

  // Per-category streak calculation (days in a row where all habits in that category are done)
  const todayStr = new Date().toLocaleDateString('sv-SE')

  function calcCategoryStreak(category: string): number {
    const catHabits = activeHabits.filter((h) => h.category === category)
    if (catHabits.length === 0) return 0
    const catIds = new Set(catHabits.map((h) => h.id))
    let streak = 0
    const cursor = new Date()
    while (true) {
      const dateStr = cursor.toLocaleDateString('sv-SE')
      const logged = logsByDate.get(dateStr)
      const allDone = logged ? catIds.size === [...catIds].filter((id) => logged.has(id)).length : false
      if (!allDone) {
        if (dateStr === todayStr) { cursor.setDate(cursor.getDate() - 1); continue }
        break
      }
      streak++
      cursor.setDate(cursor.getDate() - 1)
      if (streak > 365) break
    }
    return streak
  }

  // Overall habit streak (at least 1 habit done)
  function calcOverallStreak(): number {
    let streak = 0
    const cursor = new Date()
    while (true) {
      const dateStr = cursor.toLocaleDateString('sv-SE')
      const logged = logsByDate.get(dateStr)
      const anyDone = logged && logged.size > 0
      if (!anyDone) {
        if (dateStr === todayStr) { cursor.setDate(cursor.getDate() - 1); continue }
        break
      }
      streak++
      cursor.setDate(cursor.getDate() - 1)
      if (streak > 365) break
    }
    return streak
  }

  const overallStreak = calcOverallStreak()

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--primary)' }}>
            Life OS
          </p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Habit History</h1>
        </div>
        <Link
          href="/habits"
          className="text-xs font-medium px-3 py-2 rounded-xl"
          style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
        >
          ← Back
        </Link>
      </div>

      {/* Overall streak */}
      <div
        className="rounded-2xl p-4 flex items-center gap-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="text-4xl font-bold" style={{ color: 'var(--streak-gold)' }}>{overallStreak}</div>
        <div>
          <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Day Streak</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>At least one habit completed per day</p>
        </div>
      </div>

      {/* 30-day heatmap */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
          30-Day Overview
        </h2>
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <HistoryHeatmap days={days} />
        </div>
      </div>

      {/* Per-category streaks */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Category Streaks
        </h2>
        <div className="space-y-2">
          {CATEGORY_ORDER.map((cat) => {
            const meta = CATEGORY_META[cat as HabitCategory]
            const catHabits = activeHabits.filter((h) => h.category === cat)
            if (catHabits.length === 0) return null
            const streak = calcCategoryStreak(cat)
            return (
              <div
                key={cat}
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{meta.emoji}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{meta.label}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{catHabits.length} habits</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ color: streak > 0 ? meta.color : 'var(--muted-foreground)' }}>
                    {streak}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>day streak</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Link to training progress */}
      <Link
        href="/progress"
        className="block rounded-2xl px-4 py-4 text-center"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>View Training History</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Sessions, calendar heatmap &amp; weekly stats</p>
      </Link>
    </div>
  )
}
