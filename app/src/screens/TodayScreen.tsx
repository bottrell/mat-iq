import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  nextTrainingDay,
  planForDate,
  plannedRounds,
  WEEKDAY_NAMES,
  type DayPlan,
} from '@mat-iq/engine';
import { useTraining } from '../state/TrainingContext.tsx';
import { useWorkout } from '../state/WorkoutContext.tsx';
import { SESSION_TYPE_LABEL } from '../db/logs.ts';
import { colors, intensityColor } from '../ui/theme.ts';
import { formatWeight, fromLb } from '../ui/units.ts';

const LONG_DATE: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };

const INTENSITY_LABEL = { light: 'Light', medium: 'Medium', hard: 'Hard' } as const;

function ActionCard({
  eyebrow,
  title,
  children,
  onPress,
  accent,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  onPress?: () => void;
  accent: string;
}) {
  const body = (
    <View style={[styles.actionCard, { borderColor: accent }]}>
      <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
      {children}
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      {body}
    </Pressable>
  );
}

export function TodayScreen({
  onOpenLift,
  onTrackSession,
  onOpenWeek,
  onOpenSchedule,
}: {
  onOpenLift: (plan: DayPlan) => void;
  onTrackSession: (plan: DayPlan) => void;
  onOpenWeek: () => void;
  onOpenSchedule: () => void;
}) {
  const { routine, sessions, profile } = useTraining();
  const { completedToday, matLogsToday } = useWorkout();
  if (!profile) return null;

  const today = new Date();
  const plan = planForDate(routine, sessions, today);
  const next = nextTrainingDay(routine, sessions, plan.day);
  const units = profile.units;
  const liftDone = completedToday[0];
  const loggedRounds = matLogsToday.reduce((total, log) => total + log.rounds, 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.date}>{today.toLocaleDateString(undefined, LONG_DATE)}</Text>

      {(plan.kind === 'lift' || plan.kind === 'both') && plan.lift && liftDone ? (
        <ActionCard eyebrow="LIFT COMPLETE" title={liftDone.label} accent={colors.done}>
          <Text style={styles.doneLine}>
            ✓ {liftDone.setCount} {liftDone.setCount === 1 ? 'set' : 'sets'}
            {liftDone.volumeLb > 0
              ? ` · ${Math.round(fromLb(liftDone.volumeLb, units)).toLocaleString()} ${units} moved`
              : ''}
          </Text>
          <Text style={styles.doneMeta}>Nice work. That one's in the books.</Text>
        </ActionCard>
      ) : null}

      {(plan.kind === 'lift' || plan.kind === 'both') && plan.lift && !liftDone ? (
        <ActionCard
          eyebrow="TODAY'S LIFT"
          title={plan.lift.label}
          accent={colors.accent}
          onPress={() => onOpenLift(plan)}
        >
          <Text style={styles.meta}>
            {plan.lift.exercises.length} exercises · ~{plan.lift.estimatedMinutes} min
          </Text>
          <View style={styles.preview}>
            {plan.lift.exercises.slice(0, 3).map((prescribed) => (
              <Text key={prescribed.exercise.id} style={styles.previewLine}>
                {prescribed.exercise.name}
                <Text style={styles.previewDim}>
                  {'  '}
                  {prescribed.sets}×{prescribed.repRange[0]}–{prescribed.repRange[1]}
                  {prescribed.targetWeightLb
                    ? ` · ${formatWeight(prescribed.targetWeightLb, units)}`
                    : ''}
                </Text>
              </Text>
            ))}
            {plan.lift.exercises.length > 3 ? (
              <Text style={styles.previewDim}>
                + {plan.lift.exercises.length - 3} more
              </Text>
            ) : null}
          </View>
        </ActionCard>
      ) : null}

      {(plan.kind === 'mat' || plan.kind === 'both') && plan.matSessions.length > 0 ? (
        matLogsToday.length > 0 ? (
          <ActionCard eyebrow="MAT SESSION LOGGED" title={`${loggedRounds} rounds trained`} accent={colors.done}>
            {matLogsToday.map((log) => (
              <Text key={log.id} style={styles.doneLine}>
                ✓ {SESSION_TYPE_LABEL[log.sessionType]} · {INTENSITY_LABEL[log.intensity]}
              </Text>
            ))}
            {matLogsToday.find((l) => l.notes) ? (
              <Text style={styles.notesLine}>{matLogsToday.find((l) => l.notes)!.notes}</Text>
            ) : null}
          </ActionCard>
        ) : (
          <ActionCard
            eyebrow="TODAY ON THE MATS"
            title={`${plannedRounds(plan)} rounds planned`}
            accent={intensityColor[plan.matSessions[0]!.intensity]}
          >
            {plan.matSessions.map((session, index) => (
              <Text key={index} style={styles.meta}>
                {session.rounds} rounds · {INTENSITY_LABEL[session.intensity]}
              </Text>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => onTrackSession(plan)}
              style={({ pressed }) => [styles.trackButton, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.trackButtonText}>Track session</Text>
            </Pressable>
          </ActionCard>
        )
      ) : null}

      {plan.kind === 'rest' ? (
        <ActionCard eyebrow="TODAY" title="Rest day" accent={colors.textDim}>
          <Text style={styles.meta}>
            {next
              ? `Next up: ${WEEKDAY_NAMES[next.day]}${next.daysAway === 1 ? ' (tomorrow)' : ''}`
              : 'Nothing scheduled this week yet.'}
          </Text>
        </ActionCard>
      ) : null}

      {plan.kind === 'both' ? (
        <Text style={styles.doubleUpNote}>
          You're doubling up today. Lift after training, not before.
        </Text>
      ) : null}

      <View style={styles.links}>
        <Pressable accessibilityRole="button" onPress={onOpenWeek} style={styles.link}>
          <Text style={styles.linkText}>See the full week</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onOpenSchedule} style={styles.link}>
          <Text style={styles.linkText}>Edit mat schedule</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 48 },
  date: { color: colors.textMuted, fontSize: 15, marginBottom: 18 },
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderLeftWidth: 3,
    padding: 18,
    marginBottom: 14,
  },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1, marginBottom: 6 },
  actionTitle: { color: colors.text, fontSize: 23, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  preview: { marginTop: 14, gap: 6 },
  previewLine: { color: '#e4e7ee', fontSize: 14 },
  previewDim: { color: colors.textDim, fontSize: 13 },
  doneLine: { color: colors.done, fontSize: 16, fontWeight: '600', marginTop: 6 },
  doneMeta: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  notesLine: { color: colors.textMuted, fontSize: 13, marginTop: 8, fontStyle: 'italic' },
  trackButton: {
    backgroundColor: colors.accentMuted,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  trackButtonText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  doubleUpNote: { color: colors.warn, fontSize: 13, lineHeight: 19, marginBottom: 8 },
  links: { marginTop: 10, gap: 4 },
  link: { paddingVertical: 10 },
  linkText: { color: colors.accent, fontSize: 15, fontWeight: '500' },
});
