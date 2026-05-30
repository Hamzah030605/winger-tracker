'use client'

const QUEUE_KEY = 'winger_offline_queue'

export interface QueuedSessionLog {
  localId: string
  failCount: number
  planType: 'gym' | 'football'
  sessionName: string
  weekNumber: number
  completedAt: string
  overallNotes?: string
  exercises: Array<{
    exerciseName: string
    sets?: number
    reps?: number
    weight?: number
    rpe?: number
    qualityRating?: number
    confidenceRating?: number
    weakFootNotes?: string
    notes?: string
  }>
}

function readQueue(): QueuedSessionLog[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function writeQueue(queue: QueuedSessionLog[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function enqueueSession(log: Omit<QueuedSessionLog, 'localId' | 'failCount'>) {
  const queue = readQueue()
  const entry: QueuedSessionLog = {
    ...log,
    localId: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    failCount: 0,
  }
  queue.push(entry)
  writeQueue(queue)
  return entry.localId
}

export function getQueueLength(): number {
  return readQueue().length
}

export function clearQueue() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(QUEUE_KEY)
}

export async function flushQueue(
  saveSession: (log: QueuedSessionLog) => Promise<boolean>
): Promise<{ synced: number; failed: number }> {
  const queue = readQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  const remaining: QueuedSessionLog[] = []

  for (const item of queue) {
    const ok = await saveSession(item)
    if (ok) {
      synced++
    } else {
      remaining.push({ ...item, failCount: (item.failCount ?? 0) + 1 })
    }
  }

  writeQueue(remaining)
  return { synced, failed: remaining.length }
}
