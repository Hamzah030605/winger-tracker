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

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89)
  const fromStr = ninetyDaysAgo.toLocaleDateString('sv-SE')

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

  // Build date → logged habit ids map
  const logsByDate = new Map<string, Set<string>>()
  for (const log of logs ?? []) {
    if (!logsByDate.has(log.logged_date)) logsByDate.set(log.logged_date, new Set())
    logsByDate.get(log.logged_date)!.add(log.habit_id)
  }

  const todayStr = new Date().toLocaleDateString('sv-SE')

  // Overall streak
  function calcCurrentStreak(): number {
    let streak = 0
    const cursor = new Date()
    let skippedToday = false
    while (true) {
      const dateStr = cursor.toLocaleDateString('sv-SE')
      const logged = logsByDate.get(dateStr)
      const anyDone = logged && logged.size > 0
      if (!anyDone) {
        if (dateStr === todayStr && !skippedToday) {
          skippedToday = true
          cursor.setDate(cursor.getDate() - 1)
          continue
        }
        break
      }
      streak++
      cursor.setDate(cursor.getDate() - 1)
      if (streak > 365) break
    }
    return streak
  }

  // Best streak (longest consecutive run in the 90-day window)
  function calcBestStreak(): number {
    const dates = [...logsByDate.entries()]
      .filter(([, ids]) => ids.size > 0)
      .map(([d]) => d)
      .sort()
    if (dates.length === 0) return 0
    let best = 1
    let current = 1
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1] + 'T12:00:00')
      const curr = new Date(dates[i] + 'T12:00:00')
      const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000)
      if (diff === 1) {
        current++
        best = Math.max(best, current)
      } else {
        current = 1
      }
    }
    return best
  }

  // 30-day completion %
  function calc30DayPct(): number {
    let daysWithActivity = 0
    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('sv-SE')
      const logged = logsByDate.get(dateStr)
      if (logged && logged.size > 0) daysWithActivity++
    }
    return Math.round((daysWithActivity / 30) * 100)
  }

  const currentStreak = calcCurrentStreak()
  const bestStreak = calcBestStreak()
  const thirtyDayPct = calc30DayPct()

  // Category streak helper
  function calcCategoryStreak(category: string): number {
    const catHabits = activeHabits.filter((h) => h.category === category)
    if (catHabits.length === 0) return 0
    const catIds = new Set(catHabits.map((h) => h.id))
    let streak = 0
    const cursor = new Date()
    let skippedToday = false
    while (true) {
      const dateStr = cursor.toLocaleDateString('sv-SE')
      const logged = logsByDate.get(dateStr)
      const allDone = logged ? [...catIds].every((id) => logged.has(id)) : false
      if (!allDone) {
        if (dateStr === todayStr && !skippedToday) {
          skippedToday = true
          cursor.setDate(cursor.getDate() - 1)
          continue
        }
        break
      }
      streak++
      cursor.setDate(cursor.getDate() - 1)
      if (streak > 365) break
    }
    return streak
  }

  // 30-day heatmap grid aligned to Monday
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  const start = new Date(thirtyDaysAgo)
  const dayOfWeek = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - dayOfWeek)

  const heatmapDays: Array<{ date: string; total: number; done: number }> = []
  const end = new Date()
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toLocaleDateString('sv-SE')
    const logged = logsByDate.get(dateStr)
    heatmapDays.push({ date: dateStr, total: totalActive, done: logged ? logged.size : 0 })
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-0.5" style={{ color: 'var(--primary)' }}>
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

      {/* Streak + stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Current streak', value: currentStreak, suffix: ' days', color: 'var(--streak-gold)' },
          { label: 'Best streak', value: bestStreak, suffix: ' days', color: 'var(--primary)' },
          { label: '30-day rate', value: thirtyDayPct, suffix: '%', color: '#10b981' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-3 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="text-xl font-bold leading-tight" style={{ color: s.color }}>
              {s.value}
              <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{s.suffix}</span>
            </p>
            <p className="text-[9px] mt-1 uppercase tracking-wide font-semibold" style={{ color: 'var(--muted-foreground)' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* 30-day heatmap */}
      <div>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: 'var(--muted-foreground)' }}>
          30-Day Overview
        </h2>
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <HistoryHeatmap days={heatmapDays} />
        </div>
      </div>

      {/* Per-category streaks */}
      <div>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: 'var(--muted-foreground)' }}>
          Category Streaks
        </h2>
        <div className="space-y-1.5">
          {CATEGORY_ORDER.map((cat) => {
            const meta = CATEGORY_META[cat as HabitCategory]
            const catHabits = activeHabits.filter((h) => h.category === cat)
            if (catHabits.length === 0) return null
            const streak = calcCategoryStreak(cat)
            return (
              <div
                key={cat}
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{
                  background: 'var(--card)',
                  border: `1px solid ${streak > 0 ? meta.color + '33' : 'var(--border)'}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{meta.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{meta.label}</p>
                    <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{catHabits.length} habits</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ color: streak > 0 ? meta.color : 'var(--muted-foreground)' }}>
                    {streak}
                  </p>
                  <p className="text-[9px] uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>day streak</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Training progress link */}
      <Link
        href="/progress"
        className="flex items-center justify-between rounded-2xl px-4 py-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Training History</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Sessions, calendar & weekly stats</p>
        </div>
        <span style={{ color: 'var(--muted-foreground)' }}>→</span>
      </Link>
    </div>
  )
}
