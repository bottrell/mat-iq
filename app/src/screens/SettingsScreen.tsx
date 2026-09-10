import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTraining } from '../state/TrainingContext.tsx';
import { colors } from '../ui/theme.ts';

function Row({
  label,
  detail,
  onPress,
  destructive,
}: {
  label: string;
  detail?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, destructive && { color: colors.danger }]}>{label}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      {!destructive ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
}

export function SettingsScreen({
  onOpenProfile,
  onOpenSchedule,
}: {
  onOpenProfile: () => void;
  onOpenSchedule: () => void;
}) {
  const { profile, sessions, reset } = useTraining();

  const confirmReset = () => {
    Alert.alert(
      'Start over?',
      'This erases your profile and mat schedule. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Erase everything', style: 'destructive', onPress: () => void reset() },
      ],
    );
  };

  const goalSummary = profile?.goals
    .map((g) => (g === 'strength' ? 'Strength' : 'Gas tank'))
    .join(' · ');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.groupTitle}>TRAINING</Text>
      <View style={styles.group}>
        <Row
          label="Mat schedule"
          detail={`${sessions.length} session${sessions.length === 1 ? '' : 's'} a week`}
          onPress={onOpenSchedule}
        />
        <Row
          label="Profile and goals"
          detail={[profile?.experience, goalSummary, profile?.units].filter(Boolean).join(' · ')}
          onPress={onOpenProfile}
        />
      </View>

      <Text style={styles.groupTitle}>DATA</Text>
      <View style={styles.group}>
        <Row label="Reset all data" onPress={confirmReset} destructive />
      </View>

      <Text style={styles.footnote}>
        Everything is stored on this device. Nothing syncs anywhere yet.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 48 },
  groupTitle: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 8,
    marginTop: 14,
  },
  group: { backgroundColor: colors.card, borderRadius: 14, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1 },
  rowLabel: { color: colors.text, fontSize: 16 },
  rowDetail: { color: colors.textMuted, fontSize: 13, marginTop: 3, textTransform: 'capitalize' },
  chevron: { color: colors.textDim, fontSize: 22, marginLeft: 10 },
  footnote: { color: colors.textDim, fontSize: 12, lineHeight: 18, marginTop: 24 },
});
