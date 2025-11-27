
import { GoogleGenAI, Type } from "@google/genai";
import { MacroNutrients } from "../types";

// Helper to check if API key exists
export const hasApiKey = (): boolean => {
  return !!process.env.API_KEY;
};

export const analyzeFoodWithGemini = async (
  input: string | { imageBase64: string, text?: string }
): Promise<MacroNutrients & { name: string } | null> => {
  if (!process.env.API_KEY) {
    console.error("API Key is missing");
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is set.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let contents: any;
  const promptSuffix = "Provide the food name in Traditional Chinese (繁體中文). If the quantity is not specified, assume a standard serving size.";
  
  if (typeof input === 'string') {
    // Text-only mode
    contents = `Analyze the following food item/meal and provide the estimated nutritional information. ${promptSuffix}
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
          : `Analyze this image of food and identify what it is. ${promptSuffix}`
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
            calories: {
              type: Type.NUMBER,
              description: "Estimated total calories (kcal)",
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
