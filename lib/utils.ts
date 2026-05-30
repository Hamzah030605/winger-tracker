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
