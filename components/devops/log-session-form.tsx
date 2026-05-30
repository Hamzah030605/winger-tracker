'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DEVOPS_TOPICS } from '@/lib/devops'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function LogSessionForm() {
  const router = useRouter()
  const [topicSlug, setTopicSlug] = useState(DEVOPS_TOPICS[0].slug)
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function submit() {
    const mins = parseInt(duration)
    if (!mins || mins < 1) return
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error } = await supabase.from('devops_logs').insert({
      user_id: user.id,
      topic_slug: topicSlug,
      duration_minutes: mins,
      notes: notes.trim() || null,
    })

    if (error) {
      console.error('[log-session] insert failed:', { message: error.message, code: error.code, details: error.details })
      setSaving(false)
      return
    }

    setDuration('')
    setNotes('')
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
        Log Study Session
      </p>

      <div>
        <label className="text-xs mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Topic</label>
        <select
          value={topicSlug}
          onChange={(e) => setTopicSlug(e.target.value)}
          className="w-full h-11 rounded-xl px-3 text-sm"
          style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        >
          {DEVOPS_TOPICS.map((t) => (
            <option key={t.slug} value={t.slug}>{t.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Duration (minutes)</label>
        <Input
          type="number"
          inputMode="numeric"
          placeholder="e.g. 45"
          min="1"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="h-11 text-base"
          style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />
      </div>

      <div>
        <label className="text-xs mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Notes (optional)</label>
        <Textarea
          placeholder="What did you cover? Any blockers?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[80px] text-sm"
          style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />
      </div>

      <button
        onClick={submit}
        disabled={saving || !duration}
        className="w-full h-12 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40"
        style={{ background: 'var(--devops-accent, #3b82f6)', color: 'white' }}
      >
        {saved ? 'Session logged ✓' : saving ? 'Saving…' : 'Log Session'}
      </button>
    </div>
  )
}
