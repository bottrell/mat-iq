import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  generateRoutine,
  weeklyFatigue,
  WEEKDAY_NAMES,
  type BjjSession,
  type LifterProfile,
} from '@mat-iq/engine';

// Hard-coded for now: onboarding and the mock API come next.
const PROFILE: LifterProfile = {
  experience: 'intermediate',
  goals: ['strength', 'conditioning'],
  workingWeightsLb: { squat: 225, hinge: 275, press: 155, row: 135 },
  bodyweightLb: 180,
};

const MAT_WEEK: BjjSession[] = [
  { day: 0, rounds: 6, intensity: 'hard' },
  { day: 2, rounds: 5, intensity: 'medium' },
  { day: 4, rounds: 8, intensity: 'hard' },
  { day: 5, rounds: 10, intensity: 'medium' },
];

const UNIT_SUFFIX = { reps: '', seconds: 's', yards: 'yd' } as const;

export default function App() {
  const routine = generateRoutine(PROFILE, MAT_WEEK);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your Week</Text>
        <Text style={styles.subtitle}>
          Mat load {weeklyFatigue(MAT_WEEK).toFixed(1)} · {routine.sessions.length} lifting{' '}
          {routine.sessions.length === 1 ? 'day' : 'days'}
        </Text>

        {routine.sessions.map((session) => (
          <View key={session.day} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.day}>{WEEKDAY_NAMES[session.day]}</Text>
              <Text style={styles.duration}>~{session.estimatedMinutes} min</Text>
            </View>
            <Text style={styles.label}>{session.label}</Text>

            {session.exercises.map((prescribed) => (
              <View key={prescribed.exercise.id} style={styles.exercise}>
                <Text style={styles.exerciseName}>{prescribed.exercise.name}</Text>
                <Text style={styles.prescription}>
                  {prescribed.sets}×{prescribed.repRange[0]}–{prescribed.repRange[1]}
                  {UNIT_SUFFIX[prescribed.exercise.prescribedIn]}
                  {prescribed.targetWeightLb ? `  ·  ${prescribed.targetWeightLb} lb` : ''}
                </Text>
                {prescribed.notes ? <Text style={styles.note}>{prescribed.notes}</Text> : null}
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Why this program</Text>
        {routine.rationale.map((line) => (
          <Text key={line} style={styles.rationale}>
            • {line}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#12141a' },
  content: { padding: 20, paddingTop: 72, paddingBottom: 48 },
  title: { color: '#f5f6f8', fontSize: 32, fontWeight: '700' },
  subtitle: { color: '#8b93a7', fontSize: 15, marginTop: 4, marginBottom: 24 },
  card: {
    backgroundColor: '#1b1e26',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  day: { color: '#f5f6f8', fontSize: 19, fontWeight: '600' },
  duration: { color: '#8b93a7', fontSize: 13 },
  label: { color: '#5b8def', fontSize: 13, fontWeight: '600', marginTop: 2, marginBottom: 12 },
  exercise: { marginBottom: 10 },
  exerciseName: { color: '#e4e7ee', fontSize: 15, fontWeight: '500' },
  prescription: { color: '#8b93a7', fontSize: 14, marginTop: 2 },
  note: { color: '#c8a24a', fontSize: 12, marginTop: 3, fontStyle: 'italic' },
  sectionTitle: { color: '#f5f6f8', fontSize: 17, fontWeight: '600', marginTop: 14, marginBottom: 8 },
  rationale: { color: '#8b93a7', fontSize: 13, lineHeight: 20, marginBottom: 4 },
});
