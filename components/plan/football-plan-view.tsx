'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { FootballPlan, FootballSession } from '@/types/plans'
import { Badge } from '@/components/ui/badge'

export function FootballPlanView({ plan, currentWeek }: { plan: FootballPlan; currentWeek: number }) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  const phaseForWeek = plan.weeklyProgressions.find((p) => {
    const [start, end] = p.weekRange.split('-').map(Number)
    return currentWeek >= start && currentWeek <= end
  })

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--football-accent)' }}>
          ⚽ Football Plan
        </p>
        <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
          {plan.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          {plan.totalWeeks} weeks · 4 sessions/week · 85 min each
        </p>
      </div>

      {/* Current phase */}
      {phaseForWeek && (
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--football-accent)' }}>
            Week {currentWeek} · {phaseForWeek.label}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            {phaseForWeek.technicalNotes}
          </p>
          <div className="flex gap-3 mt-2">
            <div className="text-xs" style={{ color: 'var(--football-accent)' }}>
              Stamina rest: {phaseForWeek.staminaRest}
            </div>
            <div className="text-xs" style={{ color: 'var(--primary)' }}>
              Fatigue reps rest: {phaseForWeek.fatigueRest}
            </div>
          </div>
        </div>
      )}

      {/* Commit rule */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--primary)' }}>
          The Commit Rule
        </p>
        <p className="text-sm italic leading-relaxed" style={{ color: 'var(--foreground)' }}>
          &ldquo;{plan.commitRule}&rdquo;
        </p>
      </div>

      {/* Sessions */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Weekly Sessions
        </h2>
        <div className="space-y-2">
          {plan.sessions.map((session) => (
            <FootballSessionAccordion
              key={session.id}
              session={session}
              currentWeek={currentWeek}
              isOpen={expandedSession === session.id}
              onToggle={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
            />
          ))}
        </div>
      </div>

      {/* The Six Moves */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Master These 6 Moves
        </h2>
        <div className="space-y-2">
          {plan.sixMoves.map((move, i) => (
            <div
              key={move.name}
              className="rounded-xl p-3"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--primary)', color: 'white' }}
                >
                  {i + 1}
                </span>
                <p className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{move.name}</p>
                <Badge className="text-[10px]" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--football-accent)', border: 'none' }}>
                  {move.style}
                </Badge>
              </div>
              <p className="text-xs ml-7" style={{ color: 'var(--muted-foreground)' }}>
                <span style={{ color: 'var(--foreground)' }}>When: </span>{move.when}
              </p>
              <p className="text-xs ml-7 mt-0.5" style={{ color: '#ef4444' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Mistake: </span>{move.mistake}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FootballSessionAccordion({
  session,
  currentWeek,
  isOpen,
  onToggle,
}: {
  session: FootballSession
  currentWeek: number
  isOpen: boolean
  onToggle: () => void
}) {
  const totalDrills = session.blocks.reduce((acc, b) => acc + b.drills.length, 0)

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left"
        style={{ minHeight: '64px' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--football-accent)' }}>
            Session {session.number} · {session.day}
          </p>
          <p className="font-bold" style={{ color: 'var(--foreground)' }}>{session.name}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {totalDrills} drills · 85 min
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/session/football-${currentWeek}-${session.id}`}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold touch-target flex items-center"
            style={{ background: 'var(--football-accent)', color: '#000', minHeight: '36px' }}
            onClick={(e) => e.stopPropagation()}
          >
            Log
          </Link>
          <span style={{ color: 'var(--muted-foreground)', fontSize: '18px' }}>
            {isOpen ? '−' : '+'}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="border-t px-4 pb-4 pt-3 space-y-4" style={{ borderColor: 'var(--border)' }}>
          {session.blocks.map((block) => (
            <div key={block.name}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                  {block.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{block.timeRange}</p>
              </div>
              <div className="space-y-2">
                {block.drills.map((drill) => (
                  <div
                    key={drill.id}
                    className="rounded-xl p-3"
                    style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{drill.name}</p>
                        <Badge className="text-[10px] mt-1" style={{
                          background: drill.style === 'Neymar' ? 'rgba(99,102,241,0.2)' : drill.style === 'CR7' ? 'rgba(255,77,28,0.15)' : 'rgba(16,185,129,0.15)',
                          color: drill.style === 'Neymar' ? '#818cf8' : drill.style === 'CR7' ? 'var(--primary)' : 'var(--football-accent)',
                          border: 'none',
                        }}>
                          {drill.style}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge className="text-xs" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--football-accent)', border: 'none' }}>
                        {drill.reps}
                      </Badge>
                      <Badge className="text-xs" style={{ background: 'var(--card)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
                        Rest: {drill.rest}
                      </Badge>
                    </div>
                    {drill.setup && (
                      <p className="text-xs mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
                        <span style={{ color: 'var(--foreground)' }}>Setup: </span>{drill.setup}
                      </p>
                    )}
                    {drill.decisionCue && (
                      <p className="text-xs mt-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,77,28,0.08)', color: 'var(--primary)' }}>
                        🎯 {drill.decisionCue}
                      </p>
                    )}
                    <p className="text-xs mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
                      <span style={{ color: 'var(--foreground)' }}>Trains: </span>{drill.trains}
                    </p>
                    {drill.weeklyProgression && (
                      <p className="text-xs mt-1" style={{ color: 'var(--football-accent)' }}>
                        📈 Progression: {drill.weeklyProgression}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
