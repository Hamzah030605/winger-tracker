import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type HabitCategory = 'deen' | 'football' | 'physique' | 'career' | 'growth' | 'discipline'

export const DEFAULT_HABITS: Array<{ name: string; category: HabitCategory; sort_order: number }> = [
  { name: 'Fajr + Morning Dhikr',                   category: 'deen',       sort_order: 0  },
  { name: 'Quran 10–20 mins',                        category: 'deen',       sort_order: 1  },
  { name: 'Pray 5 Salah in the Mosque',              category: 'deen',       sort_order: 2  },
  { name: 'Daily Islamic Reminder / Reading',        category: 'deen',       sort_order: 3  },
  { name: 'Wake Up For Fajr + Train',                category: 'football',   sort_order: 4  },
  { name: 'Football Session / Ball Mastery',         category: 'football',   sort_order: 5  },
  { name: 'Mobility / Stretching',                   category: 'football',   sort_order: 6  },
  { name: 'Shower + Full Morning Grooming',          category: 'physique',   sort_order: 7  },
  { name: 'Post-Workout Protein Shake',              category: 'physique',   sort_order: 8  },
  { name: 'Night Skincare + Minoxidil',              category: 'physique',   sort_order: 9  },
  { name: '10k Steps + 2.5–3L Water',               category: 'physique',   sort_order: 10 },
  { name: 'No Junk / No Late-Night Eating',          category: 'physique',   sort_order: 11 },
  { name: 'DevOps Study 60+ mins',                   category: 'career',     sort_order: 12 },
  { name: 'Hands-On Lab',                            category: 'career',     sort_order: 13 },
  { name: 'Arabic Study',                            category: 'growth',     sort_order: 14 },
  { name: 'Read For 30–60 Minutes',                  category: 'growth',     sort_order: 15 },
  { name: 'Not In Bed After Fajr Until After Isha',  category: 'discipline', sort_order: 16 },
]

export const CATEGORY_META: Record<HabitCategory, { label: string; color: string; emoji: string }> = {
  deen:       { label: 'Deen',       color: '#8b5cf6', emoji: '🕌' },
  football:   { label: 'Football',   color: '#10b981', emoji: '⚽' },
  physique:   { label: 'Physique',   color: '#06b6d4', emoji: '💪' },
  career:     { label: 'Career',     color: '#3b82f6', emoji: '💻' },
  growth:     { label: 'Growth',     color: '#f59e0b', emoji: '📚' },
  discipline: { label: 'Discipline', color: '#ff4d1c', emoji: '🔥' },
}

export const CATEGORY_ORDER: HabitCategory[] = ['deen', 'football', 'physique', 'career', 'growth', 'discipline']

export async function seedHabitsIfMissing(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  // Primary path: SECURITY DEFINER RPC — atomic count+insert in Postgres, bypasses RLS edge-cases
  const { data: rpcResult, error: rpcError } = await supabase.rpc('seed_default_habits')

  if (!rpcError) {
    if (rpcResult?.error) {
      console.error('[habits:seed] RPC returned auth error:', rpcResult.error)
    }
    // seeded=true means we just inserted; seeded=false means habits already exist — both are fine
    return
  }

  // RPC not available (function not yet created in Supabase) — fall back to direct insert
  console.error('[habits:seed] RPC failed, using fallback insert. RPC error:', rpcError.message)

  const { data: existing, error: selectError } = await supabase
    .from('habits')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (selectError) {
    console.error('[habits:seed] select check failed:', selectError.message, selectError.code)
    return
  }

  if (existing && existing.length > 0) return // habits already exist

  const { error: insertError } = await supabase.from('habits').insert(
    DEFAULT_HABITS.map((h) => ({ ...h, user_id: userId }))
  )

  if (insertError) {
    console.error('[habits:seed] insert failed:', insertError.message, insertError.code, insertError.details)
  }
}
