'use client'

const QUEUE_KEY = 'winger_offline_queue'

export interface QueuedSessionLog {
  localId: string
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

export function enqueueSession(log: Omit<QueuedSessionLog, 'localId'>) {
  const queue = readQueue()
  const entry: QueuedSessionLog = {
    ...log,
    localId: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  }
  queue.push(entry)
  writeQueue(queue)
  return entry.localId
}

export function getQueueLength(): number {
  return readQueue().length
}

export async function flushQueue(
  saveSession: (log: QueuedSessionLog) => Promise<boolean>
): Promise<number> {
  const queue = readQueue()
  if (queue.length === 0) return 0

  let synced = 0
  const remaining: QueuedSessionLog[] = []

  for (const item of queue) {
    const ok = await saveSession(item)
    if (ok) {
      synced++
    } else {
      remaining.push(item)
    }
  }

  writeQueue(remaining)
  return synced
}
