import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import type { ExperienceLevel, Goal } from '@mat-iq/engine';
import type { StoredProfile, Units } from '../db/repository.ts';
import { Button, ChipGroup, Hint, NumberField, SectionTitle } from '../ui/components.tsx';
import { colors } from '../ui/theme.ts';
import { fromLb, toLb } from '../ui/units.ts';

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

/** Blank means "I don't know" — the engine omits a target load rather than inventing one. */
const parseWeight = (text: string, units: Units): number | undefined => {
  const value = Number.parseFloat(text);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return Math.round(toLb(value, units));
};

const displayWeight = (weightLb: number | undefined, units: Units): string =>
  weightLb === undefined ? '' : String(Math.round(fromLb(weightLb, units)));

export function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
  header,
}: {
  initial?: StoredProfile | null;
  submitLabel: string;
  onSubmit: (profile: Omit<StoredProfile, 'onboardedAt' | 'liftDaysOverride'>) => Promise<void>;
  header?: React.ReactNode;
}) {
  const startingUnits = initial?.units ?? 'lb';

  const [experience, setExperience] = useState<ExperienceLevel>(initial?.experience ?? 'intermediate');
  const [goals, setGoals] = useState<Goal[]>(initial?.goals ?? ['strength']);
  const [units, setUnits] = useState<Units>(startingUnits);
  const [bodyweight, setBodyweight] = useState(displayWeight(initial?.bodyweightLb, startingUnits));
  const [squat, setSquat] = useState(displayWeight(initial?.workingWeightsLb.squat, startingUnits));
  const [hinge, setHinge] = useState(displayWeight(initial?.workingWeightsLb.hinge, startingUnits));
  const [press, setPress] = useState(displayWeight(initial?.workingWeightsLb.press, startingUnits));
  const [row, setRow] = useState(displayWeight(initial?.workingWeightsLb.row, startingUnits));
  const [saving, setSaving] = useState(false);

  /**
   * Switching units rewrites the visible numbers so the fields keep meaning the
   * same weight. Without this, "225" silently becomes 225 kg.
   */
  const changeUnits = (next: Units) => {
    if (next === units) return;
    const convert = (text: string) => {
      const asLb = parseWeight(text, units);
      return displayWeight(asLb, next);
    };
    setBodyweight(convert(bodyweight));
    setSquat(convert(squat));
    setHinge(convert(hinge));
    setPress(convert(press));
    setRow(convert(row));
    setUnits(next);
  };

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit({
        experience,
        goals,
        units,
        bodyweightLb: parseWeight(bodyweight, units),
        weightClassTargetLb: initial?.weightClassTargetLb,
        workingWeightsLb: {
          squat: parseWeight(squat, units),
          hinge: parseWeight(hinge, units),
          press: parseWeight(press, units),
          row: parseWeight(row, units),
        },
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
        {header}

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
          onChange={([next]) => next && changeUnits(next)}
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
        <Hint>Optional. Used for relative-strength tracking and weight-class planning.</Hint>
        <NumberField
          label="Bodyweight"
          value={bodyweight}
          onChange={setBodyweight}
          placeholder="e.g. 180"
          suffix={units}
        />

        <Button
          label={saving ? 'Saving…' : submitLabel}
          onPress={submit}
          disabled={goals.length === 0 || saving}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 56 },
  error: { color: colors.danger, fontSize: 13, marginTop: 8 },
});
