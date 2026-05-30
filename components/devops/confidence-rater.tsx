'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const LABELS = ['', 'Beginner', 'Shaky', 'Okay', 'Solid', 'Strong']
const COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']

export function ConfidenceRater({
  slug,
  initialConfidence,
}: {
  slug: string
  initialConfidence: number
}) {
  const router = useRouter()
  const [value, setValue] = useState(initialConfidence)
  const [saving, setSaving] = useState(false)

  async function rate(n: number) {
    const next = value === n ? 0 : n
    setValue(next)
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    await supabase.from('devops_topics').upsert(
      { user_id: user.id, topic_slug: slug, confidence: next, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,topic_slug' }
    )
    setSaving(false)
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => rate(n)}
            disabled={saving}
            className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all"
            style={{
              borderColor: n <= value ? COLORS[value] : 'var(--border)',
              background: n <= value ? COLORS[value] : 'transparent',
              color: n <= value ? 'white' : 'var(--muted-foreground)',
            }}
          >
            {n}
          </button>
        ))}
        {value > 0 && (
          <span className="text-xs font-semibold ml-1" style={{ color: COLORS[value] }}>
            {LABELS[value]}
          </span>
        )}
      </div>
      {value === 0 && (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Tap a number to rate your confidence</p>
      )}
    </div>
  )
}
