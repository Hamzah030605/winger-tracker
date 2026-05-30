'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { GymPlan, GymSession } from '@/types/plans'
import { Badge } from '@/components/ui/badge'

export function GymPlanView({ plan, currentWeek }: { plan: GymPlan; currentWeek: number }) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [expandedPhase, setExpandedPhase] = useState<string | null>('1-2')

  const phaseForWeek = plan.weeklyProgressions.find((p) => {
    const [start, end] = p.weekRange.split('-').map(Number)
    return currentWeek >= start && currentWeek <= end
  })

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--gym-accent)' }}>
          🏋️ Gym Programme
        </p>
        <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
          {plan.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          {plan.totalWeeks} weeks · 5 sessions/week
        </p>
      </div>

      {/* Current phase banner */}
      {phaseForWeek && (
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--gym-accent)' }}>
            You are here · Week {currentWeek}
          </p>
          <p className="font-bold" style={{ color: 'var(--foreground)' }}>{phaseForWeek.label}</p>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            {phaseForWeek.gymNotes}
          </p>
        </div>
      )}

      {/* Sessions list */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Weekly Sessions
        </h2>
        <div className="space-y-2">
          {plan.sessions.map((session) => (
            <SessionAccordion
              key={session.id}
              session={session}
              currentWeek={currentWeek}
              isOpen={expandedSession === session.id}
              onToggle={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
            />
          ))}
        </div>
      </div>

      {/* Contrast pairs (shown when active) */}
      {phaseForWeek?.contrastPairsActive && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
            Contrast Pairs (Wks 3–4)
          </h2>
          <div className="space-y-2">
            {plan.contrastPairs.map((pair, i) => (
              <div
                key={i}
                className="rounded-xl p-3"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--gym-accent)' }}>
                  Pair {i + 1}
                </p>
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  A1: {pair.strength.name} {pair.strength.sets}×{pair.strength.reps} @ RPE {pair.strength.rpe}
                </p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  ↓ Immediately into A2: {pair.plyo.name} × {pair.plyo.reps}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly volume targets */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Weekly Volume Targets
        </h2>
        <div className="space-y-1.5">
          {Object.entries(plan.volumeTargets).map(([muscle, target]) => (
            <div
              key={muscle}
              className="flex items-start justify-between gap-3 py-2 px-3 rounded-lg"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{muscle}</span>
              <span className="text-xs text-right" style={{ color: 'var(--muted-foreground)' }}>{target}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SessionAccordion({
  session,
  currentWeek,
  isOpen,
  onToggle,
}: {
  session: GymSession
  currentWeek: number
  isOpen: boolean
  onToggle: () => void
}) {
  const totalExercises = session.blocks.reduce((acc, b) => acc + b.exercises.length, 0)

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left touch-target"
        style={{ minHeight: '64px' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--gym-accent)' }}>
            {session.day}
          </p>
          <p className="font-bold" style={{ color: 'var(--foreground)' }}>{session.name}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {totalExercises} exercises{session.hasSAQ ? ' + 20min SAQ' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/session/gym-${currentWeek}-${session.id}`}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold touch-target flex items-center"
            style={{ background: 'var(--gym-accent)', color: '#000', minHeight: '36px' }}
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
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>
                {block.name}
              </p>
              <div className="space-y-2">
                {block.exercises.map((ex) => (
                  <div
                    key={ex.name}
                    className="rounded-xl p-3"
                    style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
                  >
                    <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{ex.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <Badge className="text-xs" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--gym-accent)', border: 'none' }}>
                        {ex.sets} × {ex.reps}
                      </Badge>
                      {ex.tempo && (
                        <Badge className="text-xs" style={{ background: 'var(--card)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
                          {ex.tempo}
                        </Badge>
                      )}
                      <Badge className="text-xs" style={{ background: 'var(--card)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
                        Rest: {ex.rest}
                      </Badge>
                    </div>
                    {ex.notes && (
                      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                        {ex.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {session.hasSAQ && session.saqBlocks && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--primary)' }}>
                SAQ Finisher (20 min)
              </p>
              <div className="space-y-2">
                {session.saqBlocks.map((block) => (
                  <div
                    key={block.name}
                    className="rounded-xl p-3"
                    style={{ background: 'rgba(255,77,28,0.08)', border: '1px solid rgba(255,77,28,0.2)' }}
                  >
                    <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{block.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {block.duration} — {block.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
