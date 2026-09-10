import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import type { LiftSession, Weekday } from '@mat-iq/engine';
import * as logs from '../db/logs.ts';
import type { LoggedSet, WorkoutLog } from '../db/logs.ts';

interface WorkoutState {
  active: WorkoutLog | null;
  sets: LoggedSet[];
  /** Starts a workout, or returns the one already in progress. */
  start: (session: LiftSession, day: Weekday) => Promise<number>;
  logSet: (input: Omit<LoggedSet, 'id' | 'loggedAt' | 'workoutLogId'>) => Promise<void>;
  undoSet: (id: number) => Promise<void>;
  complete: (notes?: string) => Promise<void>;
  discard: () => Promise<void>;
}

const WorkoutContext = createContext<WorkoutState | null>(null);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [active, setActive] = useState<WorkoutLog | null>(null);
  const [sets, setSets] = useState<LoggedSet[]>([]);

  const refresh = useCallback(async () => {
    const workout = await logs.activeWorkout(db);
    setActive(workout);
    setSets(workout ? await logs.listSets(db, workout.id) : []);
  }, [db]);

  // An interrupted workout survives the app being closed mid-session — which
  // happens constantly when the phone locks between sets.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<WorkoutState>(
    () => ({
      active,
      sets,
      start: async (session, day) => {
        const existing = await logs.activeWorkout(db);
        if (existing) {
          await refresh();
          return existing.id;
        }
        const id = await logs.startWorkout(db, {
          date: logs.localDateKey(),
          day,
          label: session.label,
        });
        await refresh();
        return id;
      },
      logSet: async (input) => {
        const workout = active ?? (await logs.activeWorkout(db));
        if (!workout) return;
        await logs.logSet(db, { ...input, workoutLogId: workout.id });
        await refresh();
      },
      undoSet: async (id) => {
        await logs.deleteSet(db, id);
        await refresh();
      },
      complete: async (notes) => {
        if (!active) return;
        await logs.completeWorkout(db, active.id, notes);
        await refresh();
      },
      discard: async () => {
        if (!active) return;
        await logs.discardWorkout(db, active.id);
        await refresh();
      },
    }),
    [db, active, sets, refresh],
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout(): WorkoutState {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used inside a WorkoutProvider');
  return context;
}
