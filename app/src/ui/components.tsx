import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from './theme.ts';

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Hint({ children }: { children: ReactNode }) {
  return <Text style={styles.hint}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const tint =
    variant === 'primary' ? colors.accent : variant === 'danger' ? colors.danger : colors.cardRaised;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: tint, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

/** Single- or multi-select pills. */
export function ChipGroup<T extends string>({
  options,
  selected,
  onChange,
  multi = false,
}: {
  options: { value: T; label: string; color?: string }[];
  selected: T[];
  onChange: (next: T[]) => void;
  multi?: boolean;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const active = selected.includes(option.value);
        const activeColor = option.color ?? colors.accent;
        return (
          <Pressable
            key={option.value}
            accessibilityRole={multi ? 'checkbox' : 'radio'}
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!multi) {
                onChange([option.value]);
                return;
              }
              onChange(
                active ? selected.filter((v) => v !== option.value) : [...selected, option.value],
              );
            }}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: active ? activeColor : colors.cardRaised,
                borderColor: active ? activeColor : colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={[styles.chipLabel, { color: active ? '#fff' : colors.textMuted }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Minus / value / plus. The primary way rounds get entered. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 30,
  suffix,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease"
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={({ pressed }) => [
          styles.stepperButton,
          { opacity: value <= min ? 0.3 : pressed ? 0.6 : 1 },
        ]}
      >
        <Text style={styles.stepperSymbol}>−</Text>
      </Pressable>

      <Text style={styles.stepperValue}>
        {value}
        {suffix ? <Text style={styles.stepperSuffix}> {suffix}</Text> : null}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase"
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={({ pressed }) => [
          styles.stepperButton,
          { opacity: value >= max ? 0.3 : pressed ? 0.6 : 1 },
        ]}
      >
        <Text style={styles.stepperSymbol}>+</Text>
      </Pressable>
    </View>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  placeholder,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInputRow}>
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text.replace(/[^0-9.]/g, ''))}
          placeholder={placeholder}
          placeholderTextColor={colors.textDim}
          keyboardType="decimal-pad"
          style={styles.input}
          accessibilityLabel={label}
        />
        {suffix ? <Text style={styles.fieldSuffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 14 },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
  },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 12 },
  button: { borderRadius: 11, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 20, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 14 },
  chipLabel: { fontSize: 14, fontWeight: '500' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepperButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cardRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSymbol: { color: colors.text, fontSize: 21, fontWeight: '600', lineHeight: 24 },
  stepperValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    minWidth: 62,
    textAlign: 'center',
  },
  stepperSuffix: { color: colors.textMuted, fontSize: 13, fontWeight: '400' },
  field: { marginBottom: 14 },
  fieldLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 6 },
  fieldInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.cardRaised,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 16,
  },
  fieldSuffix: { color: colors.textMuted, fontSize: 14, width: 26 },
});
