export type PlanType = 'gym' | 'football'
export type Phase = 'base' | 'development' | 'peak'

export interface GymExercise {
  name: string
  sets: string
  reps: string
  tempo?: string
  rest: string
  notes?: string
}

export interface GymBlock {
  name: string
  exercises: GymExercise[]
}

export interface SAQBlock {
  name: string
  duration: string
  description: string
}

export interface ContrastPair {
  strength: { name: string; sets: string; reps: string; rpe: string }
  plyo: { name: string; reps: string }
}

export interface GymSession {
  id: string
  name: string
  day: string
  blocks: GymBlock[]
  hasSAQ: boolean
  saqBlocks?: SAQBlock[]
}

export interface WeekPhaseModifier {
  weekRange: '1-2' | '3-4' | '5-6'
  phase: Phase
  label: string
  gymNotes: string
  contrastPairsActive?: boolean
  isDeload?: boolean
}

export interface GymPlan {
  name: string
  totalWeeks: number
  sessions: GymSession[]
  contrastPairs: ContrastPair[]
  weeklyProgressions: WeekPhaseModifier[]
  volumeTargets: Record<string, string>
}

export interface WarmUpDrill {
  name: string
  reps: string
}

export interface FootballDrill {
  id: string
  name: string
  style: 'Neymar' | 'CR7' | 'Both'
  reps: string
  rest: string
  setup: string
  decisionCue?: string
  trains: string
  weeklyProgression?: string
}

export interface FootballBlock {
  name: string
  timeRange: string
  drills: FootballDrill[]
}

export interface FootballSession {
  id: string
  number: number
  name: string
  day: string
  blocks: FootballBlock[]
}

export interface FootballWeekPhaseModifier {
  weekRange: '1-2' | '3-4' | '5-6'
  phase: Phase
  label: string
  technicalNotes: string
  staminaRest: string
  fatigueRest: string
}

export interface FootballPlan {
  name: string
  totalWeeks: number
  warmUp: WarmUpDrill[]
  coolDown: string[]
  sessions: FootballSession[]
  sixMoves: Array<{ name: string; style: string; when: string; mistake: string }>
  weeklyProgressions: FootballWeekPhaseModifier[]
  commitRule: string
}
