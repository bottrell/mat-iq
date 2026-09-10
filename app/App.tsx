import { Suspense } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { DayPlan } from '@mat-iq/engine';
import { migrate } from './src/db/schema.ts';
import { TrainingProvider, useTraining } from './src/state/TrainingContext.tsx';
import { OnboardingScreen } from './src/screens/OnboardingScreen.tsx';
import { TodayScreen } from './src/screens/TodayScreen.tsx';
import { WeekScreen } from './src/screens/WeekScreen.tsx';
import { ScheduleScreen } from './src/screens/ScheduleScreen.tsx';
import { SettingsScreen } from './src/screens/SettingsScreen.tsx';
import { ProfileScreen } from './src/screens/ProfileScreen.tsx';
import { LiftDetailScreen } from './src/screens/LiftDetailScreen.tsx';
import { colors } from './src/ui/theme.ts';

export type RootStackParamList = {
  Today: undefined;
  Lift: { plan: DayPlan };
  Week: undefined;
  Settings: undefined;
  Schedule: undefined;
  Profile: undefined;
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
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10}>
      <Text style={styles.headerButton}>{label}</Text>
    </Pressable>
  );
}

/** Onboarding is a gate, not a route — it runs once and never returns. */
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
          headerBackTitle: 'Back',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen
          name="Today"
          options={({ navigation }) => ({
            title: 'Today',
            headerRight: () => (
              <HeaderButton label="Settings" onPress={() => navigation.navigate('Settings')} />
            ),
          })}
        >
          {({ navigation }) => (
            <TodayScreen
              onOpenLift={(plan) => navigation.navigate('Lift', { plan })}
              onOpenWeek={() => navigation.navigate('Week')}
              onOpenSchedule={() => navigation.navigate('Schedule')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Lift" options={{ title: "Today's Lift" }}>
          {({ route }) => <LiftDetailScreen plan={route.params.plan} />}
        </Stack.Screen>

        <Stack.Screen name="Week" options={{ title: 'Your Week' }}>
          {({ navigation }) => <WeekScreen onEditSchedule={() => navigation.navigate('Schedule')} />}
        </Stack.Screen>

        <Stack.Screen name="Settings" options={{ title: 'Settings' }}>
          {({ navigation }) => (
            <SettingsScreen
              onOpenProfile={() => navigation.navigate('Profile')}
              onOpenSchedule={() => navigation.navigate('Schedule')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'Mat Schedule' }} />

        <Stack.Screen name="Profile" options={{ title: 'Profile and Goals' }}>
          {({ navigation }) => <ProfileScreen onSaved={() => navigation.goBack()} />}
        </Stack.Screen>
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
