import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDayOfWeek(): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    new Date().getDay()
  ]
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0

  const dates = completedDates
    .map((d) => new Date(d).toDateString())
    .filter((d, i, arr) => arr.indexOf(d) === i) // unique days
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime())

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let streak = 0
  let cursor = new Date(today)

  for (const date of dates) {
    date.setHours(0, 0, 0, 0)
    if (date.getTime() === cursor.getTime()) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else if (date.getTime() < cursor.getTime()) {
      break
    }
  }

  return streak
}

export function getWeekDates(weekOffset = 0): Date[] {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// ─── Programme week helpers ───────────────────────────────────────────────────

/**
 * Returns the next upcoming Monday as a YYYY-MM-DD string.
 * If `from` is already Monday, returns that Monday.
 */
export function getNextMonday(from: Date = new Date()): string {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  if (dow !== 1) {
    const daysToAdd = dow === 0 ? 1 : 8 - dow
    d.setDate(d.getDate() + daysToAdd)
  }
  return d.toLocaleDateString('sv-SE')
}

/**
 * Returns the programme week number (1–6) calculated from plan_start_date.
 * Returns 0 if today is before plan_start_date (pre-start).
 */
export function calculateCurrentWeek(planStartDate: string, totalWeeks = 6): number {
  const start = new Date(planStartDate)
  start.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (today < start) return 0
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.min(Math.floor(diffDays / 7) + 1, totalWeeks)
}

/**
 * Returns true if today is before plan_start_date.
 */
export function isPreStart(planStartDate: string): boolean {
  return calculateCurrentWeek(planStartDate) === 0
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function parseSessionId(id: string): {
  planType: 'gym' | 'football'
  week: number
  sessionSlug: string
} | null {
  const parts = id.split('-')
  if (parts.length < 3) return null
  const planType = parts[0] as 'gym' | 'football'
  const week = parseInt(parts[1], 10)
  const sessionSlug = parts.slice(2).join('-')
  if (!['gym', 'football'].includes(planType) || isNaN(week)) return null
  return { planType, week, sessionSlug }
}
