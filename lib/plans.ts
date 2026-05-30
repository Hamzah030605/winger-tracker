import type { GymPlan, FootballPlan } from '@/types/plans'

// ─── SAQ Finisher (shared across Mon / Wed / Fri gym sessions) ────────────────
const SAQ_BLOCKS = [
  {
    name: 'Block 1 — Agility Ladder',
    duration: '5 min',
    description: '2 rounds of agility ladder patterns',
  },
  {
    name: 'Block 2 — Band-Resisted Sprint',
    duration: '5 min',
    description: '6 × 10 m band-resisted accelerations',
  },
  {
    name: 'Block 3 — Acceleration',
    duration: '5 min',
    description: '4 × 10 m + 4 × 20 m acceleration runs',
  },
  {
    name: 'Block 4 — Flying Sprint',
    duration: '5 min',
    description: '4 × 30 m at 95–100% max velocity',
  },
]

// ─── Gym Plan ─────────────────────────────────────────────────────────────────
export const GYM_PLAN: GymPlan = {
  name: '6-Week Preseason Explosive Winger Programme',
  totalWeeks: 6,

  sessions: [
    // ── MONDAY: Lower Body Power A ──────────────────────────────────────────
    {
      id: 'monday',
      name: 'Lower Body Power A',
      day: 'Monday',
      hasSAQ: true,
      saqBlocks: SAQ_BLOCKS,
      blocks: [
        {
          name: 'Plyometric Block',
          exercises: [
            { name: 'Box Jumps', sets: '4', reps: '3', rest: '75s', notes: 'Full extension, land softly' },
            { name: 'Broad Jumps', sets: '4', reps: '3', rest: '75s', notes: 'Maximum horizontal distance' },
            { name: 'Single-Leg Bounds', sets: '3', reps: '5/leg', rest: '75s', notes: 'Alternate legs, drive knee up' },
          ],
        },
        {
          name: 'Strength Block',
          exercises: [
            { name: 'Bulgarian Split Squat', sets: '4', reps: '6/leg', tempo: '3-1-X', rest: '120s', notes: 'RPE 7 (Wks 1–2), RPE 8 (Wks 3–4)' },
            { name: 'Romanian Deadlift', sets: '4', reps: '6', tempo: '3-0-X', rest: '120s', notes: 'Bar speed priority, hip hinge' },
            { name: 'Nordic Curl', sets: '3', reps: '5', tempo: '4-0-X', rest: '90s', notes: 'Lower under control — 4s eccentric' },
            { name: 'Walking DB Lunges', sets: '3', reps: '8/leg', tempo: 'Explosive', rest: '90s', notes: 'Drive through front heel' },
          ],
        },
        {
          name: 'Ankle Elasticity',
          exercises: [
            { name: 'Pogo Jumps', sets: '3', reps: '20', rest: '60s', notes: 'Minimal ground contact, stiff ankles' },
            { name: 'Seated Calf Raise', sets: '3', reps: '12', rest: '60s', notes: '2s pause at bottom, full ROM' },
          ],
        },
      ],
    },

    // ── TUESDAY: Upper Body A ───────────────────────────────────────────────
    {
      id: 'tuesday',
      name: 'Upper Body A — Athletic',
      day: 'Tuesday',
      hasSAQ: false,
      blocks: [
        {
          name: 'Power Primer',
          exercises: [
            { name: 'Medicine Ball Chest Throw', sets: '4', reps: '5', rest: '60s', notes: 'Explosive push, catch or against wall' },
            { name: 'Rotational Med Ball Throw', sets: '4', reps: '5/side', rest: '60s', notes: 'Hip rotation drives the throw' },
          ],
        },
        {
          name: 'Main Work',
          exercises: [
            { name: 'Pull-Ups', sets: '4', reps: 'AMRAP', tempo: 'X', rest: '120s', notes: 'Dead hang start, chin over bar' },
            { name: 'Incline DB Press', sets: '3', reps: '8', tempo: 'X concentric', rest: '90s', notes: 'Control down, explode up' },
            { name: 'Chest-Supported Row', sets: '4', reps: '8', rest: '90s', notes: 'Drive elbows back, squeeze shoulder blades' },
            { name: 'Cable Chest Fly', sets: '3', reps: '10', rest: '75s', notes: 'Full stretch at bottom, squeeze at top' },
            { name: 'Face Pulls', sets: '4', reps: '12', rest: '60s', notes: 'External rotation emphasis, pull to forehead' },
          ],
        },
        {
          name: 'Core',
          exercises: [
            { name: 'Pallof Press', sets: '3', reps: '12/side', rest: '60s', notes: 'Anti-rotation — resist cable pull' },
            { name: 'Dead Bugs', sets: '3', reps: '10/side', rest: '60s', notes: 'Lower back pressed into floor at all times' },
          ],
        },
      ],
    },

    // ── WEDNESDAY: Speed-Strength Day ──────────────────────────────────────
    {
      id: 'wednesday',
      name: 'Speed-Strength — Max Velocity Intent',
      day: 'Wednesday',
      hasSAQ: true,
      saqBlocks: SAQ_BLOCKS,
      blocks: [
        {
          name: 'Reactive Plyometrics',
          exercises: [
            { name: 'Depth Jumps', sets: '4', reps: '3', rest: '90s', notes: '<0.2s ground contact — reactive, not squat jump' },
            { name: 'Hurdle Hops', sets: '4', reps: '4', rest: '90s', notes: 'Stiff ankles, fast off the floor' },
          ],
        },
        {
          name: 'Speed-Strength Lifts',
          exercises: [
            { name: 'Trap Bar Jumps', sets: '5', reps: '3', rest: '120s', notes: '20–30% 1RM, intent to jump the bar off the floor' },
            { name: 'Jump Squats', sets: '4', reps: '4', rest: '120s', notes: '20–30% 1RM, bar speed priority' },
            { name: 'Hex Bar Deadlift', sets: '5', reps: '3', rest: '120s', notes: '60–70% 1RM, maximum bar velocity every rep' },
            { name: 'Kettlebell Swings', sets: '4', reps: '8', rest: '90s', notes: 'Heavy KB, hip snap not squat' },
          ],
        },
        {
          name: 'Elastic Finisher',
          exercises: [
            { name: 'Bounds for Distance', sets: '3', reps: '20m', rest: '90s', notes: 'Maximum horizontal distance each bound' },
            { name: 'Pogo Hops', sets: '3', reps: '20', rest: '60s', notes: 'Fast off the floor, minimal contact time' },
          ],
        },
      ],
    },

    // ── THURSDAY: Upper Body B ──────────────────────────────────────────────
    {
      id: 'thursday',
      name: 'Upper Body B — Stability & Rotation',
      day: 'Thursday',
      hasSAQ: false,
      blocks: [
        {
          name: 'Power',
          exercises: [
            { name: 'Med Ball Side Toss', sets: '4', reps: '5/side', rest: '60s', notes: 'Aggressive hip rotation, throw from hips not arms' },
            { name: 'Slam Ball Throws', sets: '4', reps: '5', rest: '60s', notes: 'Full extension overhead, slam with intent' },
          ],
        },
        {
          name: 'Main Work',
          exercises: [
            { name: 'Weighted Pull-Ups', sets: '4', reps: '5', rest: '120s', notes: 'Add 5–10 kg, controlled descent' },
            { name: 'Landmine Press', sets: '4', reps: '6/side', rest: '90s', notes: 'Stabilise core, press on diagonal' },
            { name: 'Single-Arm Cable Row', sets: '3', reps: '8/side', rest: '90s', notes: 'Rotate torso slightly at bottom' },
            { name: 'Band External Rotations', sets: '3', reps: '15/side', rest: '60s', notes: 'Shoulder durability — do not rush' },
            { name: 'Face Pulls', sets: '3', reps: '15', rest: '60s', notes: 'Light weight, full external rotation' },
          ],
        },
        {
          name: 'Core',
          exercises: [
            { name: 'Hanging Leg Raise', sets: '3', reps: '10', rest: '75s', notes: 'Controlled, no swinging' },
            { name: 'Copenhagen Plank', sets: '3', reps: '25s', rest: '75s', notes: 'Adductor load — progress hold time' },
          ],
        },
      ],
    },

    // ── FRIDAY: Lower Body Reactive B ───────────────────────────────────────
    {
      id: 'friday',
      name: 'Lower Body Reactive B',
      day: 'Friday',
      hasSAQ: true,
      saqBlocks: SAQ_BLOCKS,
      blocks: [
        {
          name: 'Plyometric Block',
          exercises: [
            { name: 'Depth Jumps', sets: '4', reps: '3', rest: '75s', notes: '<0.2s ground contact' },
            { name: 'Lateral Bounds', sets: '4', reps: '5/side', rest: '75s', notes: 'Land and immediately bound back — reactive' },
            { name: 'Single-Leg Hops (for distance)', sets: '3', reps: '5/leg', rest: '75s', notes: 'Max distance each hop' },
          ],
        },
        {
          name: 'Strength',
          exercises: [
            { name: 'Front Squat', sets: '4', reps: '5', tempo: 'Controlled down, X up', rest: '120s', notes: 'RPE 7–8, elbows high' },
            { name: 'Hip Thrust', sets: '4', reps: '6', tempo: 'Explosive X concentric', rest: '90s', notes: 'Full hip extension, squeeze glutes at top' },
            { name: 'Nordic Curl', sets: '3', reps: '5', tempo: '4-0-X', rest: '90s', notes: '4s eccentric, use hands minimally on way up' },
            { name: 'Reverse Lunge', sets: '3', reps: '8/leg', tempo: 'Explosive step', rest: '90s', notes: 'Drive through front foot on step back' },
          ],
        },
        {
          name: 'Ankle Stiffness',
          exercises: [
            { name: 'Pogo Hops', sets: '3', reps: '20', rest: '60s', notes: 'Stiff ankles, arms pumping' },
            { name: 'Tibialis Raises (wall)', sets: '3', reps: '15', rest: '60s', notes: 'Dorsiflexion — back against wall, raise toes' },
          ],
        },
      ],
    },
  ],

  contrastPairs: [
    {
      strength: { name: 'Bulgarian Split Squat', sets: '4', reps: '4', rpe: '8' },
      plyo: { name: 'Single-Leg Bound', reps: '4/leg' },
    },
    {
      strength: { name: 'Romanian Deadlift', sets: '4', reps: '4', rpe: '8' },
      plyo: { name: 'Broad Jump', reps: '3' },
    },
    {
      strength: { name: 'Front Squat', sets: '4', reps: '4', rpe: '8' },
      plyo: { name: 'Lateral Bound', reps: '5/side' },
    },
    {
      strength: { name: 'Hip Thrust', sets: '4', reps: '5', rpe: '8' },
      plyo: { name: 'Depth Jump', reps: '3' },
    },
  ],

  weeklyProgressions: [
    {
      weekRange: '1-2',
      phase: 'base',
      label: 'Phase 1 — Base',
      gymNotes:
        'RPE 7 on all major lifts. 60–70 plyometric contacts total. SAQ blocks 1 & 2 only. Focus on tissue prep, landing mechanics and technique.',
      contrastPairsActive: false,
    },
    {
      weekRange: '3-4',
      phase: 'development',
      label: 'Phase 2 — Development',
      gymNotes:
        'RPE 8. Add 5–10% load to main lifts. Contrast pairs now active (A1 strength → A2 plyo, minimal rest). Full SAQ protocol all 4 blocks. Week 4 = deload: −40% strength volume, −50% plyo, −50% sprint.',
      contrastPairsActive: true,
      isDeload: false,
    },
    {
      weekRange: '5-6',
      phase: 'peak',
      label: 'Phase 3 — Peak & Taper',
      gymNotes:
        'Wk 5: Heavier loads, drop volume (Bulgarian 3×4, Front squat 3×3). Increase plyometric contacts. Wk 6 taper: −50% volume — keep depth jumps, trap bar jumps, short accelerations and pogo hops. Remove all high-rep accessories.',
      contrastPairsActive: false,
    },
  ],

  volumeTargets: {
    Quads: '12–14 sets (Front squat, Bulgarian, Jump squat)',
    Hamstrings: '12–15 sets (RDL, Nordic curl, KB swing)',
    Glutes: '14–16 sets (Hip thrust, Reverse lunge, Bounds)',
    'Calves/Ankles': '8–10 sets',
    Back: '14–16 sets',
    Chest: '6–8 sets (deliberately low)',
    'Shoulders/Rotator': '8–10 sets',
    'Core (anti-rotation)': '8–10 sets',
  },
}

// ─── Football Plan ────────────────────────────────────────────────────────────
export const FOOTBALL_PLAN: FootballPlan = {
  name: 'Solo Winger Training Plan v3 — Neymar × CR7',
  totalWeeks: 6,

  warmUp: [
    { name: 'Toe taps on ball', reps: '60s' },
    { name: 'High knees (stationary)', reps: '30s' },
    { name: 'Butt kicks (stationary)', reps: '30s' },
    { name: 'Lateral shuffle', reps: '2 × 10m each way' },
    { name: 'Carioca', reps: '2 × 10m each way' },
    { name: 'A-skip', reps: '2 × 15m' },
    { name: 'B-skip', reps: '2 × 15m' },
    { name: 'Explosive knee drives (wall)', reps: '3 × 8/leg' },
    { name: 'Ankle hops (pogo)', reps: '2 × 15' },
    { name: 'Acceleration build-ups', reps: '3 × 20m (50%→70%→90%)' },
    { name: 'Dynamic hip flexor lunge', reps: '8/side' },
    { name: 'Leg swings (front-to-back)', reps: '12/leg' },
    { name: 'Leg swings (side-to-side)', reps: '12/leg' },
    { name: 'Hip circles', reps: '10 each direction' },
    { name: 'Walking knee hug', reps: '8/leg' },
    { name: 'Walking quad pull', reps: '8/leg' },
    { name: 'Lateral lunge with reach', reps: '8/side' },
    { name: 'Ankle circles', reps: '10 each direction per ankle' },
    { name: 'Hip 90-90 rotations', reps: '6/side' },
    { name: 'Inchworm', reps: '4 reps' },
  ],

  coolDown: [
    'Standing quad stretch: 45s/leg',
    'Standing hamstring stretch: 45s/leg',
    'Lying glute stretch (figure-4): 45s/side',
    'Hip flexor lunge stretch (static): 45s/side',
    'Butterfly groin stretch: 45s',
    'Lying hamstring stretch: 45s/leg',
    "Child's pose: 60s",
    'Calf stretch (wall): 30s/leg',
    'Hip 90-90 hold: 45s/side',
    'Thoracic rotation (ground): 6/side',
  ],

  sessions: [
    // ── SESSION 1: Monday — Ball Mastery & 1v1 Moves ─────────────────────────
    {
      id: 'session-1',
      number: 1,
      name: 'Ball Mastery & 1v1 Moves',
      day: 'Monday',
      blocks: [
        {
          name: 'Receiving Drill',
          timeRange: '20–28 min',
          drills: [
            {
              id: 's1-r1',
              name: 'First-Touch Gate Drill',
              style: 'CR7',
              reps: '10 reps (5 touch forward, 5 cut inside)',
              rest: 'Walk-back recovery',
              setup: '3 cones — roll point A at 15m, gate B at 8m, goal C at 20m',
              decisionCue: 'Cone LEFT of gate = cut inside. Cone RIGHT = touch forward',
              trains: 'First touch under forward momentum, receiving without killing pace',
            },
          ],
        },
        {
          name: 'Main Drills',
          timeRange: '28–57 min',
          drills: [
            {
              id: 's1-d1',
              name: 'Cone Weave Close Control',
              style: 'Neymar',
              reps: '6 runs each foot',
              rest: '45s',
              setup: '8 cones in a line 1m apart, 5m start back',
              decisionCue: undefined,
              trains: 'Close control at pace, weak foot, touch-sprint transition',
              notes: 'Keep ball within 30cm, alternate feet, accelerate to 10m sprint exit',
            } as any,
            {
              id: 's1-d2',
              name: 'Box Feint and Burst',
              style: 'Both',
              reps: '10 reps each move (stepover / scissors / body feint)',
              rest: '30s',
              setup: '4 cones in 2m square, 1 extra cone placed left/right before each rep',
              decisionCue: 'Left cone = exit right. Right cone = exit left',
              trains: 'Deceptive movement, defensive reading, decisive exit',
            },
            {
              id: 's1-d3',
              name: 'Elastico Corridor',
              style: 'Neymar',
              reps: '8 reps right foot, 8 reps left foot',
              rest: '45s',
              setup: 'Two cones 1m apart (gap), marker cone 2m to one side',
              decisionCue: 'Marker LEFT = standard elastico (outside→inside). Marker RIGHT = reverse elastico',
              trains: 'Elastico both directions, reading defender weight, reactive decision under speed',
            },
            {
              id: 's1-d4',
              name: 'L-Shaped 1v1 Simulation',
              style: 'Both',
              reps: '12 reps total (6 left, 6 right)',
              rest: '30s',
              setup: 'Cone at start, cone 5m ahead (defender line), goal 20m',
              decisionCue: 'Coloured cone INSIDE = tight marking → go outside with stepover/body feint. OUTSIDE = showing inside → cut inside with drag-back/Cruyff',
              trains: 'Decision making under pace, move selection based on defender shape, finish under pressure',
            },
          ],
        },
        {
          name: 'Finishing Block',
          timeRange: '57–65 min',
          drills: [
            {
              id: 's1-f1',
              name: 'Finishing Shots',
              style: 'CR7',
              reps: '5 shots',
              rest: '30s between shots',
              setup: '2 driven cutbacks from right, 2 from left, 1 first-time from rolled ball to penalty spot',
              trains: 'Shooting technique — hard and low, near post first option',
            },
          ],
        },
        {
          name: 'Stamina Block',
          timeRange: '65–73 min',
          drills: [
            {
              id: 's1-s1',
              name: 'Wide Channel Shuttle',
              style: 'Both',
              reps: '6 reps (Wks 1–2) / 8 reps (Wks 3–4) / 10 reps (Wks 5–6)',
              rest: '90s seated after every 3 reps',
              setup: '4 cones: A (start), B (10m), C (20m), D (30m) down wide channel',
              trains: 'Repeated sprint ability — sprint A→D full pace, jog back',
              weeklyProgression: '6→8→10 reps',
            },
            {
              id: 's1-s2',
              name: 'Cone Box Beep Runs',
              style: 'Both',
              reps: '6 reps (Wks 1–2) / 8 reps (Wks 3–4) / 10 reps (Wks 5–6)',
              rest: '20s between reps',
              setup: '4 cones in 10m square, sprint adjacent (10m), diagonal (14m), adjacent (10m), start (14m)',
              trains: 'Agility endurance, change of direction under fatigue',
              weeklyProgression: '6→8→10 reps',
            },
          ],
        },
        {
          name: 'Fatigue-State Reps',
          timeRange: '73–78 min',
          drills: [
            {
              id: 's1-fat1',
              name: 'L-Shaped 1v1 (Fatigue)',
              style: 'Both',
              reps: '5 reps',
              rest: '45s (Wks 1–2) / 30s (Wks 3–4) / 20s (Wks 5–6)',
              setup: 'Same as main drill, decision cue active',
              trains: 'Maintaining technical quality and commitment under fatigue',
              weeklyProgression: '45s→30s→20s rest',
            },
          ],
        },
      ],
    },

    // ── SESSION 2: Wednesday — Explosive Movement & Finishing ─────────────────
    {
      id: 'session-2',
      number: 2,
      name: 'Explosive Movement & Finishing',
      day: 'Wednesday',
      blocks: [
        {
          name: 'Main Drills',
          timeRange: '20–57 min',
          drills: [
            {
              id: 's2-d1',
              name: 'Sprint-Receive-Shoot',
              style: 'CR7',
              reps: '10 reps',
              rest: 'Full walk-back recovery',
              setup: 'Ball 25m from goal, start 10m behind. Sprint to ball at full pace, first touch forward toward goal',
              trains: 'First touch under sprint, shooting composure, sprint-to-finish transition',
              notes: 'Max 2 touches after first touch, driven low shot',
            } as any,
            {
              id: 's2-d2',
              name: 'Wide Run & Cut Inside',
              style: 'CR7',
              reps: '8 reps each side',
              rest: '45s',
              setup: '5 cones curved wide channel from touchline to penalty area',
              trains: 'Wide acceleration, sharp cut inside onto stronger foot, driven shot',
              notes: 'Final cone = cut inside sharply, drive low shot',
            } as any,
            {
              id: 's2-d3',
              name: 'Explosive Turn and Go',
              style: 'Both',
              reps: '10 reps (5 each direction)',
              rest: '30s',
              setup: 'Cone 10m from goal. Stand back to goal, roll ball 3m, sprint to it',
              decisionCue: 'Coloured cone LEFT = turn left (away from strong foot). RIGHT = turn right (onto strong foot)',
              trains: 'Turn decision under approach, explosive acceleration after, goal threat from half-turn',
            },
            {
              id: 's2-d4',
              name: 'Cone Slalom to Cross',
              style: 'CR7',
              reps: '10 crosses each side',
              rest: '30s',
              setup: '6 cones slalom from 30m wide to byline, coloured cone at byline',
              decisionCue: 'Cone LEFT at byline = near-post whip. Cone RIGHT = far-post drive',
              trains: 'Crossing decision under pace, both delivery types, reading final moment',
            },
          ],
        },
        {
          name: 'Finishing Block',
          timeRange: '57–65 min',
          drills: [
            {
              id: 's2-f1',
              name: 'Finishing Combinations',
              style: 'CR7',
              reps: '13 shots total',
              rest: '20s between shots',
              setup: '5 shots from penalty spot (driven, low, corners). 5 shots just outside box (simulate stepover then shoot). 3 shots from free kick at 25m (standing technique).',
              trains: 'Composure in front of goal, CR7-style power finishing',
            },
          ],
        },
        {
          name: 'Stamina Block',
          timeRange: '65–73 min',
          drills: [
            {
              id: 's2-s1',
              name: '30-20-10 Winger Intervals',
              style: 'Both',
              reps: '5 reps (Wks 1–2) / 7 reps (Wks 3–4) / 8 reps (Wks 5–6)',
              rest: '30s walk between reps',
              setup: 'Single 60m line with ball at feet. Jog 30s → run 70% for 20s → full sprint 10s (first touch forward, sprint after)',
              trains: 'VO2max, match-realistic repeated effort with ball',
              weeklyProgression: '5→7→8 reps',
            },
            {
              id: 's2-s2',
              name: 'Dribble & Recover Circuit',
              style: 'Both',
              reps: '5 reps (Wks 1–2) / 7 reps (Wks 3–4) / 8 reps (Wks 5–6)',
              rest: '45s (Wks 1–2) / 30s (Wks 3–4) / 20s (Wks 5–6)',
              setup: 'Cones at wide A, halfway B, opposite wide C, goal D (~60–70m circuit). Dribble A→B close control, accelerate to C, cut inside to D and shoot. Jog/sprint back.',
              trains: 'Ball-carrying endurance, full-pitch winger movement',
              weeklyProgression: '5→7→8 reps, 45s→30s→20s rest',
            },
          ],
        },
        {
          name: 'Fatigue-State Reps',
          timeRange: '73–78 min',
          drills: [
            {
              id: 's2-fat1',
              name: 'Explosive Turn and Go (Fatigue)',
              style: 'Both',
              reps: '5 reps',
              rest: '45s (Wks 1–2) / 30s (Wks 3–4) / 20s (Wks 5–6)',
              setup: 'Same as main drill, decision cue active',
              trains: 'Turn explosiveness maintained under fatigue',
              weeklyProgression: '45s→30s→20s rest',
            },
          ],
        },
      ],
    },

    // ── SESSION 3: Friday — 1v1 Moves & Crossing ─────────────────────────────
    {
      id: 'session-3',
      number: 3,
      name: '1v1 Moves & Crossing',
      day: 'Friday',
      blocks: [
        {
          name: 'Receiving Drill',
          timeRange: '20–28 min',
          drills: [
            {
              id: 's3-r1',
              name: 'Wide Receiving & Immediate Delivery',
              style: 'Both',
              reps: '10 reps (5 to byline, 5 cutting inside)',
              rest: 'Walk-back recovery',
              setup: 'Ball at cone A (10m inside from touchline), cone B at wide channel, goal in position. Roll ball toward B, sprint onto it',
              decisionCue: 'Cone AHEAD (toward byline) = touch forward, drive, cross. Cone INSIDE (toward centre) = touch inside, cut and shoot. Week 3+: decision cue determines which',
              trains: 'Wide receiving under forward momentum, immediate delivery decision',
            },
          ],
        },
        {
          name: 'Main Drills',
          timeRange: '28–57 min',
          drills: [
            {
              id: 's3-d1',
              name: 'Stepover Gauntlet',
              style: 'CR7',
              reps: '8 runs',
              rest: '45s',
              setup: '5 cones in line 2m apart, goal 15m away. Dribble at pace, stepover at each cone (alternate exit direction), burst past last cone and shoot',
              trains: 'Stepover deception through congestion, directness, shot under pressure',
              notes: 'Week 3+: add second stepover at each cone',
            } as any,
            {
              id: 's3-d2',
              name: 'Neymar Shoulder Drop',
              style: 'Neymar',
              reps: '10 reps',
              rest: '30s',
              setup: 'Single cone as defender. Approach at controlled pace',
              decisionCue: 'Coloured cone LEFT = defender showing outside → sell outside shoulder drop, go inside. Cone RIGHT = showing inside → sell inside, go outside',
              trains: 'Body feint with defender reading, directional explosion based on stance',
            },
            {
              id: 's3-d3',
              name: 'Cruyff and Cross',
              style: 'Neymar',
              reps: '8 reps each side',
              rest: '45s',
              setup: 'Cone at 20m from byline, coloured cone placed at byline, goal in position',
              decisionCue: 'Cone PRESENT at byline = Cruyff first then cross from new angle. No cone = no defender, whip cross directly',
              trains: 'Cruyff vs direct cross decision, reading defender presence at byline',
            },
            {
              id: 's3-d4',
              name: 'Combination Run Circuit',
              style: 'Both',
              reps: '12 reps (6 each side)',
              rest: 'Walk-back recovery',
              setup: 'Cone A (wide 30m out), cone B (wide byline), cone C (penalty spot), coloured cone at B. Sprint A→B, beat byline cone with feint',
              decisionCue: 'Cone PRESENT at B = near-post cross. No cone at B = cut inside and shoot from C',
              trains: 'Full winger movement — read final decision under sprint fatigue',
            },
          ],
        },
        {
          name: 'Crossing Block',
          timeRange: '57–65 min',
          drills: [
            {
              id: 's3-c1',
              name: 'Crossing Accuracy',
              style: 'CR7',
              reps: '20 crosses (10 right, 10 left)',
              rest: '20s between crosses',
              setup: 'Right: 5 near-post driven, 5 whipped far-post. Left: same split.',
              trains: 'Crossing pace and accuracy — low driven crosses hardest to defend',
            },
          ],
        },
        {
          name: 'Stamina Block',
          timeRange: '65–73 min',
          drills: [
            {
              id: 's3-s1',
              name: 'Crossing Endurance Run',
              style: 'CR7',
              reps: '5 reps/side (Wks 1–2) / 7 reps/side (Wks 3–4) / 8 reps/side (Wks 5–6)',
              rest: '30s between reps',
              setup: 'Full wide channel byline to halfway (~50m). Sprint halfway to byline, deliver accurate cross, sprint back.',
              trains: 'Position-specific crossing endurance — doesn\'t count if cross is out of play',
              weeklyProgression: '5→7→8 reps/side',
            },
            {
              id: 's3-s2',
              name: 'Wide Channel Shuttle',
              style: 'Both',
              reps: '6 reps (Wks 1–2) / 8 reps (Wks 3–4) / 10 reps (Wks 5–6)',
              rest: '90s seated after every 3 reps',
              setup: '4 cones: A (start), B (10m), C (20m), D (30m). Sprint A→D, jog back.',
              trains: 'Repeated sprint ability',
              weeklyProgression: '6→8→10 reps',
            },
          ],
        },
        {
          name: 'Fatigue-State Reps',
          timeRange: '73–78 min',
          drills: [
            {
              id: 's3-fat1',
              name: 'Combination Run Circuit (Fatigue)',
              style: 'Both',
              reps: '5 reps',
              rest: '45s (Wks 1–2) / 30s (Wks 3–4) / 20s (Wks 5–6)',
              setup: 'Same as main drill, decision cue active at cone B',
              trains: 'Full winger circuit quality maintained under fatigue',
              weeklyProgression: '45s→30s→20s rest',
            },
          ],
        },
      ],
    },

    // ── SESSION 4: Weekend — Full Circuit Match Prep ──────────────────────────
    {
      id: 'session-4',
      number: 4,
      name: 'Full Circuit Match Prep',
      day: 'Weekend',
      blocks: [
        {
          name: '1v1 Moves with Cues',
          timeRange: '20–35 min',
          drills: [
            {
              id: 's4-d1',
              name: '1v1 Move Rotation',
              style: 'Both',
              reps: '3 reps each: stepover / body feint / elastico / Cruyff',
              rest: '30s between moves',
              setup: '85% intensity, all decision cues active',
              trains: 'Match-realistic move execution with decision reading',
            },
          ],
        },
        {
          name: 'Wide Run Circuit',
          timeRange: '35–50 min',
          drills: [
            {
              id: 's4-d2',
              name: 'Sprint-Receive-Beat-Deliver',
              style: 'Both',
              reps: '90–95% intensity, 8–10 reps',
              rest: 'Walk-back',
              setup: 'Sprint, receive wide, beat byline, cross or cut and shoot based on decision cue',
              trains: 'Full winger sequence at near-match intensity',
            },
          ],
        },
        {
          name: 'Finishing',
          timeRange: '50–60 min',
          drills: [
            {
              id: 's4-f1',
              name: '10-Shot Sequence',
              style: 'Both',
              reps: '10 shots from different positions',
              rest: '20s between shots',
              setup: '90% intensity. Vary position: penalty spot, outside box left, outside box right, driven from wide',
              trains: 'Composure and technique from multiple angles',
            },
          ],
        },
        {
          name: 'Light Stamina',
          timeRange: '60–68 min',
          drills: [
            {
              id: 's4-s1',
              name: 'Dribble & Recover Circuit (Easy)',
              style: 'Both',
              reps: '5 reps only — 75% effort',
              rest: '45s',
              setup: 'Same circuit as Session 2 but at reduced intensity',
              trains: 'Stamina maintenance without overdoing pre-game fatigue',
            },
          ],
        },
        {
          name: 'Fatigue-State Reps',
          timeRange: '68–73 min',
          drills: [
            {
              id: 's4-fat1',
              name: 'L-Shaped 1v1 (Match-Intensity Fatigue)',
              style: 'Both',
              reps: '5 reps at 95% — treat like a real game',
              rest: '20s',
              setup: 'Decision cue active. Full commitment every rep.',
              trains: 'Closing out a session the way you close out a match',
            },
          ],
        },
      ],
    },
  ],

  sixMoves: [
    {
      name: 'Stepover',
      style: 'CR7',
      when: 'Defender standing still, forces commitment',
      mistake: 'Doing it too slowly — no deception',
    },
    {
      name: 'Body Feint / Shoulder Drop',
      style: 'Neymar',
      when: 'Defender tight, watching your feet',
      mistake: 'Not committing — half-hearted feint beats nobody',
    },
    {
      name: 'Elastico',
      style: 'Neymar',
      when: 'Tight space, need quick direction change',
      mistake: 'Telegraphing the outside touch before execution',
    },
    {
      name: 'Cruyff Turn',
      style: 'Both',
      when: 'Defender cuts off forward pass',
      mistake: 'Too many touches after the turn — lose the advantage',
    },
    {
      name: 'Drag-Back',
      style: 'Both',
      when: 'Pressed from behind or side',
      mistake: 'Dragging too slowly — defender catches up',
    },
    {
      name: 'First Touch Forward',
      style: 'CR7',
      when: 'Open space ahead of you',
      mistake: 'Controlling backward when space exists to exploit',
    },
  ],

  weeklyProgressions: [
    {
      weekRange: '1-2',
      phase: 'base',
      label: 'Foundation',
      technicalNotes: '70–80% pace. Set decision cues before starting your run. Lower rep counts. Focus on quality and committing fully to each move.',
      staminaRest: '45s between reps (all stamina drills)',
      fatigueRest: '45s between fatigue-state reps',
    },
    {
      weekRange: '3-4',
      phase: 'development',
      label: 'Development',
      technicalNotes: '90%+ pace. Set cues mid walk-back — read them as you arrive. Add a second move at each cone in stepover gauntlet. Increase reps per drill.',
      staminaRest: '30s between reps',
      fatigueRest: '30s between fatigue-state reps',
    },
    {
      weekRange: '5-6',
      phase: 'peak',
      label: 'Match Simulation',
      technicalNotes: 'Full pace, full commitment. Cue set during previous rep — read at last moment. Full rep targets. Benchmark week 6: film L-shaped 1v1 and wide channel sprint quality.',
      staminaRest: '20s between reps',
      fatigueRest: '20s between fatigue-state reps',
    },
  ],

  commitRule:
    "A half-hearted feint beats nobody. The defender reads hesitation. Your entire body sells it — eyes, hips, shoulders, not just feet.",
}

// ─── Helper: get today's sessions by day of week ──────────────────────────────
export function getTodaySessions(dayName: string): {
  gym: (typeof GYM_PLAN.sessions)[number] | null
  football: (typeof FOOTBALL_PLAN.sessions)[number] | null
} {
  const gymSession = GYM_PLAN.sessions.find((s) => s.day === dayName) ?? null
  const footballSession = FOOTBALL_PLAN.sessions.find((s) => s.day === dayName) ?? null
  return { gym: gymSession, football: footballSession }
}

export function getGymSessionBySlug(slug: string) {
  return GYM_PLAN.sessions.find((s) => s.id === slug) ?? null
}

export function getFootballSessionById(id: string) {
  return FOOTBALL_PLAN.sessions.find((s) => s.id === id) ?? null
}
