import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WEEKDAY_NAMES } from '@mat-iq/engine';
import { useTraining } from '../state/TrainingContext.tsx';
import { Card, Hint } from '../ui/components.tsx';
import { colors } from '../ui/theme.ts';
import { formatWeight } from '../ui/units.ts';

const UNIT_SUFFIX = { reps: '', seconds: 's', yards: 'yd' } as const;

export function WeekScreen({ onEditSchedule }: { onEditSchedule: () => void }) {
  const { routine, profile, sessions, setLiftDaysOverride } = useTraining();

  if (!routine || !profile) return null;

  const units = profile.units;
  const recommended = routine.recommendedLiftDays;
  const actual = routine.sessions.length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        Mat load {routine.weeklyBjjFatigue} · {sessions.length} mat{' '}
        {sessions.length === 1 ? 'session' : 'sessions'}
      </Text>

      {sessions.length === 0 ? (
        <Pressable onPress={onEditSchedule} accessibilityRole="button">
          <Card style={styles.prompt}>
            <Text style={styles.promptTitle}>Add your mat schedule</Text>
            <Text style={styles.promptBody}>
              Right now this is a generic lifting program. Tell us when you roll and it becomes a
              program built around it.
            </Text>
          </Card>
        </Pressable>
      ) : null}

      {/* "Engine recommends, user overrides" — the override lives here, next to
          the consequence, rather than buried in settings. */}
      <Card>
        <View style={styles.overrideHeader}>
          <Text style={styles.overrideTitle}>Lifting days</Text>
          <Text style={styles.overrideRecommendation}>
            {actual === recommended ? `${recommended} recommended` : `${recommended} recommended`}
          </Text>
        </View>
        <View style={styles.dayPicker}>
          {[1, 2, 3, 4].map((days) => {
            const active = actual === days;
            return (
              <Pressable
                key={days}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${days} lifting days`}
                onPress={() => setLiftDaysOverride(days === recommended ? undefined : days)}
                style={({ pressed }) => [
                  styles.dayOption,
                  {
                    backgroundColor: active ? colors.accent : colors.cardRaised,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={[styles.dayOptionText, { color: active ? '#fff' : colors.textMuted }]}>
                  {days}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {profile.liftDaysOverride !== undefined && profile.liftDaysOverride !== recommended ? (
          <Text style={styles.overrideNote}>
            You've overridden the recommendation. Tap {recommended} to go back to it.
          </Text>
        ) : null}
      </Card>

      {routine.sessions.map((session) => (
        <Card key={session.day}>
          <View style={styles.cardHeader}>
            <Text style={styles.day}>{WEEKDAY_NAMES[session.day]}</Text>
            <Text style={styles.duration}>~{session.estimatedMinutes} min</Text>
          </View>
          <Text style={styles.label}>{session.label}</Text>

          {session.exercises.map((prescribed) => (
            <View key={prescribed.exercise.id} style={styles.exercise}>
              <Text style={styles.exerciseName}>{prescribed.exercise.name}</Text>
              <Text style={styles.prescription}>
                {prescribed.sets}×{prescribed.repRange[0]}–{prescribed.repRange[1]}
                {UNIT_SUFFIX[prescribed.exercise.prescribedIn]}
                {prescribed.targetWeightLb
                  ? `  ·  ${formatWeight(prescribed.targetWeightLb, units)}`
                  : ''}
              </Text>
              {prescribed.notes ? <Text style={styles.note}>{prescribed.notes}</Text> : null}
            </View>
          ))}
        </Card>
      ))}

      <Text style={styles.sectionTitle}>Why this program</Text>
      {routine.rationale.map((line, index) => (
        <Text key={`${index}-${line}`} style={styles.rationale}>
          • {line}
        </Text>
      ))}

      <Hint>{'\n'}Programming assumes a typical commercial gym.</Hint>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 48 },
  subtitle: { color: colors.textMuted, fontSize: 15, marginBottom: 18 },
  prompt: { backgroundColor: colors.accentMuted },
  promptTitle: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 4 },
  promptBody: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  overrideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  overrideTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  overrideRecommendation: { color: colors.textMuted, fontSize: 13 },
  dayPicker: { flexDirection: 'row', gap: 8 },
  dayOption: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  dayOptionText: { fontSize: 16, fontWeight: '600' },
  overrideNote: { color: colors.warn, fontSize: 12, marginTop: 10, lineHeight: 17 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  day: { color: colors.text, fontSize: 19, fontWeight: '600' },
  duration: { color: colors.textMuted, fontSize: 13 },
  label: { color: colors.accent, fontSize: 13, fontWeight: '600', marginTop: 2, marginBottom: 12 },
  exercise: { marginBottom: 10 },
  exerciseName: { color: '#e4e7ee', fontSize: 15, fontWeight: '500' },
  prescription: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
  note: { color: colors.warn, fontSize: 12, marginTop: 3, fontStyle: 'italic' },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '600', marginTop: 14, marginBottom: 8 },
  rationale: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 4 },
});
