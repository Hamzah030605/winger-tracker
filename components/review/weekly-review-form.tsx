'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { WeeklyReview } from '@/types/database'

const FIELDS: {
  key: keyof Pick<WeeklyReview, 'went_well' | 'went_badly' | 'biggest_win' | 'biggest_lesson' | 'focus_next_week'>
  label: string
  emoji: string
  placeholder: string
  color: string
}[] = [
  {
    key: 'went_well',
    label: 'What went well?',
    emoji: '✅',
    placeholder: 'Completed all gym sessions, DevOps streak maintained…',
    color: '#10b981',
  },
  {
    key: 'went_badly',
    label: 'What went badly?',
    emoji: '⚠️',
    placeholder: 'Missed football session, slept in twice…',
    color: '#ef4444',
  },
  {
    key: 'biggest_win',
    label: 'Biggest win',
    emoji: '🏆',
    placeholder: 'Nailed the Kubernetes module, PR max…',
    color: '#f59e0b',
  },
  {
    key: 'biggest_lesson',
    label: 'Biggest lesson',
    emoji: '📖',
    placeholder: 'Consistency beats intensity. Showed up every day…',
    color: '#8b5cf6',
  },
  {
    key: 'focus_next_week',
    label: 'Focus for next week',
    emoji: '🎯',
    placeholder: 'Docker deep dive, 3× football sessions, Arabic daily…',
    color: 'var(--primary)',
  },
]

interface Props {
  userId: string
  weekStartDate: string
  weekLabel: string
  existing: WeeklyReview | null
  pastReviews: WeeklyReview[]
}

type FormValues = {
  went_well: string
  went_badly: string
  biggest_win: string
  biggest_lesson: string
  focus_next_week: string
}

function toForm(r: WeeklyReview | null): FormValues {
  return {
    went_well:       r?.went_well       ?? '',
    went_badly:      r?.went_badly      ?? '',
    biggest_win:     r?.biggest_win     ?? '',
    biggest_lesson:  r?.biggest_lesson  ?? '',
    focus_next_week: r?.focus_next_week ?? '',
  }
}

function formatWeekLabel(weekStartDate: string): string {
  const d = new Date(weekStartDate + 'T00:00:00')
  const end = new Date(d)
  end.setDate(end.getDate() + 6)
  const startStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const endStr   = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startStr} – ${endStr}`
}

export function WeeklyReviewForm({ userId, weekStartDate, weekLabel, existing, pastReviews }: Props) {
  const router = useRouter()
  const [values, setValues] = useState<FormValues>(toForm(existing))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [expandedPast, setExpandedPast] = useState<string | null>(null)

  const isEmpty = Object.values(values).every((v) => !v.trim())

  async function handleSave() {
    if (isEmpty) return
    setSaving(true)
    setSaved(false)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase
      .from('weekly_reviews')
      .upsert(
        {
          user_id:         userId,
          week_start_date: weekStartDate,
          went_well:       values.went_well.trim()       || null,
          went_badly:      values.went_badly.trim()      || null,
          biggest_win:     values.biggest_win.trim()     || null,
          biggest_lesson:  values.biggest_lesson.trim()  || null,
          focus_next_week: values.focus_next_week.trim() || null,
          updated_at:      new Date().toISOString(),
        },
        { onConflict: 'user_id,week_start_date' }
      )

    setSaving(false)
    if (err) {
      setError('Could not save. Check Supabase migration is applied.')
      return
    }
    setSaved(true)
    router.refresh()
  }

  return (
    <div className="space-y-4">

      {/* Current week form */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #16161a 0%, #1e1a2e 100%)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Card header */}
        <div
          className="px-4 py-3.5 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--primary)' }}>
              This week&apos;s review
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {weekLabel}
            </p>
          </div>
          {saved && (
            <span
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(16,185,129,0.18)', color: '#4ade80' }}
            >
              ✓ Saved
            </span>
          )}
          {existing && !saved && (
            <span
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
            >
              Draft saved
            </span>
          )}
        </div>

        {/* Fields */}
        <div className="px-4 pt-4 pb-2 space-y-4">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <label className="flex items-center gap-1.5 mb-1.5">
                <span className="text-base">{field.emoji}</span>
                <span className="text-[12px] font-semibold" style={{ color: 'var(--foreground)' }}>
                  {field.label}
                </span>
              </label>
              <textarea
                value={values[field.key]}
                onChange={(e) => {
                  setSaved(false)
                  setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                }}
                placeholder={field.placeholder}
                rows={2}
                className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
                style={{
                  background: 'var(--secondary)',
                  border: `1px solid ${values[field.key].trim() ? field.color + '40' : 'var(--border)'}`,
                  color: 'var(--foreground)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>
          ))}
        </div>

        {error && (
          <p className="px-4 pb-2 text-xs" style={{ color: '#ef4444' }}>{error}</p>
        )}

        {/* Save button */}
        <div className="px-4 pb-4 pt-2">
          <button
            onClick={handleSave}
            disabled={saving || isEmpty}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40"
            style={{
              background: saved ? 'rgba(16,185,129,0.2)' : 'var(--primary)',
              color: saved ? '#4ade80' : '#fff',
              border: saved ? '1px solid rgba(16,185,129,0.4)' : 'none',
            }}
          >
            {saving ? 'Saving…' : saved ? '✓ Review saved' : 'Save Review'}
          </button>
        </div>
      </div>

      {/* Past reviews */}
      {pastReviews.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2.5" style={{ color: 'var(--muted-foreground)' }}>
            Past reviews
          </p>
          <div className="space-y-2">
            {pastReviews.map((review) => {
              const label = formatWeekLabel(review.week_start_date)
              const isOpen = expandedPast === review.id
              const hasContent = FIELDS.some((f) => review[f.key]?.trim())
              return (
                <div
                  key={review.id}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <button
                    onClick={() => setExpandedPast(isOpen ? null : review.id)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{label}</p>
                      {!isOpen && review.biggest_win && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>
                          🏆 {review.biggest_win}
                        </p>
                      )}
                    </div>
                    <span style={{ color: 'var(--muted-foreground)', fontSize: 18 }}>
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen && hasContent && (
                    <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                      {FIELDS.map((field) => {
                        const val = review[field.key]
                        if (!val?.trim()) return null
                        return (
                          <div key={field.key} className="pt-3">
                            <p className="text-[11px] font-semibold mb-1" style={{ color: field.color }}>
                              {field.emoji} {field.label}
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
                              {val}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
