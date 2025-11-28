
export enum ActivityLevel {
  Sedentary = 'sedentary',
  Light = 'light',
  Moderate = 'moderate',
  Active = 'active',
  VeryActive = 'very_active',
}

export enum Gender {
  Male = 'male',
  Female = 'female',
}

export enum Goal {
  Cut = 'cut',         // Weight Loss
  Maintain = 'maintain', // Maintenance
  Bulk = 'bulk',       // Muscle Gain
}

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string; // Base64 string for profile photo
  height: number; // cm
  weight: number; // kg
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: Goal;
  tdee: number; // Maintenance Calories
  targetCalories: number; // Goal adjusted calories
}

export interface MacroNutrients {
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
}

export interface IngredientItem extends MacroNutrients {
  name: string; // Ingredient name with weight
}

export interface FoodLogItem extends MacroNutrients {
  id: string;
  name: string;
  timestamp: number;
  date: string; // YYYY-MM-DD
  image?: string; // Base64 string
  ingredients?: IngredientItem[]; // Detailed breakdown
}

export interface SavedFoodItem extends MacroNutrients {
  id: string;
  name: string;
  timesUsed: number;
}

export interface WorkoutLogItem {
  id: string;
  exercise: string; // 動作
  sets: number;     // 組數
  reps: number;     // 次數
  weight: number;   // 重量 (kg)
  date: string;     // YYYY-MM-DD
  tags: string[]; 
  timestamp: number;
}

export interface BodyCheckItem {
  id: string;
  date: string; // YYYY-MM-DD
  image: string; // Base64
  note?: string;
  timestamp: number;
}

export interface DataBackup {
  version: number;
  users: UserProfile[];
  logs: Record<string, FoodLogItem[]>;
  workouts: Record<string, WorkoutLogItem[]>;
  bodyChecks: Record<string, BodyCheckItem[]>;
  savedFoods: Record<string, SavedFoodItem[]>;
}
