
import { MacroNutrients } from '../types';

export const commonFoodDatabase: Record<string, MacroNutrients> = {
  // Staples
  "白飯 (1碗/150g)": { calories: 280, protein: 5.5, carbs: 63, fat: 0.5 },
  "糙米飯 (1碗/150g)": { calories: 248, protein: 5, carbs: 55, fat: 1.5 },
  "五穀飯 (1碗/150g)": { calories: 250, protein: 6, carbs: 50, fat: 2 },
  "地瓜 (150g)": { calories: 190, protein: 3, carbs: 45, fat: 0.2 },
  "馬鈴薯 (150g)": { calories: 115, protein: 3, carbs: 26, fat: 0.1 },
  "吐司 (1片)": { calories: 75, protein: 2.5, carbs: 14, fat: 1 },
  "貝果 (1個)": { calories: 250, protein: 10, carbs: 50, fat: 1.5 },
  "燕麥片 (50g)": { calories: 190, protein: 6, carbs: 34, fat: 3 },
  "陽春麵 (1碗)": { calories: 350, protein: 10, carbs: 70, fat: 4 },

  // Proteins
  "雞胸肉 (100g)": { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  "雞腿肉 (去皮/100g)": { calories: 170, protein: 25, carbs: 0, fat: 8 },
  "雞蛋 (水煮/1顆)": { calories: 75, protein: 7, carbs: 0.5, fat: 5 },
  "雞蛋 (煎蛋/1顆)": { calories: 100, protein: 7, carbs: 0.5, fat: 8 },
  "牛排 (100g)": { calories: 250, protein: 26, carbs: 0, fat: 17 },
  "鮭魚 (100g)": { calories: 208, protein: 20, carbs: 0, fat: 13 },
  "鯛魚 (100g)": { calories: 100, protein: 20, carbs: 0, fat: 1.5 },
  "鮪魚罐頭 (水煮/半罐)": { calories: 60, protein: 14, carbs: 0, fat: 0.5 },
  "板豆腐 (100g)": { calories: 85, protein: 8, carbs: 2, fat: 5 },
  "嫩豆腐 (100g)": { calories: 50, protein: 5, carbs: 2, fat: 3 },
  "無糖豆漿 (240ml)": { calories: 80, protein: 8, carbs: 4, fat: 4 },
  "全脂牛奶 (240ml)": { calories: 150, protein: 8, carbs: 12, fat: 8 },
  "乳清蛋白 (1份)": { calories: 120, protein: 24, carbs: 3, fat: 1.5 },

  // Fruits & Veg
  "香蕉 (1根)": { calories: 105, protein: 1.3, carbs: 27, fat: 0.3 },
  "蘋果 (1顆)": { calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  "芭樂 (1顆)": { calories: 120, protein: 2.5, carbs: 30, fat: 0.5 },
  "奇異果 (1顆)": { calories: 45, protein: 1, carbs: 10, fat: 0.4 },
  "燙青菜 (1份/含醬)": { calories: 50, protein: 2, carbs: 8, fat: 2 },
  "生菜沙拉 (不含醬)": { calories: 30, protein: 2, carbs: 5, fat: 0 },

  // Snacks/Others
  "希臘優格 (100g)": { calories: 60, protein: 10, carbs: 4, fat: 0 },
  "無調味堅果 (30g)": { calories: 170, protein: 5, carbs: 6, fat: 15 },
  "拿鐵 (中杯)": { calories: 120, protein: 6, carbs: 10, fat: 6 },
  "美式咖啡 (中杯)": { calories: 10, protein: 0, carbs: 2, fat: 0 },
};
