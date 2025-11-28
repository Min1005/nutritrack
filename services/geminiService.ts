import { GoogleGenAI, Type } from "@google/genai";
import { MacroNutrients } from "../types";

// Helper to check if API key exists
export const hasApiKey = (): boolean => {
  return !!process.env.API_KEY;
};

// Interface for detailed breakdown
export interface IngredientItem extends MacroNutrients {
  name: string; // Ingredient name with weight, e.g. "Pork (100g)"
}

export interface FoodAnalysisResult {
  name: string; // Overall dish name
  ingredients: IngredientItem[];
}

export interface WorkoutPlanResult {
  planName: string;
  advice: string;
  exercises: {
    name: string;
    sets: number;
    reps: string; // string to allow "10-12" or "Failure"
    weightSuggestion: string;
    tips: string;
    youtubeQuery: string; // For generating video links
  }[];
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFoodWithGemini = async (
  input: string | { imageBase64: string, text?: string }
): Promise<FoodAnalysisResult | null> => {
  
  let contents: any;
  // Enhanced Prompt for Ingredient Breakdown
  const promptSuffix = `
    1. Identify the food name in Traditional Chinese (繁體中文).
    2. Break down the food into its individual components (ingredients) with estimated weights based on the image/text.
    3. For each component, provide the estimated calories, protein, carbs, and fat.
    4. Ensure the component name includes the estimated weight (e.g., "白飯 200g", "炸雞腿 150g").
    5. Return a JSON object with a 'name' (overall dish name) and an 'ingredients' list.
  `;
  
  if (typeof input === 'string') {
    contents = `Analyze the following food item description. ${promptSuffix} Description: "${input}"`;
  } else {
    const parts = [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: input.imageBase64.split(',')[1],
        },
      },
      {
        text: input.text 
          ? `Analyze this image of food. User description: "${input.text}". ${promptSuffix}`
          : `Analyze this image of food. ${promptSuffix}`
      }
    ];
    contents = { parts };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "Overall Dish Name in Traditional Chinese",
            },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Ingredient name with weight (e.g. 滷蛋 1顆)" },
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fat: { type: Type.NUMBER },
                },
                required: ["name", "calories", "protein", "carbs", "fat"],
              },
            },
          },
          required: ["name", "ingredients"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing food with Gemini:", error);
    return null;
  }
};

export const analyzeSingleIngredient = async (description: string): Promise<MacroNutrients | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Calculate macros for this single food item: "${description}". Return JSON with calories, protein, carbs, fat.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
          },
          required: ["calories", "protein", "carbs", "fat"],
        },
      },
    });
    
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing single ingredient:", error);
    return null;
  }
};

export const generateWorkoutPlan = async (
  target: string,
  userContext: string
): Promise<WorkoutPlanResult | null> => {
  try {
    const prompt = `
      Act as an expert fitness coach. Create a workout plan focusing on: "${target}".
      Context/User Request: "${userContext}".
      
      Response Requirements:
      1. Language: Traditional Chinese (繁體中文).
      2. Provide a specific list of exercises.
      3. For each exercise, provide specific Set/Rep recommendations.
      4. Provide a search query string for finding a tutorial video on YouTube (e.g. "Dumbbell Bench Press tutorial").
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planName: { type: Type.STRING },
            advice: { type: Type.STRING, description: "General advice or focus points" },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  sets: { type: Type.NUMBER },
                  reps: { type: Type.STRING },
                  weightSuggestion: { type: Type.STRING },
                  tips: { type: Type.STRING },
                  youtubeQuery: { type: Type.STRING },
                },
                required: ["name", "sets", "reps", "youtubeQuery"],
              },
            },
          },
          required: ["planName", "exercises"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);

  } catch (error) {
    console.error("Error generating workout plan:", error);
    return null;
  }
};