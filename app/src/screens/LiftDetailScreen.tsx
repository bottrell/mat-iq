import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DayPlan } from '@mat-iq/engine';
import { useTraining } from '../state/TrainingContext.tsx';
import { Card } from '../ui/components.tsx';
import { colors } from '../ui/theme.ts';
import { formatWeight } from '../ui/units.ts';

const UNIT_SUFFIX = { reps: '', seconds: 's', yards: 'yd' } as const;

export function LiftDetailScreen({
  plan,
  onStart,
}: {
  plan: DayPlan;
  onStart: () => void;
}) {
  const { profile } = useTraining();
  const lift = plan.lift;
  if (!lift || !profile) return null;

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

      <Pressable
        accessibilityRole="button"
        onPress={onStart}
        style={({ pressed }) => [styles.start, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={styles.startText}>Start workout</Text>
      </Pressable>
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
});
