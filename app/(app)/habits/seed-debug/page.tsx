import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SeedDebugPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Auth check
  const authInfo = { userId: user.id, email: user.email, authError: authError?.message ?? null }

  // 2. Call the RPC
  const { data: rpcData, error: rpcError } = await supabase.rpc('seed_default_habits')

  // 3. Count habits after the RPC
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id, name, category')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  const result = {
    auth: authInfo,
    rpc: {
      data: rpcData,
      error: rpcError ? { message: rpcError.message, code: rpcError.code, details: rpcError.details } : null,
    },
    habitsAfter: {
      count: habits?.length ?? 0,
      error: habitsError ? { message: habitsError.message, code: habitsError.code } : null,
      rows: habits ?? [],
    },
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-10">
      <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
        Seed Debug
      </h1>

      {/* RPC result banner */}
      <div
        className="rounded-2xl px-4 py-3 mb-4 font-mono text-sm"
        style={{
          background: rpcError ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          border: `1px solid ${rpcError ? '#ef444455' : '#10b98155'}`,
          color: rpcError ? '#ef4444' : '#10b981',
        }}
      >
        {rpcError
          ? `❌ RPC error: ${rpcError.message} (code: ${rpcError.code})`
          : `✓ RPC OK → ${JSON.stringify(rpcData)}`}
      </div>

      {/* Habits count */}
      <div
        className="rounded-2xl px-4 py-3 mb-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--muted-foreground)' }}>
          Habits in DB after RPC
        </p>
        <p className="text-2xl font-bold" style={{ color: habits && habits.length > 0 ? '#10b981' : '#ef4444' }}>
          {habits?.length ?? 0}
        </p>
        {habitsError && (
          <p className="text-xs mt-1 font-mono" style={{ color: '#ef4444' }}>
            {habitsError.message} ({habitsError.code})
          </p>
        )}
      </div>

      {/* Full JSON dump */}
      <div className="rounded-2xl overflow-auto" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest px-4 pt-3 pb-1" style={{ color: 'var(--muted-foreground)' }}>
          Full result
        </p>
        <pre className="px-4 pb-4 text-[11px] leading-relaxed overflow-x-auto" style={{ color: 'var(--foreground)' }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  )
}
