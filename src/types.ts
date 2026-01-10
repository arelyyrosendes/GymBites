export type ISODate = string; // "YYYY-MM-DD"

export type LoggedSet = {
  id: string;
  weight: number; // lbs (or kg — your call)
  reps: number;
};

export type WorkoutSubSection = {
  id: string;
  name: string; // e.g. "Kickbacks"
  sets: LoggedSet[];
};

export type WorkoutSection = {
  id: string;
  name: string; // e.g. "Glutes"
  exercises: WorkoutSubSection[];
};

export type DayWorkoutEntry = {
  id: string;
  date: ISODate;
  sections: WorkoutSection[];
  notes?: string;
};

export type Nutrients = {
  calories: number;
  protein: number; // g
  carbs: number;   // g
  fat: number;     // g
};

export type Recipe = {
  id: string;
  name: string;
  nutrients: Nutrients;
  notes?: string;
};

export type DayMealEntry = {
  id: string;
  date: ISODate;
  recipeIds: string[]; // planned/logged recipes for that day
};

export type Account = {
  displayName: string;
  goal?: string;
};
