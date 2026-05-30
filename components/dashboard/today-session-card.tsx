import Link from 'next/link'
import { slugify } from '@/lib/utils'
import type { GymSession, FootballSession } from '@/types/plans'

type Props = {
  session: GymSession | FootballSession
  planType: 'gym' | 'football'
  week: number
  completedToday: boolean
}

export function TodaySessionCard({ session, planType, week, completedToday }: Props) {
  const isGym = planType === 'gym'
  const color = isGym ? 'var(--gym-accent)' : 'var(--football-accent)'
  const sessionId = isGym
    ? `gym-${week}-${(session as GymSession).id}`
    : `football-${week}-${(session as FootballSession).id}`

  const totalItems = isGym
    ? (session as GymSession).blocks.reduce((acc, b) => acc + b.exercises.length, 0)
    : (session as FootballSession).blocks.reduce((acc, b) => acc + b.drills.length, 0)

  return (
    <Link href={`/session/${sessionId}`} className="block">
      <div
        className="rounded-2xl p-4 relative overflow-hidden"
        style={{
          background: 'var(--card)',
          border: `1px solid ${completedToday ? color : 'var(--border)'}`,
        }}
      >
        {/* Color bar */}
        <div
          className="absolute top-0 left-0 bottom-0 w-1 rounded-l-2xl"
          style={{ background: color }}
        />

        <div className="pl-3">
          <div className="flex items-start justify-between">
            <div>
              <span
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color }}
              >
                {isGym ? '🏋️ Gym' : '⚽ Football'}
              </span>
              <h3 className="font-bold text-base mt-0.5 leading-tight" style={{ color: 'var(--foreground)' }}>
                {session.name}
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {totalItems} {isGym ? 'exercises' : 'drills'}
                {isGym && (session as GymSession).hasSAQ ? ' + SAQ finisher' : ''}
              </p>
            </div>
            {completedToday ? (
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
                style={{ background: `${color}20` }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l4 4 6-7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ) : (
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
                style={{ background: 'var(--secondary)' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>

          {completedToday && (
            <p className="text-xs mt-2 font-medium" style={{ color }}>
              ✓ Completed today
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
