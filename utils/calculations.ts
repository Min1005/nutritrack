
import { ActivityLevel, Gender, Goal } from '../types';

// Mifflin-St Jeor Equation
export const calculateBMR = (weight: number, height: number, age: number, gender: Gender): number => {
  // Weight in kg, Height in cm
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  
  if (gender === Gender.Male) {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  
  return Math.round(bmr);
};

export const calculateTDEE = (bmr: number, activityLevel: ActivityLevel): number => {
  const multipliers: Record<ActivityLevel, number> = {
    [ActivityLevel.Sedentary]: 1.2,
    [ActivityLevel.Light]: 1.375,
    [ActivityLevel.Moderate]: 1.55,
    [ActivityLevel.Active]: 1.725,
    [ActivityLevel.VeryActive]: 1.9,
  };

  return Math.round(bmr * multipliers[activityLevel]);
};

export const calculateTargetCalories = (tdee: number, goal: Goal): number => {
  switch (goal) {
    case Goal.Cut:
      return Math.round(tdee - 400); // Deficit
    case Goal.Bulk:
      return Math.round(tdee + 300); // Surplus
    case Goal.Maintain:
    default:
      return tdee;
  }
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const formatDateReadable = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};
