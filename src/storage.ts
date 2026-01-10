import type { Account, DayMealEntry, DayWorkoutEntry, Recipe } from "./types";

type DB = {
  workouts: DayWorkoutEntry[];
  mealsByDay: DayMealEntry[];
  recipes: Recipe[];
  account: Account;
};

const KEY = "gymbites_db_v1";

const defaultDB: DB = {
  workouts: [],
  mealsByDay: [],
  recipes: [],
  account: { displayName: "Arely" },
};

export function loadDB(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultDB;
    const parsed = JSON.parse(raw) as DB;
    return {
      ...defaultDB,
      ...parsed,
      account: { ...defaultDB.account, ...(parsed.account ?? {}) },
      workouts: parsed.workouts ?? [],
      mealsByDay: parsed.mealsByDay ?? [],
      recipes: parsed.recipes ?? [],
    };
  } catch {
    return defaultDB;
  }
}

export function saveDB(db: DB): void {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export function updateDB(updater: (db: DB) => DB): DB {
  const db = loadDB();
  const next = updater(db);
  saveDB(next);
  return next;
}
