import { StyleSheet, Text, View } from 'react-native';
import { useTraining } from '../state/TrainingContext.tsx';
import { ProfileForm } from './ProfileForm.tsx';
import { colors } from '../ui/theme.ts';

/**
 * Shown once, on first launch. Every later adjustment happens in Settings —
 * the questionnaire never reappears.
 */
export function OnboardingScreen() {
  const { saveProfile } = useTraining();

  return (
    <ProfileForm
      submitLabel="Build my week"
      header={
        <View style={styles.header}>
          <Text style={styles.title}>Let's set you up</Text>
          <Text style={styles.subtitle}>
            A few quick things, then we'll build your training around your mat schedule. You can
            change any of it later in Settings.
          </Text>
        </View>
      }
      onSubmit={async (profile) => {
        await saveProfile({ ...profile, onboardedAt: new Date().toISOString() });
      }}
    />
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 52, marginBottom: 4 },
  title: { color: colors.text, fontSize: 30, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 15, marginTop: 6, lineHeight: 21 },
});
