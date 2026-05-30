import Link from 'next/link'

interface Props {
  habitScore: number      // 0–100
  gymScore: number        // 0–100
  footballScore: number   // 0–100
  devopsScore: number     // 0–100
  arabicScore: number     // 0–100
  preStart: boolean
}

function ScoreBar({
  label,
  score,
  weight,
  color,
}: {
  label: string
  score: number
  weight: string
  color: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium" style={{ color: 'var(--foreground)' }}>{label}</span>
          <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{weight}</span>
        </div>
        <span className="text-[11px] font-bold" style={{ color }}>{score}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  )
}

function scoreColor(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

export function LifeScoreCard({
  habitScore,
  gymScore,
  footballScore,
  devopsScore,
  arabicScore,
  preStart,
}: Props) {
  const total = Math.round(
    habitScore * 0.3 +
    gymScore * 0.2 +
    footballScore * 0.2 +
    devopsScore * 0.2 +
    arabicScore * 0.1
  )

  const totalColor = scoreColor(total)

  // SVG ring
  const r = 28
  const circ = 2 * Math.PI * r
  const dashOffset = circ - (circ * total) / 100

  return (
    <div
      className="rounded-2xl px-4 py-4"
      style={{
        background: 'linear-gradient(135deg, #16161a 0%, #1a1a22 100%)',
        border: `1px solid ${total >= 80 ? 'rgba(16,185,129,0.25)' : total >= 50 ? 'rgba(245,158,11,0.25)' : 'var(--border)'}`,
      }}
    >
      {/* Header + ring */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Life Score
          </p>
          <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            {preStart ? 'Habits active · Training unlocks Monday' : 'This week'}
          </p>
        </div>

        {/* Score ring */}
        <div className="flex flex-col items-center">
          <svg width="64" height="64" viewBox="0 0 70 70">
            <circle cx="35" cy="35" r={r} fill="none" stroke="var(--secondary)" strokeWidth="6" />
            <circle
              cx="35" cy="35" r={r}
              fill="none"
              stroke={totalColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 35 35)"
              style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
            />
            <text x="35" y="40" textAnchor="middle" fontSize="13" fontWeight="800" fill={totalColor}>
              {total}%
            </text>
          </svg>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-2.5">
        <ScoreBar label="Habits"   weight="30%"  score={habitScore}    color="#8b5cf6" />
        <ScoreBar label="Gym"      weight="20%"  score={gymScore}      color="var(--gym-accent)" />
        <ScoreBar label="Football" weight="20%"  score={footballScore} color="var(--football-accent)" />
        <ScoreBar label="DevOps"   weight="20%"  score={devopsScore}   color="var(--devops-accent)" />
        <ScoreBar label="Arabic"   weight="10%"  score={arabicScore}   color="#f97316" />
      </div>

      {/* View progress link */}
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <Link
          href="/progress"
          className="text-[11px] font-semibold"
          style={{ color: 'var(--muted-foreground)' }}
        >
          View full history →
        </Link>
      </div>
    </div>
  )
}
