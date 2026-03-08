export type ISODate = string; // "YYYY-MM-DD"

export type GeneralExercise = {
  id: string;
  name: string;
};

export type GeneralWorkout = {
  id: string;
  name: string; // e.g. "Glutes"
  exercises: GeneralExercise[];
};

export type LoggedSet = {
  id: string;
  weight: number;
  reps: number;
};

export type DailyExercise = {
  id: string;
  name: string;
  sets: LoggedSet[];
};

export type DailyWorkoutSection = {
  id: string;
  templateId?: string;
  name: string;
  exercises: DailyExercise[];
};

export type DayWorkoutEntry = {
  id: string;
  date: ISODate;
  sections: DailyWorkoutSection[];
  notes?: string;
};

export type Nutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type Recipe = {
  id: string;
  name: string;
  nutrients: Nutrients;
  notes?: string;
};

export type MealLabel = "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Other";

export type PlannedMeal = {
  id: string;
  recipeId: string;
  label?: MealLabel;
};

export type DayMealEntry = {
  id: string;
  date: ISODate;
  items: PlannedMeal[];
};

export type Account = {
  displayName: string;
  goal?: string;
};
