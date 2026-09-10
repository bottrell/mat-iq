import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WEEKDAY_NAMES, weeklyFatigue, type Intensity, type Weekday } from '@mat-iq/engine';
import { useTraining } from '../state/TrainingContext.tsx';
import { ChipGroup, Hint, Stepper } from '../ui/components.tsx';
import { colors, intensityColor } from '../ui/theme.ts';

const DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

const INTENSITY_OPTIONS: { value: Intensity; label: string; color: string }[] = [
  { value: 'light', label: 'Light', color: intensityColor.light },
  { value: 'medium', label: 'Medium', color: intensityColor.medium },
  { value: 'hard', label: 'Hard', color: intensityColor.hard },
];

export function ScheduleScreen() {
  const { sessions, addSession, updateSession, deleteSession } = useTraining();

  const fatigue = weeklyFatigue(sessions);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Hint>
        Add every session you plan to train. Rounds and intensity are what drive your lifting
        program — change them and your week rebuilds instantly.
      </Hint>

      <View style={styles.summary}>
        <Text style={styles.summaryValue}>{fatigue.toFixed(1)}</Text>
        <Text style={styles.summaryLabel}>weekly mat load</Text>
      </View>

      {DAYS.map((day) => {
        const daySessions = sessions.filter((s) => s.day === day);

        return (
          <View key={day} style={styles.dayBlock}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>{WEEKDAY_NAMES[day]}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Add session on ${WEEKDAY_NAMES[day]}`}
                onPress={() => addSession({ day, rounds: 5, intensity: 'medium' })}
                style={({ pressed }) => [styles.addButton, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={styles.addButtonText}>+ Session</Text>
              </Pressable>
            </View>

            {daySessions.length === 0 ? (
              <Text style={styles.restDay}>Rest day</Text>
            ) : (
              daySessions.map((session) => (
                <View key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionRow}>
                    <Text style={styles.sessionLabel}>Rounds</Text>
                    <Stepper
                      value={session.rounds}
                      onChange={(rounds) => updateSession(session.id, { rounds })}
                      max={25}
                    />
                  </View>

                  <Text style={styles.sessionLabel}>Intensity</Text>
                  <ChipGroup
                    options={INTENSITY_OPTIONS}
                    selected={[session.intensity]}
                    onChange={([intensity]) =>
                      intensity && updateSession(session.id, { intensity })
                    }
                  />

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove session"
                    onPress={() => deleteSession(session.id)}
                    style={({ pressed }) => [styles.remove, { opacity: pressed ? 0.6 : 1 }]}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        );
      })}

      {sessions.length === 0 ? (
        <Text style={styles.emptyNote}>
          No mat sessions yet. With an empty week the engine will program you like a lifter, not a
          grappler.
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 48 },
  summary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 20,
  },
  summaryValue: { color: colors.accent, fontSize: 30, fontWeight: '700' },
  summaryLabel: { color: colors.textMuted, fontSize: 14 },
  dayBlock: { marginBottom: 20 },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: { color: colors.text, fontSize: 17, fontWeight: '600' },
  addButton: {
    backgroundColor: colors.accentMuted,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addButtonText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  restDay: { color: colors.textDim, fontSize: 14, fontStyle: 'italic' },
  sessionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 8 },
  remove: { alignSelf: 'flex-start', marginTop: 12 },
  removeText: { color: colors.danger, fontSize: 13, fontWeight: '500' },
  emptyNote: { color: colors.textDim, fontSize: 13, lineHeight: 19, marginTop: 8 },
});
