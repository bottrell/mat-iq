import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { DayPlan, Intensity } from '@mat-iq/engine';
import { useWorkout } from '../state/WorkoutContext.tsx';
import type { SessionType } from '../db/logs.ts';
import { Button, ChipGroup, Hint, SectionTitle, Stepper } from '../ui/components.tsx';
import { colors, intensityColor } from '../ui/theme.ts';

const INTENSITY_OPTIONS: { value: Intensity; label: string; color: string }[] = [
  { value: 'light', label: 'Light', color: intensityColor.light },
  { value: 'medium', label: 'Medium', color: intensityColor.medium },
  { value: 'hard', label: 'Hard', color: intensityColor.hard },
];

const TYPE_OPTIONS: { value: SessionType; label: string }[] = [
  { value: 'gi', label: 'Gi' },
  { value: 'nogi', label: 'No-Gi' },
  { value: 'open_mat', label: 'Open Mat' },
  { value: 'drilling', label: 'Drilling' },
];

export function MatLogScreen({ plan, onSaved }: { plan: DayPlan; onSaved: () => void }) {
  const { logMat } = useWorkout();

  // Prefilled from what was planned — most sessions go roughly as intended, so
  // the common case is confirm-and-save rather than data entry.
  const planned = plan.matSessions[0];
  const [rounds, setRounds] = useState(planned?.rounds ?? 5);
  const [intensity, setIntensity] = useState<Intensity>(planned?.intensity ?? 'medium');
  const [sessionType, setSessionType] = useState<SessionType>('gi');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await logMat({
        day: plan.day,
        rounds,
        intensity,
        sessionType,
        notes: notes.trim() || undefined,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Hint>
          What actually happened. This is a record of your training — it does not change the
          program you were given.
        </Hint>

        <SectionTitle>Rounds rolled</SectionTitle>
        <View style={styles.stepperRow}>
          <Stepper value={rounds} onChange={setRounds} max={30} suffix="rounds" />
        </View>
        <Hint>Drilling-only session? Leave it at zero.</Hint>

        <SectionTitle>How hard was it?</SectionTitle>
        <ChipGroup
          options={INTENSITY_OPTIONS}
          selected={[intensity]}
          onChange={([next]) => next && setIntensity(next)}
        />

        <SectionTitle>Session type</SectionTitle>
        <ChipGroup
          options={TYPE_OPTIONS}
          selected={[sessionType]}
          onChange={([next]) => next && setSessionType(next)}
        />

        <SectionTitle>Drills and notes</SectionTitle>
        <Hint>What you worked, what you got caught in, anything worth remembering.</Hint>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Half guard passing, leg drag entries…"
          placeholderTextColor={colors.textDim}
          multiline
          style={styles.notes}
          accessibilityLabel="Drills and notes"
        />

        <Button label={saving ? 'Saving…' : 'Log session'} onPress={save} disabled={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 56 },
  stepperRow: { marginBottom: 4 },
  notes: {
    backgroundColor: colors.cardRaised,
    borderRadius: 10,
    padding: 13,
    color: colors.text,
    fontSize: 15,
    minHeight: 96,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
});
