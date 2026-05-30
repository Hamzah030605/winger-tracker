'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Textarea } from '@/components/ui/textarea'

export function NotesEditor({
  slug,
  initialNotes,
}: {
  slug: string
  initialNotes: string
}) {
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    await supabase.from('devops_topics').upsert(
      { user_id: user.id, topic_slug: slug, notes, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,topic_slug' }
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(false) }}
        placeholder="Key concepts, gotchas, commands to remember, links…"
        className="min-h-[140px] text-sm"
        style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
      />
      <button
        onClick={save}
        disabled={saving}
        className="text-sm font-semibold px-4 py-2 rounded-xl transition-opacity disabled:opacity-50"
        style={{ background: 'var(--devops-accent, #3b82f6)', color: 'white' }}
      >
        {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save notes'}
      </button>
    </div>
  )
}
