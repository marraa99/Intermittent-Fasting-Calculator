import { ActivityLevel, AppState, CONSTANTS, Gender, UnitSystem } from '../types';

// Helper to get normalized metric values
export const getMetricValues = (state: AppState) => {
  let weightKg = state.weightKg;
  let heightCm = state.heightCm;
  let waistCm = Number(state.waistSize) || 0;

  if (state.unitSystem === UnitSystem.IMPERIAL) {
    weightKg = state.weightLbs / CONSTANTS.KG_TO_LBS;
    heightCm = (state.heightFt * 12 + state.heightIn) * CONSTANTS.IN_TO_CM;
    waistCm = (Number(state.waistSize) || 0) * CONSTANTS.IN_TO_CM;
  }

  return { weightKg, heightCm, waistCm };
};

export const calculateBMR = (
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
  bodyFat?: number
) => {
  // Mifflin-St Jeor
  const s = gender === Gender.MALE ? 5 : -161;
  const mifflin = 10 * weightKg + 6.25 * heightCm - 5 * age + s;

  // Harris-Benedict (Revised)
  // Male: 88.362 + (13.397 * kg) + (4.799 * cm) - (5.677 * age)
  // Female: 447.593 + (9.247 * kg) + (3.098 * cm) - (4.330 * age)
  // Using the simplified version requested in prompt logic matches closely:
  // Male: 66 + 6.23 x lbs + 12.7 x in - 6.8 x age
  // Converting the prompt's Imperial formula inputs to metric equivalent for consistency:
  const weightLbs = weightKg * CONSTANTS.KG_TO_LBS;
  const heightIn = heightCm / CONSTANTS.IN_TO_CM;
  let harris = 0;
  if (gender === Gender.MALE) {
    harris = 66 + (6.23 * weightLbs) + (12.7 * heightIn) - (6.8 * age);
  } else {
    harris = 655 + (4.35 * weightLbs) + (4.7 * heightIn) - (4.7 * age);
  }

  // Katch-McArdle
  let katch = 0;
  let lbm = 0;
  if (bodyFat) {
    lbm = weightKg * (1 - bodyFat / 100);
    katch = 370 + (21.6 * lbm);
  }

  // Average
  const formulas = [mifflin, harris];
  if (katch > 0) formulas.push(katch);
  const average = formulas.reduce((a, b) => a + b, 0) / formulas.length;

  return { mifflin, harris, katch, average };
};

export const calculateMacroDetails = (
  targetCalories: number,
  proteinGrams: number,
  fatPercentageOfRest: number // The percentage of NON-PROTEIN calories that go to Fat
) => {
  const proteinCals = proteinGrams * CONSTANTS.CALORIES_PER_GRAM_PROTEIN;
  const remainingCals = Math.max(0, targetCalories - proteinCals);

  // Split remaining between Fat and Carbs
  // fatPercentageOfRest is 0-100 (e.g. 50 means 50/50 split of remainder)
  const fatCals = remainingCals * (fatPercentageOfRest / 100);
  const carbCals = remainingCals - fatCals;

  const fatGrams = fatCals / CONSTANTS.CALORIES_PER_GRAM_FAT;
  const carbGrams = carbCals / CONSTANTS.CALORIES_PER_GRAM_CARB;

  return {
    calories: targetCalories,
    protein: { grams: proteinGrams, cals: proteinCals },
    fat: { grams: fatGrams, cals: fatCals },
    carbs: { grams: carbGrams, cals: carbCals },
  };
};

export const formatNumber = (num: number, decimals = 0) => {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};