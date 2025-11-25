
export enum UnitSystem {
  IMPERIAL = 'Imperial',
  METRIC = 'Metric',
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

export enum ActivityLevel {
  SEDENTARY = 1.2,
  LIGHTLY_ACTIVE = 1.375,
  MODERATELY_ACTIVE = 1.55,
  VERY_ACTIVE = 1.725,
  EXTREMELY_ACTIVE = 1.9,
}

export interface AppState {
  // Basic Info
  unitSystem: UnitSystem;
  gender: Gender;
  age: number;
  heightFt: number;
  heightIn: number;
  heightCm: number;
  weightLbs: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  bodyFatPercentage: number | ''; // Optional
  waistSize: number | ''; // Optional

  // Macro Config
  daysPerCycle: number;
  workoutsPerWeek: number;
  
  // Splits
  restCaloriesSplit: number; // e.g. -20 for -20%
  workoutCaloriesSplit: number; // e.g. +20 for +20%
  
  // Macros (stored as percentages ideally, but we allow simple config)
  restProteinGrams: number;
  workoutProteinGrams: number;
  
  restFatSplitPercent: number; // vs Carbs. Remaining is split between Fat/Carb
  workoutFatSplitPercent: number; 
}

// --- Tracker Interfaces ---

export interface TrackerTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  netCarbs: number; // For keto mode
}

export interface TrackerProfile {
  apiKey: string;
  model: string;
  targets: TrackerTarget;
  isKetoMode: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  grams: number; // Amount eaten
  // Per 100g reference values
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  foods: FoodItem[];
}

export const CONSTANTS = {
  CALORIES_PER_GRAM_PROTEIN: 4,
  CALORIES_PER_GRAM_CARB: 4,
  CALORIES_PER_GRAM_FAT: 9,
  KG_TO_LBS: 2.20462,
  IN_TO_CM: 2.54,
  CALORIES_PER_KG_FAT: 7700,
  CALORIES_PER_LB_FAT: 3500,
};

export const DEFAULT_TRACKER_PROFILE: TrackerProfile = {
  apiKey: '',
  model: 'gemini-2.5-flash',
  isKetoMode: false,
  targets: {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
    fiber: 30,
    netCarbs: 50,
  }
};
