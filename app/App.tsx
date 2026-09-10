import { Suspense } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { migrate } from './src/db/schema.ts';
import { TrainingProvider, useTraining } from './src/state/TrainingContext.tsx';
import { OnboardingScreen } from './src/screens/OnboardingScreen.tsx';
import { ScheduleScreen } from './src/screens/ScheduleScreen.tsx';
import { WeekScreen } from './src/screens/WeekScreen.tsx';
import { colors } from './src/ui/theme.ts';

type RootStackParamList = {
  Week: undefined;
  Schedule: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

function HeaderButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
      <Text style={styles.headerButton}>{label}</Text>
    </Pressable>
  );
}

/** Onboarding is a gate, not a route — there is nothing to show without a profile. */
function Root() {
  const { loading, profile } = useTraining();

  if (loading) return <Loading />;
  if (!profile?.onboardedAt) return <OnboardingScreen />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { color: colors.text },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen
          name="Week"
          options={({ navigation }) => ({
            title: 'Your Week',
            headerRight: () => (
              <HeaderButton label="Schedule" onPress={() => navigation.navigate('Schedule')} />
            ),
          })}
        >
          {({ navigation }) => <WeekScreen onEditSchedule={() => navigation.navigate('Schedule')} />}
        </Stack.Screen>

        <Stack.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'Mat Schedule' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      <Suspense fallback={<Loading />}>
        <SQLiteProvider databaseName="mat-iq.db" onInit={migrate} useSuspense>
          <TrainingProvider>
            <Root />
          </TrainingProvider>
        </SQLiteProvider>
      </Suspense>
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  headerButton: { color: colors.accent, fontSize: 16, fontWeight: '500' },
});
