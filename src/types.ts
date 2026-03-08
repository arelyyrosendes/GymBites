export type ISODate = string; // "YYYY-MM-DD"

export type LoggedSet = {
  id: string;
  weight: number; 
  reps: number;
};

export type WorkoutSubSection = {
  id: string;
  name: string;
  sets: LoggedSet[];
};

export type WorkoutSection = {
  id: string;
  name: string; 
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

export type DayMealEntry = {
  id: string;
  date: ISODate;
  recipeIds: string[];
};

export type Account = {
  displayName: string;
  goal?: string;
};