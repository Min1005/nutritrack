import { GoogleGenAI, Type } from "@google/genai";
import { MacroNutrients } from "../types";

// Helper to check if API key exists
export const hasApiKey = (): boolean => {
  return !!process.env.API_KEY;
};

export const analyzeFoodWithGemini = async (
  input: string | { imageBase64: string, text?: string }
): Promise<MacroNutrients & { name: string; portionEstimate?: string } | null> => {
  // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let contents: any;
  // Enhanced Prompt for Visual Estimation
  const promptSuffix = `
    1. Identify the food name in Traditional Chinese (繁體中文).
    2. Visually estimate the portion size and weight (grams) of the food based on the image (e.g., relative to plate size).
    3. Calculate total calories/macros based on this specific estimated portion, NOT a standard serving.
    4. Provide the portion description in Traditional Chinese (e.g., "約 200g 白飯, 150g 炸雞腿").
  `;
  
  if (typeof input === 'string') {
    // Text-only mode
    contents = `Analyze the following food item description. ${promptSuffix}
      Food description: "${input}"`;
  } else {
    // Image mode
    const parts = [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: input.imageBase64.split(',')[1], // Remove data:image/jpeg;base64, prefix
        },
      },
      {
        text: input.text 
          ? `Analyze this image of food. The user also described it as: "${input.text}". ${promptSuffix}`
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
              description: "A short, concise name of the identified food in Traditional Chinese (繁體中文)",
            },
            portionEstimate: {
              type: Type.STRING,
              description: "A short description of estimated portion size/weight (e.g., '約 1碗飯, 100g 肉')",
            },
            calories: {
              type: Type.NUMBER,
              description: "Estimated total calories (kcal) for the specific portion in the image",
            },
            protein: {
              type: Type.NUMBER,
              description: "Estimated protein in grams",
            },
            carbs: {
              type: Type.NUMBER,
              description: "Estimated carbohydrates in grams",
            },
            fat: {
              type: Type.NUMBER,
              description: "Estimated fat in grams",
            },
          },
          required: ["name", "calories", "protein", "carbs", "fat"],
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