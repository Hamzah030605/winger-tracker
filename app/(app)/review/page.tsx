import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WeeklyReviewForm } from '@/components/review/weekly-review-form'

function getCurrentWeekStart(): string {
  const d = new Date()
  // Monday-based week: (getDay() + 6) % 7 gives 0=Mon … 6=Sun
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  d.setHours(0, 0, 0, 0)
  return d.toLocaleDateString('sv-SE') // YYYY-MM-DD
}

function formatWeekLabel(weekStartDate: string): string {
  const d = new Date(weekStartDate + 'T00:00:00')
  const end = new Date(d)
  end.setDate(end.getDate() + 6)
  const startStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const endStr   = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startStr} – ${endStr}`
}

export default async function ReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekStartDate = getCurrentWeekStart()
  const weekLabel = formatWeekLabel(weekStartDate)

  const [{ data: existing }, { data: pastRows }] = await Promise.all([
    supabase
      .from('weekly_reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start_date', weekStartDate)
      .maybeSingle(),
    supabase
      .from('weekly_reviews')
      .select('*')
      .eq('user_id', user.id)
      .neq('week_start_date', weekStartDate)
      .order('week_start_date', { ascending: false })
      .limit(8),
  ])

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
          Review
        </p>
        <h1 className="text-2xl font-bold mt-0.5" style={{ color: 'var(--foreground)' }}>
          Weekly Review
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--primary)' }}>
          Reflect · Learn · Focus
        </p>
      </div>

      <WeeklyReviewForm
        userId={user.id}
        weekStartDate={weekStartDate}
        weekLabel={weekLabel}
        existing={existing ?? null}
        pastReviews={pastRows ?? []}
      />
    </div>
  )
}
