import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import {
  generateRoutine,
  type BjjSession,
  type LifterProfile,
  type Routine,
} from '@mat-iq/engine';
import * as repo from '../db/repository.ts';
import type { StoredProfile, StoredSession } from '../db/repository.ts';

interface TrainingState {
  loading: boolean;
  profile: StoredProfile | null;
  sessions: StoredSession[];
  /** Regenerated whenever the profile or schedule changes. Null until onboarded. */
  routine: Routine | null;
  saveProfile: (profile: StoredProfile) => Promise<void>;
  addSession: (session: BjjSession) => Promise<void>;
  updateSession: (
    id: number,
    changes: Partial<Pick<BjjSession, 'rounds' | 'intensity'>>,
  ) => Promise<void>;
  deleteSession: (id: number) => Promise<void>;
  setLiftDaysOverride: (days: number | undefined) => Promise<void>;
  reset: () => Promise<void>;
}

const TrainingContext = createContext<TrainingState | null>(null);

export function TrainingProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [sessions, setSessions] = useState<StoredSession[]>([]);

  const refresh = useCallback(async () => {
    const [nextProfile, nextSessions] = await Promise.all([
      repo.getProfile(db),
      repo.listSessions(db),
    ]);
    setProfile(nextProfile);
    setSessions(nextSessions);
  }, [db]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  // The engine runs on-device, so regenerating is cheap and needs no network.
  // Recomputing on every change is what makes the schedule editor feel live.
  const routine = useMemo<Routine | null>(() => {
    if (!profile?.onboardedAt) return null;

    const lifterProfile: LifterProfile = {
      experience: profile.experience,
      goals: profile.goals,
      workingWeightsLb: profile.workingWeightsLb,
      bodyweightLb: profile.bodyweightLb,
      weightClassTargetLb: profile.weightClassTargetLb,
    };

    return generateRoutine(lifterProfile, sessions, {
      liftDaysOverride: profile.liftDaysOverride,
    });
  }, [profile, sessions]);

  const value = useMemo<TrainingState>(
    () => ({
      loading,
      profile,
      sessions,
      routine,
      saveProfile: async (next) => {
        await repo.saveProfile(db, next);
        await refresh();
      },
      addSession: async (session) => {
        await repo.addSession(db, session);
        await refresh();
      },
      updateSession: async (id, changes) => {
        await repo.updateSession(db, id, changes);
        await refresh();
      },
      deleteSession: async (id) => {
        await repo.deleteSession(db, id);
        await refresh();
      },
      setLiftDaysOverride: async (days) => {
        if (!profile) return;
        await repo.saveProfile(db, { ...profile, liftDaysOverride: days });
        await refresh();
      },
      reset: async () => {
        await repo.resetAll(db);
        await refresh();
      },
    }),
    [db, loading, profile, sessions, routine, refresh],
  );

  return <TrainingContext.Provider value={value}>{children}</TrainingContext.Provider>;
}

export function useTraining(): TrainingState {
  const context = useContext(TrainingContext);
  if (!context) throw new Error('useTraining must be used inside a TrainingProvider');
  return context;
}
