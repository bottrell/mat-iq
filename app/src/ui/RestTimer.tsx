import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme.ts';
import { restReadout } from './rest.ts';

const PRESETS = [60, 90, 120, 180] as const;

/**
 * Counts down from a target set when the last set was logged.
 *
 * Deliberately driven by wall-clock deltas rather than by counting ticks: iOS
 * suspends timers when the screen locks, and a tick-counting timer would be
 * minutes slow by the time you look at your phone again.
 */
export function RestTimer({
  startedAt,
  defaultSeconds = 90,
  onDismiss,
}: {
  /** Epoch ms the rest period began. Null hides the timer. */
  startedAt: number | null;
  defaultSeconds?: number;
  onDismiss: () => void;
}) {
  const [target, setTarget] = useState<number>(defaultSeconds);
  const [now, setNow] = useState(() => Date.now());
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startedAt === null) return;

    const tick = () => setNow(Date.now());
    tick();
    interval.current = setInterval(tick, 500);

    // Recompute the moment we come back from the background, so the number is
    // right before the next repaint rather than after the next tick.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });

    return () => {
      if (interval.current) clearInterval(interval.current);
      subscription.remove();
    };
  }, [startedAt]);

  if (startedAt === null) return null;

  const { text, done } = restReadout(startedAt, target, now);

  return (
    <View style={[styles.bar, done && styles.barDone]}>
      <View style={styles.readout}>
        <Text style={[styles.time, done && styles.timeDone]}>{text}</Text>
        <Text style={styles.label}>{done ? 'rest is up' : 'rest'}</Text>
      </View>

      <View style={styles.presets}>
        {PRESETS.map((seconds) => (
          <Pressable
            key={seconds}
            accessibilityRole="button"
            accessibilityLabel={`Rest ${seconds} seconds`}
            accessibilityState={{ selected: target === seconds }}
            onPress={() => setTarget(seconds)}
            style={({ pressed }) => [
              styles.preset,
              target === seconds && styles.presetActive,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.presetText, target === seconds && styles.presetTextActive]}>
              {seconds < 120 ? `${seconds}s` : `${seconds / 60}m`}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss rest timer" onPress={onDismiss} hitSlop={10}>
        <Text style={styles.dismiss}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.cardRaised,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 26,
  },
  barDone: { backgroundColor: '#243a2e' },
  readout: { minWidth: 68 },
  time: { color: colors.text, fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] },
  timeDone: { color: '#5fbf8f' },
  label: { color: colors.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  presets: { flexDirection: 'row', gap: 6, flex: 1 },
  preset: {
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: colors.card,
  },
  presetActive: { backgroundColor: colors.accent },
  presetText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  presetTextActive: { color: '#fff' },
  dismiss: { color: colors.textMuted, fontSize: 17, paddingHorizontal: 4 },
});
