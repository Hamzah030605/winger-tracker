'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function AdvanceWeekButton({ currentWeek, maxWeek }: { currentWeek: number; maxWeek: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (currentWeek >= maxWeek) {
    return (
      <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="font-bold" style={{ color: 'var(--primary)' }}>🏆 Programme Complete!</p>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          You finished all {maxWeek} weeks. Incredible work.
        </p>
      </div>
    )
  }

  async function advance() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('profiles')
      .update({ current_week: currentWeek + 1 })
      .eq('user_id', user.id)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={advance}
      disabled={loading}
      className="w-full py-3 rounded-xl text-sm font-medium transition-opacity disabled:opacity-50"
      style={{
        background: 'var(--secondary)',
        color: 'var(--muted-foreground)',
        border: '1px solid var(--border)',
      }}
    >
      {loading ? 'Saving…' : `Advance to Week ${currentWeek + 1} →`}
    </button>
  )
}
