import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DEFAULT_HABITS } from '@/lib/habits'

export default async function SeedDebugPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── 1. Auth
  const authInfo = {
    userId: user.id,
    email: user.email,
    authError: authError?.message ?? null,
  }

  // ── 2. Raw habits SELECT before RPC (proves whether table + RLS work)
  const { data: habitsBefore, error: selectBeforeError } = await supabase
    .from('habits')
    .select('id, name, category, sort_order')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  // ── 3. Call RPC
  const { data: rpcData, error: rpcError } = await supabase.rpc('seed_default_habits')

  // ── 4. Raw habits SELECT after RPC
  const { data: habitsAfter, error: selectAfterError } = await supabase
    .from('habits')
    .select('id, name, category, sort_order')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  // ── 5. Try direct INSERT if RPC failed and still 0 habits
  let directInsertResult: { error: string | null; inserted: number } | null = null
  if ((habitsAfter?.length ?? 0) === 0) {
    const { error: insErr } = await supabase.from('habits').insert(
      DEFAULT_HABITS.map((h) => ({ ...h, user_id: user.id }))
    )
    directInsertResult = {
      error: insErr ? `${insErr.message} (code: ${insErr.code})` : null,
      inserted: insErr ? 0 : DEFAULT_HABITS.length,
    }
  }

  // ── 6. Final count
  const { data: finalHabits, error: finalError } = await supabase
    .from('habits')
    .select('id, name, category')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  const report = {
    auth: authInfo,
    step1_selectBefore: {
      count: habitsBefore?.length ?? 0,
      error: selectBeforeError
        ? { message: selectBeforeError.message, code: selectBeforeError.code, details: selectBeforeError.details }
        : null,
    },
    step2_rpc: {
      data: rpcData,
      error: rpcError
        ? { message: rpcError.message, code: rpcError.code, details: rpcError.details, hint: rpcError.hint }
        : null,
    },
    step3_selectAfterRpc: {
      count: habitsAfter?.length ?? 0,
      error: selectAfterError
        ? { message: selectAfterError.message, code: selectAfterError.code }
        : null,
    },
    step4_directInsertFallback: directInsertResult,
    step5_finalCount: {
      count: finalHabits?.length ?? 0,
      error: finalError ? { message: finalError.message, code: finalError.code } : null,
      rows: finalHabits ?? [],
    },
  }

  const overallOk = (finalHabits?.length ?? 0) > 0

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-3">
      <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Seed Debug</h1>

      {/* Overall status */}
      <div
        className="rounded-2xl px-4 py-3 text-sm font-semibold"
        style={{
          background: overallOk ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${overallOk ? '#10b98155' : '#ef444455'}`,
          color: overallOk ? '#10b981' : '#ef4444',
        }}
      >
        {overallOk
          ? `✓ ${finalHabits?.length} habits in DB for your account`
          : '✗ 0 habits — seeding failed at every step'}
      </div>

      {/* Step-by-step */}
      {[
        { label: 'Step 1 — SELECT before RPC', ok: !report.step1_selectBefore.error, value: report.step1_selectBefore },
        { label: 'Step 2 — RPC call', ok: !report.step2_rpc.error, value: report.step2_rpc },
        { label: 'Step 3 — SELECT after RPC', ok: !report.step3_selectAfterRpc.error, value: report.step3_selectAfterRpc },
        { label: 'Step 4 — Direct INSERT fallback', ok: report.step4_directInsertFallback?.error === null, value: report.step4_directInsertFallback },
        { label: 'Step 5 — Final count', ok: report.step5_finalCount.count > 0, value: { count: report.step5_finalCount.count, error: report.step5_finalCount.error } },
      ].map(({ label, ok, value }) => (
        value !== null && (
          <div key={label} className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div
              className="px-4 py-2 flex items-center gap-2"
              style={{ borderBottom: '1px solid var(--border)', background: ok ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)' }}
            >
              <span style={{ color: ok ? '#10b981' : '#ef4444' }}>{ok ? '✓' : '✗'}</span>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: ok ? '#10b981' : '#ef4444' }}>{label}</p>
            </div>
            <pre className="px-4 py-3 text-[11px] leading-relaxed overflow-x-auto" style={{ color: 'var(--foreground)' }}>
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        )
      ))}

      {/* Full dump */}
      <div className="rounded-2xl overflow-auto" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest px-4 pt-3 pb-1" style={{ color: 'var(--muted-foreground)' }}>
          Full JSON (copy this and share with Claude)
        </p>
        <pre className="px-4 pb-4 text-[11px] leading-relaxed overflow-x-auto" style={{ color: 'var(--foreground)' }}>
          {JSON.stringify(report, null, 2)}
        </pre>
      </div>
    </div>
  )
}
