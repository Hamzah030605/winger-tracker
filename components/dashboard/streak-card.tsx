export function StreakCard({ streak }: { streak: number }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold"
        style={{
          background: streak > 0 ? 'rgba(251,191,36,0.15)' : 'var(--muted)',
          color: streak > 0 ? 'var(--streak-gold)' : 'var(--muted-foreground)',
          border: streak > 0 ? '1px solid rgba(251,191,36,0.3)' : '1px solid var(--border)',
        }}
      >
        🔥 {streak}
      </div>
      <span className="text-[10px] mt-1 uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
        Day streak
      </span>
    </div>
  )
}
