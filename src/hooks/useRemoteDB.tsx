import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type JSX,
} from "react";
import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import type {
  Account,
  DayMealEntry,
  DayWorkoutEntry,
  Recipe,
  WorkoutSection,
} from "../types";

type DB = {
  workouts: DayWorkoutEntry[];
  workoutSections: WorkoutSection[];
  mealsByDay: DayMealEntry[];
  recipes: Recipe[];
  account: Account;
};

const defaultDB: DB = {
  workouts: [],
  workoutSections: [],
  mealsByDay: [],
  recipes: [],
  account: { displayName: "User" },
};

type RemoteDBContextValue = {
  db: DB;
  setDb: (next: DB | ((prev: DB) => DB)) => void;
  refresh: () => Promise<void>;
  loading: boolean;
};

const RemoteDBContext = createContext<RemoteDBContextValue | undefined>(undefined);

function normalizeWorkoutSection(section: Partial<WorkoutSection>): WorkoutSection {
  return {
    id: section.id ?? `section-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: section.name ?? "Untitled Section",
    exercises: (section.exercises ?? []).map((exercise) => ({
      id: exercise.id ?? `exercise-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: exercise.name ?? "Unnamed Exercise",
      sets: (exercise.sets ?? []).map((setItem) => ({
        id: setItem.id ?? `set-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        weight: typeof setItem.weight === "number" ? setItem.weight : 0,
        reps: typeof setItem.reps === "number" ? setItem.reps : 0,
      })),
    })),
  };
}

function normalizeWorkoutEntry(entry: Partial<DayWorkoutEntry>): DayWorkoutEntry {
  return {
    id: entry.id ?? `workout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: entry.date ?? "",
    notes: entry.notes ?? "",
    sections: (entry.sections ?? []).map(normalizeWorkoutSection),
  };
}

function useProvideRemoteDB(): RemoteDBContextValue {
  const { user } = useAuth();
  const firestore = getFirestore();
  const [db, setDbState] = useState<DB>(defaultDB);
  const [loading, setLoading] = useState<boolean>(true);

  const docRef = useMemo(
    () => (user ? doc(firestore, "users", user.uid) : null),
    [firestore, user?.uid]
  );

  useEffect(() => {
    if (!docRef) {
      setDbState(defaultDB);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<DB>;

          setDbState({
            ...defaultDB,
            ...data,
            account: { ...defaultDB.account, ...(data.account ?? {}) },
            workouts: (data.workouts ?? []).map(normalizeWorkoutEntry),
            workoutSections: (data.workoutSections ?? []).map(normalizeWorkoutSection),
            mealsByDay: data.mealsByDay ?? [],
            recipes: data.recipes ?? [],
          });
        } else {
          void setDoc(docRef, { ...defaultDB, createdAt: serverTimestamp() });
          setDbState(defaultDB);
        }

        setLoading(false);
      },
      (err) => {
        console.error("Firestore listener error", err);
        setDbState(defaultDB);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [docRef]);

  const setDb = useCallback(
    (next: DB | ((prev: DB) => DB)) => {
      setDbState((prev) => {
        const resolved = typeof next === "function" ? (next as (p: DB) => DB)(prev) : next;

        if (docRef) {
          void setDoc(
            docRef,
            { ...resolved, updatedAt: serverTimestamp() },
            { merge: true }
          );
        }

        return resolved;
      });
    },
    [docRef]
  );

  const refresh = useCallback(async () => {
    if (!docRef) {
      setDbState(defaultDB);
      return;
    }

    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data() as Partial<DB>;

      setDbState({
        ...defaultDB,
        ...data,
        account: { ...defaultDB.account, ...(data.account ?? {}) },
        workouts: (data.workouts ?? []).map(normalizeWorkoutEntry),
        workoutSections: (data.workoutSections ?? []).map(normalizeWorkoutSection),
        mealsByDay: data.mealsByDay ?? [],
        recipes: data.recipes ?? [],
      });
    }
  }, [docRef]);

  return useMemo(() => ({ db, setDb, refresh, loading }), [db, setDb, refresh, loading]);
}

export function RemoteDBProvider({ children }: { children: ReactNode }): JSX.Element {
  const value = useProvideRemoteDB();
  return <RemoteDBContext.Provider value={value}>{children}</RemoteDBContext.Provider>;
}

export function useRemoteDB(): RemoteDBContextValue {
  const ctx = useContext(RemoteDBContext);
  if (!ctx) throw new Error("useRemoteDB must be used within RemoteDBProvider");
  return ctx;
}