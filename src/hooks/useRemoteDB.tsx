import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { doc, getDoc, getFirestore, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import type { Account, DayMealEntry, DayWorkoutEntry, Recipe } from "../types";

type DB = {
  workouts: DayWorkoutEntry[];
  mealsByDay: DayMealEntry[];
  recipes: Recipe[];
  account: Account;
};

const defaultDB: DB = {
  workouts: [],
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

function useProvideRemoteDB(): RemoteDBContextValue {
  const { user } = useAuth();
  const firestore = getFirestore();
  const [db, setDbState] = useState<DB>(defaultDB);
  const [loading, setLoading] = useState<boolean>(true);

  // Stable doc ref so the effect doesn't resubscribe every render.
  const docRef = useMemo(() => (user ? doc(firestore, "users", user.uid) : null), [firestore, user?.uid]);

  // Subscribe once per user to Firestore changes
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
            workouts: data.workouts ?? [],
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

  // setDb helper mirroring useState setter, and persisting to Firestore
  const setDb = useCallback(
    (next: DB | ((prev: DB) => DB)) => {
      setDbState((prev) => {
        const resolved = typeof next === "function" ? (next as (p: DB) => DB)(prev) : next;
        if (docRef) {
          void setDoc(docRef, { ...resolved, updatedAt: serverTimestamp() }, { merge: true });
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
        workouts: data.workouts ?? [],
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
