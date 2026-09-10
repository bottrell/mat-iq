import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ExperienceLevel, Goal } from '@mat-iq/engine';
import { useTraining } from '../state/TrainingContext.tsx';
import type { Units } from '../db/repository.ts';
import { Button, ChipGroup, Hint, NumberField, SectionTitle } from '../ui/components.tsx';
import { colors } from '../ui/theme.ts';
import { toLb } from '../ui/units.ts';

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'strength', label: 'Strength for grappling' },
  { value: 'conditioning', label: 'Gas tank' },
];

const UNIT_OPTIONS: { value: Units; label: string }[] = [
  { value: 'lb', label: 'Pounds' },
  { value: 'kg', label: 'Kilograms' },
];

/** Blank means "I don't know" — the engine simply omits a target load. */
const parseWeight = (text: string, units: Units): number | undefined => {
  const value = Number.parseFloat(text);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return Math.round(toLb(value, units));
};

export function OnboardingScreen() {
  const { saveProfile } = useTraining();

  const [experience, setExperience] = useState<ExperienceLevel>('intermediate');
  const [goals, setGoals] = useState<Goal[]>(['strength']);
  const [units, setUnits] = useState<Units>('lb');
  const [bodyweight, setBodyweight] = useState('');
  const [squat, setSquat] = useState('');
  const [hinge, setHinge] = useState('');
  const [press, setPress] = useState('');
  const [row, setRow] = useState('');
  const [saving, setSaving] = useState(false);

  const canContinue = goals.length > 0 && !saving;

  const onFinish = async () => {
    setSaving(true);
    try {
      await saveProfile({
        experience,
        goals,
        units,
        bodyweightLb: parseWeight(bodyweight, units),
        workingWeightsLb: {
          squat: parseWeight(squat, units),
          hinge: parseWeight(hinge, units),
          press: parseWeight(press, units),
          row: parseWeight(row, units),
        },
        onboardedAt: new Date().toISOString(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Let's set you up</Text>
        <Text style={styles.subtitle}>
          Four quick things, then we'll build your week around your mat schedule.
        </Text>

        <SectionTitle>How long have you been lifting?</SectionTitle>
        <Hint>This sets your starting volume and how fast loads climb.</Hint>
        <ChipGroup
          options={EXPERIENCE_OPTIONS}
          selected={[experience]}
          onChange={([next]) => next && setExperience(next)}
        />

        <SectionTitle>What are you training for?</SectionTitle>
        <Hint>Pick one or both.</Hint>
        <ChipGroup options={GOAL_OPTIONS} selected={goals} onChange={setGoals} multi />
        {goals.length === 0 ? <Text style={styles.error}>Pick at least one goal.</Text> : null}

        <SectionTitle>Units</SectionTitle>
        <ChipGroup
          options={UNIT_OPTIONS}
          selected={[units]}
          onChange={([next]) => next && setUnits(next)}
        />

        <SectionTitle>Current working weights</SectionTitle>
        <Hint>
          What you use for a hard set of 5–8 reps. Leave blank if you're unsure — we'll tell you to
          start light and find it instead of inventing a number.
        </Hint>
        <NumberField label="Squat" value={squat} onChange={setSquat} placeholder="e.g. 225" suffix={units} />
        <NumberField label="Deadlift / hinge" value={hinge} onChange={setHinge} placeholder="e.g. 275" suffix={units} />
        <NumberField label="Press" value={press} onChange={setPress} placeholder="e.g. 155" suffix={units} />
        <NumberField label="Row" value={row} onChange={setRow} placeholder="e.g. 135" suffix={units} />

        <SectionTitle>Bodyweight</SectionTitle>
        <Hint>Optional. Used for load-relative progress and weight-class planning later.</Hint>
        <NumberField
          label="Bodyweight"
          value={bodyweight}
          onChange={setBodyweight}
          placeholder="e.g. 180"
          suffix={units}
        />

        <View style={styles.footer}>
          <Button label={saving ? 'Saving…' : 'Build my week'} onPress={onFinish} disabled={!canContinue} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingTop: 72, paddingBottom: 56 },
  title: { color: colors.text, fontSize: 30, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 15, marginTop: 6, marginBottom: 10 },
  error: { color: colors.danger, fontSize: 13, marginTop: 8 },
  footer: { marginTop: 20 },
});
