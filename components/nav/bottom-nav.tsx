'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          stroke={active ? 'var(--primary)' : 'var(--muted-foreground)'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'rgba(255,77,28,0.15)' : 'none'}
        />
        <path
          d="M9 22V12h6v10"
          stroke={active ? 'var(--primary)' : 'var(--muted-foreground)'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/plan/gym',
    label: 'Gym',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M6.5 6.5h11M6.5 17.5h11M4 12h16M2 12h2m18 0h-2"
          stroke={active ? 'var(--gym-accent, #f59e0b)' : 'var(--muted-foreground)'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/plan/football',
    label: 'Football',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke={active ? 'var(--football-accent, #10b981)' : 'var(--muted-foreground)'}
          strokeWidth="2"
        />
        <path
          d="M12 3l2 5-4 3 4 3-2 5"
          stroke={active ? 'var(--football-accent, #10b981)' : 'var(--muted-foreground)'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/devops',
    label: 'DevOps',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="2" y="3" width="20" height="14" rx="2"
          stroke={active ? 'var(--devops-accent, #3b82f6)' : 'var(--muted-foreground)'}
          strokeWidth="2"
        />
        <path
          d="M8 21h8M12 17v4"
          stroke={active ? 'var(--devops-accent, #3b82f6)' : 'var(--muted-foreground)'}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M7 8l2 2-2 2M11 12h4"
          stroke={active ? 'var(--devops-accent, #3b82f6)' : 'var(--muted-foreground)'}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/progress',
    label: 'Progress',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M22 12h-4l-3 9L9 3l-3 9H2"
          stroke={active ? 'var(--primary)' : 'var(--muted-foreground)'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{
        background: 'rgba(13,13,15,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-2 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 touch-target justify-center px-2 py-1 rounded-xl transition-colors"
              style={{
                minHeight: '44px',
                background: active ? 'var(--secondary)' : 'transparent',
              }}
            >
              {item.icon(active)}
              <span
                className="text-[10px] font-medium"
                style={{ color: active ? 'var(--foreground)' : 'var(--muted-foreground)' }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
