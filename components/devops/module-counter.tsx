'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function ModuleCounter({
  slug,
  totalModules,
  initialCompleted,
}: {
  slug: string
  totalModules: number
  initialCompleted: number
}) {
  const router = useRouter()
  const [count, setCount] = useState(initialCompleted)
  const [saving, setSaving] = useState(false)

  async function update(next: number) {
    if (next < 0 || next > totalModules) return
    const prev = count
    setCount(next)
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCount(prev); setSaving(false); return }
    const { error } = await supabase.from('devops_topics').upsert(
      { user_id: user.id, topic_slug: slug, completed_modules: next, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,topic_slug' }
    )
    if (error) {
      console.error('[module-counter] upsert failed:', { message: error.message, code: error.code, details: error.details })
      setCount(prev)
      setSaving(false)
      return
    }
    setSaving(false)
    router.refresh()
  }

  const pct = totalModules > 0 ? Math.round((count / totalModules) * 100) : 0

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => update(count - 1)}
          disabled={saving || count === 0}
          className="w-9 h-9 rounded-full border flex items-center justify-center text-lg font-bold transition-opacity disabled:opacity-30"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          −
        </button>
        <div className="flex-1 text-center">
          <span className="text-2xl font-bold" style={{ color: 'var(--devops-accent, #3b82f6)' }}>{count}</span>
          <span className="text-lg" style={{ color: 'var(--muted-foreground)' }}> / {totalModules}</span>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>modules completed</p>
        </div>
        <button
          onClick={() => update(count + 1)}
          disabled={saving || count === totalModules}
          className="w-9 h-9 rounded-full border flex items-center justify-center text-lg font-bold transition-opacity disabled:opacity-30"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          +
        </button>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: 'var(--devops-accent, #3b82f6)' }}
        />
      </div>
    </div>
  )
}
