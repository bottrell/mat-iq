import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { DayPlan, PrescribedExercise } from '@mat-iq/engine';
import { useWorkout } from '../state/WorkoutContext.tsx';
import { useTraining } from '../state/TrainingContext.tsx';
import { colors } from '../ui/theme.ts';
import { fromLb, toLb } from '../ui/units.ts';
import type { Units } from '../db/repository.ts';

const UNIT_NOUN = { reps: 'reps', seconds: 'sec', yards: 'yd' } as const;

/** One prescribed set: target on the left, what you actually did on the right. */
function SetRow({
  prescribed,
  setIndex,
  logged,
  units,
  onLog,
  onUndo,
}: {
  prescribed: PrescribedExercise;
  setIndex: number;
  logged?: { id: number; reps: number; weightLb?: number };
  units: Units;
  onLog: (reps: number, weightLb?: number) => void;
  onUndo: (id: number) => void;
}) {
  const showsWeight = prescribed.exercise.prescribedIn === 'reps';
  // Prefill with the top of the range and the prescribed load — the target to
  // chase. Editing down is faster than typing from empty every set.
  const [reps, setReps] = useState(String(prescribed.repRange[1]));
  const [weight, setWeight] = useState(
    prescribed.targetWeightLb ? String(Math.round(fromLb(prescribed.targetWeightLb, units))) : '',
  );

  if (logged) {
    return (
      <View style={[styles.setRow, styles.setRowDone]}>
        <Text style={styles.setNumber}>{setIndex + 1}</Text>
        <Text style={styles.setDone}>
          {logged.reps} {UNIT_NOUN[prescribed.exercise.prescribedIn]}
          {logged.weightLb ? ` · ${Math.round(fromLb(logged.weightLb, units))} ${units}` : ''}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Undo set ${setIndex + 1}`}
          onPress={() => onUndo(logged.id)}
          hitSlop={8}
        >
          <Text style={styles.undo}>Undo</Text>
        </Pressable>
      </View>
    );
  }

  const submit = () => {
    const repsValue = Number.parseInt(reps, 10);
    if (!Number.isFinite(repsValue) || repsValue < 0) return;
    const weightValue = Number.parseFloat(weight);
    const weightLb =
      showsWeight && Number.isFinite(weightValue) && weightValue > 0
        ? Math.round(toLb(weightValue, units))
        : undefined;
    onLog(repsValue, weightLb);
  };

  return (
    <View style={styles.setRow}>
      <Text style={styles.setNumber}>{setIndex + 1}</Text>

      <TextInput
        value={reps}
        onChangeText={(t) => setReps(t.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        style={styles.setInput}
        accessibilityLabel={`Set ${setIndex + 1} ${UNIT_NOUN[prescribed.exercise.prescribedIn]}`}
      />
      <Text style={styles.setUnit}>{UNIT_NOUN[prescribed.exercise.prescribedIn]}</Text>

      {showsWeight ? (
        <>
          <TextInput
            value={weight}
            onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="—"
            placeholderTextColor={colors.textDim}
            style={styles.setInput}
            accessibilityLabel={`Set ${setIndex + 1} weight`}
          />
          <Text style={styles.setUnit}>{units}</Text>
        </>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Log set ${setIndex + 1}`}
        onPress={submit}
        style={({ pressed }) => [styles.logButton, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Text style={styles.logButtonText}>Log</Text>
      </Pressable>
    </View>
  );
}

export function WorkoutScreen({ plan, onFinished }: { plan: DayPlan; onFinished: () => void }) {
  const { profile } = useTraining();
  const { sets, logSet, undoSet, complete, discard } = useWorkout();
  const lift = plan.lift;

  if (!lift || !profile) return null;
  const units = profile.units;

  const totalPrescribed = lift.exercises.reduce((n, e) => n + e.sets, 0);
  const done = sets.length;

  const confirmFinish = () => {
    Alert.alert('Finish workout?', `You've logged ${done} of ${totalPrescribed} sets.`, [
      { text: 'Keep going', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          await complete();
          onFinished();
        },
      },
    ]);
  };

  const confirmDiscard = () => {
    Alert.alert('Discard this workout?', 'Everything you logged will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await discard();
          onFinished();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.progress}>
          <Text style={styles.progressText}>
            {done} / {totalPrescribed} sets
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, (done / Math.max(1, totalPrescribed)) * 100)}%` },
              ]}
            />
          </View>
        </View>

        {lift.exercises.map((prescribed) => {
          const forExercise = sets.filter((s) => s.exerciseId === prescribed.exercise.id);

          return (
            <View key={prescribed.exercise.id} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{prescribed.exercise.name}</Text>
              <Text style={styles.target}>
                Target: {prescribed.sets}×{prescribed.repRange[0]}–{prescribed.repRange[1]}
                {prescribed.targetWeightLb
                  ? ` · ${Math.round(fromLb(prescribed.targetWeightLb, units))} ${units}`
                  : ''}
              </Text>
              {prescribed.notes ? <Text style={styles.note}>{prescribed.notes}</Text> : null}

              {Array.from({ length: prescribed.sets }, (_, setIndex) => (
                <SetRow
                  key={`${prescribed.exercise.id}-${setIndex}-${forExercise[setIndex]?.id ?? 'open'}`}
                  prescribed={prescribed}
                  setIndex={setIndex}
                  logged={forExercise[setIndex]}
                  units={units}
                  onLog={(reps, weightLb) =>
                    void logSet({
                      exerciseId: prescribed.exercise.id,
                      exerciseName: prescribed.exercise.name,
                      setIndex,
                      reps,
                      weightLb,
                      prescribedIn: prescribed.exercise.prescribedIn,
                    })
                  }
                  onUndo={(id) => void undoSet(id)}
                />
              ))}
            </View>
          );
        })}

        <Pressable
          accessibilityRole="button"
          onPress={confirmFinish}
          style={({ pressed }) => [styles.finish, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.finishText}>Finish workout</Text>
        </Pressable>

        <Pressable accessibilityRole="button" onPress={confirmDiscard} style={styles.discard}>
          <Text style={styles.discardText}>Discard</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 56 },
  progress: { marginBottom: 18 },
  progressText: { color: colors.textMuted, fontSize: 14, marginBottom: 8 },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: colors.cardRaised },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.accent },
  exerciseCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  exerciseName: { color: colors.text, fontSize: 17, fontWeight: '600' },
  target: { color: colors.textMuted, fontSize: 13, marginTop: 3, marginBottom: 12 },
  note: { color: colors.warn, fontSize: 12, fontStyle: 'italic', marginTop: -8, marginBottom: 12 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  setRowDone: { opacity: 0.85 },
  setNumber: { color: colors.textDim, fontSize: 13, width: 16 },
  setInput: {
    backgroundColor: colors.cardRaised,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: colors.text,
    fontSize: 15,
    minWidth: 58,
    textAlign: 'center',
  },
  setUnit: { color: colors.textDim, fontSize: 12 },
  setDone: { color: colors.text, fontSize: 15, flex: 1 },
  undo: { color: colors.textMuted, fontSize: 13 },
  logButton: {
    marginLeft: 'auto',
    backgroundColor: colors.accentMuted,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  logButtonText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  finish: {
    backgroundColor: colors.accent,
    borderRadius: 11,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  finishText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  discard: { alignItems: 'center', paddingVertical: 16 },
  discardText: { color: colors.danger, fontSize: 14 },
});
