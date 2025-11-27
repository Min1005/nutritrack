import { describe, it, expect } from 'vitest';
import { calculateBMR, calculateTDEE, calculateTargetCalories } from './calculations';
import { Gender, ActivityLevel, Goal } from '../types';

describe('Health Calculations', () => {
  
  describe('calculateBMR (Mifflin-St Jeor)', () => {
    it('should calculate correctly for a Male', () => {
      // Example: Male, 180cm, 80kg, 25 years old
      // Formula: (10*80) + (6.25*180) - (5*25) + 5
      // 800 + 1125 - 125 + 5 = 1805
      const result = calculateBMR(80, 180, 25, Gender.Male);
      expect(result).toBe(1805);
    });

    it('should calculate correctly for a Female', () => {
      // Example: Female, 160cm, 55kg, 30 years old
      // Formula: (10*55) + (6.25*160) - (5*30) - 161
      // 550 + 1000 - 150 - 161 = 1239
      const result = calculateBMR(55, 160, 30, Gender.Female);
      expect(result).toBe(1239);
    });
  });

  describe('calculateTDEE', () => {
    it('should calculate Sedentary correctly (x1.2)', () => {
      const bmr = 1500;
      const result = calculateTDEE(bmr, ActivityLevel.Sedentary);
      expect(result).toBe(1800); // 1500 * 1.2
    });

    it('should calculate Active correctly (x1.725)', () => {
      const bmr = 2000;
      const result = calculateTDEE(bmr, ActivityLevel.Active);
      expect(result).toBe(3450); // 2000 * 1.725
    });
  });

  describe('calculateTargetCalories', () => {
    const tdee = 2000;

    it('should subtract calories for Cutting (Weight Loss)', () => {
      const result = calculateTargetCalories(tdee, Goal.Cut);
      expect(result).toBe(1600); // 2000 - 400
    });

    it('should add calories for Bulking (Muscle Gain)', () => {
      const result = calculateTargetCalories(tdee, Goal.Bulk);
      expect(result).toBe(2300); // 2000 + 300
    });

    it('should match TDEE for Maintenance', () => {
      const result = calculateTargetCalories(tdee, Goal.Maintain);
      expect(result).toBe(2000);
    });
  });
});
