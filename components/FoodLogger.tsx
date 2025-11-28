import React, { useState, useEffect, useRef } from 'react';
import { analyzeFoodWithGemini, analyzeSingleIngredient, hasApiKey } from '../services/geminiService';
import { MacroNutrients, SavedFoodItem, FoodLogItem, IngredientItem } from '../types';
import { StorageService } from '../services/storageService';
import { compressImage } from '../utils/imageUtils';
import { commonFoodDatabase } from '../utils/foodData';

interface FoodLoggerProps {
  userId: string;
  initialLog?: FoodLogItem | null;
  onAdd: (name: string, macros: MacroNutrients, image?: string, ingredients?: IngredientItem[]) => void;
  onUpdate?: (log: FoodLogItem) => void;
  onCancel: () => void;
}

interface EditableIngredient extends IngredientItem {
  id: string;
  isLoading?: boolean;
}

const FoodLogger: React.FC<FoodLoggerProps> = ({ userId, initialLog, onAdd, onUpdate, onCancel }) => {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Image State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Database / Search State
  const [savedFoods, setSavedFoods] = useState<SavedFoodItem[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<SavedFoodItem[]>([]);
  
  // AI Result State - Now managing a list of ingredients
  const [overallName, setOverallName] = useState('');
  const [ingredients, setIngredients] = useState<EditableIngredient[]>([]);

  // Manual Form State
  const [manualName, setManualName] = useState('');
  const [manualCals, setManualCals] = useState('');
  const [manualProt, setManualProt] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');

  // Initialize for Editing
  useEffect(() => {
    if (initialLog) {
      setMode('ai'); // Use AI view structure for editing
      setOverallName(initialLog.name);
      setSelectedImage(initialLog.image || null);
      
      if (initialLog.ingredients && initialLog.ingredients.length > 0) {
        setIngredients(initialLog.ingredients.map(ing => ({
          ...ing,
          id: Math.random().toString(36).substr(2, 9),
          isLoading: false
        })));
      } else {
        // IMPORTANT FIX: 
        // If editing a log that doesn't have detailed ingredients (e.g. legacy data or manual entry),
        // convert the total macros into a single "ingredient" line.
        // This allows the user to still use the detailed editor (split, delete, modify) 
        // instead of being stuck with a read-only total.
        setIngredients([{
          id: Math.random().toString(36).substr(2, 9),
          name: initialLog.name, // The line item name defaults to the dish name
          calories: initialLog.calories,
          protein: initialLog.protein,
          carbs: initialLog.carbs,
          fat: initialLog.fat,
          isLoading: false
        }]);
      }
    } else {
      // Load saved foods only if not editing
      const foods = StorageService.getSavedFoods(userId);
      setSavedFoods(foods);
    }
  }, [userId, initialLog]);

  // Filter foods when input changes
  useEffect(() => {
    if (mode === 'ai' && input.trim() && !selectedImage && !initialLog) {
      const search = input.toLowerCase();
      
      const userMatches = savedFoods.filter(food => 
        food.name.toLowerCase().includes(search)
      );

      const staticMatches = Object.entries(commonFoodDatabase)
        .filter(([name]) => name.toLowerCase().includes(search))
        .map(([name, macros]) => ({
            id: `static-${name}`,
            name,
            ...macros,
            timesUsed: 0
        } as SavedFoodItem));

      setFilteredFoods([...userMatches, ...staticMatches]);

    } else {
      setFilteredFoods([]);
    }
  }, [input, savedFoods, mode, selectedImage, initialLog]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 600);
        setSelectedImage(compressedBase64);
        setIngredients([]); // Reset previous results
        setOverallName('');
      } catch (err) {
        console.error("Error compressing image", err);
        setError("Failed to process image. Try a smaller one.");
      }
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIngredients([]);
    setOverallName('');
  };

  const handleAiAnalyze = async () => {
    if (!input.trim() && !selectedImage) return;
    setLoading(true);
    setError('');
    setIngredients([]);
    setOverallName('');

    try {
      if (!hasApiKey()) {
          setError('API Key is missing. Manual entry required.');
          setMode('manual');
          setLoading(false);
          return;
      }
      
      let result;
      if (selectedImage) {
        result = await analyzeFoodWithGemini({ imageBase64: selectedImage, text: input });
      } else {
        result = await analyzeFoodWithGemini(input);
      }
      
      if (result && result.ingredients) {
        setOverallName(result.name);
        setIngredients(result.ingredients.map(ing => ({
          ...ing,
          id: Math.random().toString(36).substr(2, 9),
          isLoading: false
        })));
      } else {
        setError('Could not identify food. Please try again or use manual entry.');
      }
    } catch (err) {
      setError('An error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateRow = async (id: string, newName: string) => {
    setIngredients(prev => prev.map(item => 
      item.id === id ? { ...item, name: newName, isLoading: true } : item
    ));

    try {
      const result = await analyzeSingleIngredient(newName);
      if (result) {
        setIngredients(prev => prev.map(item => 
          item.id === id ? { ...item, ...result, name: newName, isLoading: false } : item
        ));
      } else {
        setIngredients(prev => prev.map(item => 
            item.id === id ? { ...item, isLoading: false } : item
        ));
      }
    } catch (e) {
      setIngredients(prev => prev.map(item => 
        item.id === id ? { ...item, isLoading: false } : item
      ));
    }
  };

  const handleDeleteRow = (id: string) => {
    setIngredients(prev => prev.filter(item => item.id !== id));
  };

  const handleAddRow = () => {
    setIngredients(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: "New Item (e.g. 滷蛋)",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        isLoading: false
      }
    ]);
  };

  const calculateTotal = () => {
    return ingredients.reduce((acc, curr) => ({
      calories: acc.calories + curr.calories,
      protein: acc.protein + curr.protein,
      carbs: acc.carbs + curr.carbs,
      fat: acc.fat + curr.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const handleConfirm = () => {
    if (ingredients.length > 0) {
      const totals = calculateTotal();
      
      // Clean ingredients for storage (remove ID and loading state)
      const cleanIngredients: IngredientItem[] = ingredients.map(({ id, isLoading, ...rest }) => rest);

      if (initialLog && onUpdate) {
        // UPDATE MODE
        onUpdate({
          ...initialLog,
          name: overallName,
          ...totals,
          ingredients: cleanIngredients,
          image: selectedImage || undefined
        });
      } else {
        // ADD MODE
        onAdd(
          overallName, 
          totals,
          selectedImage || undefined,
          cleanIngredients
        );

        // Save to Database only on new adds
        StorageService.saveFoodToDatabase(userId, {
          name: overallName, 
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat
        });
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const foodData = {
      name: manualName,
      calories: parseFloat(manualCals) || 0,
      protein: parseFloat(manualProt) || 0,
      carbs: parseFloat(manualCarbs) || 0,
      fat: parseFloat(manualFat) || 0,
    };

    onAdd(manualName, foodData, selectedImage || undefined, []);
    StorageService.saveFoodToDatabase(userId, foodData);
  };

  const handleSelectSavedFood = (food: SavedFoodItem) => {
    // When selecting saved food, treat it as "AI Result" with 1 ingredient for consistency
    setOverallName(food.name);
    setIngredients([{
        id: 'saved-1',
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        isLoading: false
    }]);
  };

  const totals = calculateTotal();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-600 p-4 flex justify-between items-center shrink-0">
          <h2 className="text-white font-bold text-lg">{initialLog ? 'Edit Log' : 'Log Food'}</h2>
          <button onClick={onCancel} className="text-white hover:text-emerald-100 p-1 rounded-full hover:bg-emerald-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Mode Toggle (Hidden if editing) */}
        {!initialLog && (
          <div className="flex border-b shrink-0">
            <button 
              className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'ai' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setMode('ai')}
            >
              ✨ Search / AI
            </button>
            <button 
              className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'manual' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setMode('manual')}
            >
              ✏️ Manual Entry
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {mode === 'ai' ? (
            <div className="space-y-4">
              
              {/* Image & Search Area (Hidden if ingredients already loaded/editing) */}
              {ingredients.length === 0 && !initialLog && (
                <div className="flex items-center gap-3">
                   <input 
                     type="file" 
                     accept="image/*" 
                     ref={fileInputRef}
                     className="hidden"
                     onChange={handleImageUpload}
                   />
                   
                   {!selectedImage ? (
                     <button 
                       onClick={() => fileInputRef.current?.click()}
                       className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-emerald-600 transition"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                     </button>
                   ) : (
                     <div className="relative w-20 h-20 shrink-0">
                       <img src={selectedImage} alt="Preview" className="w-full h-full object-cover rounded-lg border" />
                       <button 
                         onClick={clearImage}
                         className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                       </button>
                     </div>
                   )}

                   <div className="relative flex-grow">
                      <input 
                        type="text" 
                        value={input}
                        onChange={(e) => {
                          setInput(e.target.value);
                          setIngredients([]);
                        }}
                        placeholder={selectedImage ? "Describe food (Optional)..." : "e.g. 雞胸肉"}
                        className="w-full border border-gray-300 rounded-lg pl-4 pr-12 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm text-lg"
                        onKeyDown={(e) => e.key === 'Enter' && handleAiAnalyze()}
                        autoFocus={!selectedImage}
                      />
                      <button 
                        onClick={handleAiAnalyze}
                        disabled={loading || (!input && !selectedImage)}
                        className="absolute right-2 top-2 bottom-2 bg-emerald-600 text-white px-3 rounded-md disabled:opacity-50 hover:bg-emerald-700 transition-colors flex items-center justify-center"
                      >
                        {loading ? (
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        )}
                      </button>
                   </div>
                </div>
              )}

              {/* Suggestions */}
              {input && filteredFoods.length > 0 && ingredients.length === 0 && !selectedImage && !initialLog && (
                <div className="space-y-2 animate-fade-in">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suggestions</p>
                  {filteredFoods.map(food => (
                    <button
                      key={food.id}
                      onClick={() => handleSelectSavedFood(food)}
                      className="w-full text-left p-3 border rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition flex justify-between items-center bg-white shadow-sm"
                    >
                      <span className="font-medium text-gray-800">{food.name}</span>
                      <span className="text-sm text-gray-500">{food.calories} kcal</span>
                    </button>
                  ))}
                </div>
              )}

              {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}

              {/* Ingredient Editor (Always shown if ingredients exist) */}
              {ingredients.length > 0 && (
                <div className="bg-emerald-50 rounded-xl border border-emerald-100 animate-fade-in shadow-sm overflow-hidden">
                  <div className="p-4 bg-emerald-100 border-b border-emerald-200 flex justify-between items-center">
                     <div className="w-2/3">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Meal Name</span>
                        <input 
                           value={overallName} 
                           onChange={e => setOverallName(e.target.value)}
                           className="block w-full bg-transparent font-bold text-lg text-gray-800 focus:outline-none border-b border-dashed border-emerald-400 focus:border-emerald-600"
                        />
                     </div>
                     <div className="text-right">
                       <p className="text-xs text-emerald-700 font-semibold">TOTAL</p>
                       <p className="font-bold text-lg text-emerald-800">{Math.round(totals.calories)} <span className="text-xs">kcal</span></p>
                     </div>
                  </div>
                  
                  {/* If editing and has image, show it small */}
                  {initialLog && selectedImage && (
                    <div className="bg-emerald-50 px-4 pt-2">
                       <img src={selectedImage} alt="Food" className="w-16 h-16 rounded object-cover border border-emerald-200" />
                    </div>
                  )}

                  <div className="divide-y divide-emerald-100 max-h-60 overflow-y-auto">
                     {ingredients.map((item, index) => (
                       <div key={item.id} className="p-3 bg-white hover:bg-gray-50 transition">
                         <div className="flex gap-2 mb-2">
                            <input 
                              value={item.name}
                              onChange={(e) => {
                                const newVal = e.target.value;
                                setIngredients(prev => prev.map(p => p.id === item.id ? {...p, name: newVal} : p));
                              }}
                              className="flex-grow border border-gray-200 rounded px-2 py-1 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                            <button 
                              onClick={() => handleRecalculateRow(item.id, item.name)}
                              disabled={item.isLoading}
                              className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-1.5 rounded"
                              title="Recalculate Macros from Name"
                            >
                              {item.isLoading ? <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div> : '🔄'}
                            </button>
                            <button 
                              onClick={() => handleDeleteRow(item.id)}
                              className="bg-red-50 text-red-500 hover:bg-red-100 p-1.5 rounded"
                              title="Delete Item"
                            >
                              ×
                            </button>
                         </div>
                         <div className="flex justify-between text-xs text-gray-500 px-1">
                            <span>Cal: {Math.round(item.calories)}</span>
                            <span>P: {Math.round(item.protein)}</span>
                            <span>C: {Math.round(item.carbs)}</span>
                            <span>F: {Math.round(item.fat)}</span>
                         </div>
                       </div>
                     ))}
                  </div>

                  <div className="p-3 bg-emerald-50 border-t border-emerald-100 flex gap-2">
                     <button 
                       onClick={handleAddRow}
                       className="flex-1 py-2 bg-white border border-emerald-200 text-emerald-700 text-sm rounded-lg hover:bg-emerald-100 transition"
                     >
                       + Add Item
                     </button>
                  </div>

                  <div className="p-3">
                    <button 
                      onClick={handleConfirm}
                      className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 font-bold shadow-md hover:shadow-lg transition-all transform active:scale-95"
                    >
                      {initialLog ? 'Save Changes' : 'Confirm & Add Log'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
               {/* Manual Image Upload */}
               <div className="flex items-center gap-3 mb-4">
                 <input 
                   type="file" 
                   accept="image/*" 
                   ref={fileInputRef}
                   className="hidden"
                   onChange={handleImageUpload}
                 />
                 <button 
                   type="button"
                   onClick={() => fileInputRef.current?.click()}
                   className="w-full py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 transition flex items-center justify-center gap-2"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                   {selectedImage ? 'Change Photo' : 'Add Photo (Optional)'}
                 </button>
               </div>
               
               {selectedImage && (
                 <div className="relative w-full h-40 mb-4 bg-black rounded-lg overflow-hidden">
                    <img src={selectedImage} alt="Preview" className="w-full h-full object-contain" />
                    <button 
                       type="button"
                       onClick={clearImage}
                       className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                 </div>
               )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Name (食物名稱)</label>
                <input 
                  required
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  placeholder="e.g. 滷肉飯"
                  className="block w-full rounded-lg border-gray-300 shadow-sm border p-2 focus:ring-emerald-500 focus:border-emerald-500" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                    <input 
                      type="number" required
                      value={manualCals}
                      onChange={e => setManualCals(e.target.value)}
                      className="block w-full rounded-lg border-gray-300 shadow-sm border p-2 focus:ring-emerald-500 focus:border-emerald-500" 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
                    <input 
                      type="number" required
                      value={manualProt}
                      onChange={e => setManualProt(e.target.value)}
                      className="block w-full rounded-lg border-gray-300 shadow-sm border p-2 focus:ring-emerald-500 focus:border-emerald-500" 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
                    <input 
                      type="number" required
                      value={manualCarbs}
                      onChange={e => setManualCarbs(e.target.value)}
                      className="block w-full rounded-lg border-gray-300 shadow-sm border p-2 focus:ring-emerald-500 focus:border-emerald-500" 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
                    <input 
                      type="number" required
                      value={manualFat}
                      onChange={e => setManualFat(e.target.value)}
                      className="block w-full rounded-lg border-gray-300 shadow-sm border p-2 focus:ring-emerald-500 focus:border-emerald-500" 
                    />
                 </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 font-bold shadow-md transition-all mt-4">
                Add to Log
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodLogger;