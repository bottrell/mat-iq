/** Prints a generated training week. Run: node packages/engine/demo.ts */
import { generateRoutine } from './src/generate.ts';
import { weeklyFatigue } from './src/fatigue.ts';
import { WEEKDAY_NAMES, type BjjSession, type LifterProfile } from './src/types.ts';

const profile: LifterProfile = {
  experience: 'intermediate',
  goals: ['strength', 'conditioning'],
  workingWeightsLb: { squat: 225, hinge: 275, press: 155, row: 135 },
  bodyweightLb: 180,
};

const week: BjjSession[] = [
  { day: 0, rounds: 6, intensity: 'hard' },
  { day: 2, rounds: 5, intensity: 'medium' },
  { day: 4, rounds: 8, intensity: 'hard' },
  { day: 5, rounds: 10, intensity: 'medium' }, // Saturday open mat
];

const routine = generateRoutine(profile, week);

console.log('\n=== MAT SCHEDULE ===');
for (const s of week) {
  console.log(`  ${WEEKDAY_NAMES[s.day].padEnd(10)} ${s.rounds} rounds, ${s.intensity}`);
}
console.log(`  Weekly mat fatigue: ${weeklyFatigue(week).toFixed(1)}`);

console.log('\n=== WHY THIS PROGRAM ===');
for (const line of routine.rationale) console.log(`  - ${line}`);

console.log('\n=== LIFTING WEEK ===');
for (const session of routine.sessions) {
  console.log(`\n  ${WEEKDAY_NAMES[session.day]} — ${session.label} (~${session.estimatedMinutes} min)`);
  for (const p of session.exercises) {
    const load = p.targetWeightLb ? `@ ${p.targetWeightLb} lb` : '@ your working weight';
    const unit = { reps: '', seconds: 's', yards: 'yd' }[p.exercise.prescribedIn];
    const reps = `${p.sets}x${p.repRange[0]}-${p.repRange[1]}${unit}`;
    console.log(`    ${p.exercise.name.padEnd(26)} ${reps.padEnd(10)} ${load}`);
    if (p.notes) console.log(`      ${p.notes}`);
  }
}
console.log();
