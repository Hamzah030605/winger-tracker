'use client'

interface HabitItemProps {
  id: string
  name: string
  color: string
  checked: boolean
  pending: boolean
  onToggle: (id: string) => void
}

export function HabitItem({ id, name, color, checked, pending, onToggle }: HabitItemProps) {
  return (
    <button
      onClick={() => onToggle(id)}
      disabled={pending}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
      style={{
        background: checked ? `${color}12` : 'var(--card)',
        border: `1px solid ${checked ? color + '55' : 'var(--border)'}`,
        opacity: pending ? 0.6 : 1,
      }}
    >
      <div
        className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: checked ? color : 'var(--border)',
          background: checked ? color : 'transparent',
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <p
        className="text-sm font-medium flex-1"
        style={{
          color: checked ? 'var(--muted-foreground)' : 'var(--foreground)',
          textDecoration: checked ? 'line-through' : 'none',
        }}
      >
        {name}
      </p>
    </button>
  )
}
