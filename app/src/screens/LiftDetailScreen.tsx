import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DayPlan } from '@mat-iq/engine';
import { useTraining } from '../state/TrainingContext.tsx';
import { useWorkout } from '../state/WorkoutContext.tsx';
import { Card } from '../ui/components.tsx';
import { colors } from '../ui/theme.ts';
import { formatWeight, fromLb } from '../ui/units.ts';

const UNIT_SUFFIX = { reps: '', seconds: 's', yards: 'yd' } as const;

export function LiftDetailScreen({
  plan,
  onStart,
}: {
  plan: DayPlan;
  onStart: () => void;
}) {
  const { profile } = useTraining();
  const { completedToday } = useWorkout();
  const lift = plan.lift;
  if (!lift || !profile) return null;

  const alreadyDone = completedToday.find((w) => w.label === lift.label);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        {lift.label} · ~{lift.estimatedMinutes} min
      </Text>

      {lift.exercises.map((prescribed) => (
        <Card key={prescribed.exercise.id}>
          <Text style={styles.name}>{prescribed.exercise.name}</Text>
          <Text style={styles.prescription}>
            {prescribed.sets}×{prescribed.repRange[0]}–{prescribed.repRange[1]}
            {UNIT_SUFFIX[prescribed.exercise.prescribedIn]}
            {prescribed.targetWeightLb
              ? `  ·  ${formatWeight(prescribed.targetWeightLb, profile.units)}`
              : '  ·  your working weight'}
          </Text>
          {prescribed.notes ? <Text style={styles.note}>{prescribed.notes}</Text> : null}
        </Card>
      ))}

      {alreadyDone ? (
        <View style={styles.completed}>
          <Text style={styles.completedTitle}>✓ Completed today</Text>
          <Text style={styles.completedMeta}>
            {alreadyDone.setCount} {alreadyDone.setCount === 1 ? 'set' : 'sets'} logged
            {alreadyDone.volumeLb > 0
              ? ` · ${Math.round(fromLb(alreadyDone.volumeLb, profile.units)).toLocaleString()} ${profile.units} moved`
              : ''}
          </Text>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={onStart}
          style={({ pressed }) => [styles.start, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.startText}>Start workout</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 48 },
  subtitle: { color: colors.textMuted, fontSize: 15, marginBottom: 16 },
  name: { color: colors.text, fontSize: 17, fontWeight: '600' },
  prescription: { color: colors.textMuted, fontSize: 15, marginTop: 4 },
  note: { color: colors.warn, fontSize: 13, marginTop: 6, fontStyle: 'italic' },
  start: {
    backgroundColor: colors.accent,
    borderRadius: 11,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  startText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  completed: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.done,
    padding: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  completedTitle: { color: colors.done, fontSize: 16, fontWeight: '600' },
  completedMeta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
});
