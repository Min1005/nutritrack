
import React, { useState, useEffect, useRef } from 'react';
import { analyzeFoodWithGemini, hasApiKey } from '../services/geminiService';
import { MacroNutrients, SavedFoodItem } from '../types';
import { StorageService } from '../services/storageService';
import { compressImage } from '../utils/imageUtils';
import { commonFoodDatabase } from '../utils/foodData';

interface FoodLoggerProps {
  userId: string;
  onAdd: (name: string, macros: MacroNutrients, image?: string) => void;
  onCancel: () => void;
}

const FoodLogger: React.FC<FoodLoggerProps> = ({ userId, onAdd, onCancel }) => {
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
  
  // AI Result State
  const [aiResult, setAiResult] = useState<(MacroNutrients & { name: string }) | null>(null);

  // Manual Form State
  const [manualName, setManualName] = useState('');
  const [manualCals, setManualCals] = useState('');
  const [manualProt, setManualProt] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');

  // Load saved foods on mount
  useEffect(() => {
    const foods = StorageService.getSavedFoods(userId);
    setSavedFoods(foods);
  }, [userId]);

  // Filter foods when input changes
  useEffect(() => {
    if (mode === 'ai' && input.trim() && !selectedImage) {
      const search = input.toLowerCase();
      
      // 1. Search Personal Database (Saved by user)
      const userMatches = savedFoods.filter(food => 
        food.name.toLowerCase().includes(search)
      );

      // 2. Search Static Common Database
      const staticMatches = Object.entries(commonFoodDatabase)
        .filter(([name]) => name.toLowerCase().includes(search))
        .map(([name, macros]) => ({
            id: `static-${name}`,
            name,
            ...macros,
            timesUsed: 0 // Static items don't track usage count here
        } as SavedFoodItem));

      // Combine matches. 
      // Note: We could deduplicate if names are identical, but simple list is fine for now.
      setFilteredFoods([...userMatches, ...staticMatches]);

    } else {
      setFilteredFoods([]);
    }
  }, [input, savedFoods, mode, selectedImage]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 600); // Compress to max width 600px
        setSelectedImage(compressedBase64);
        setAiResult(null); // Reset previous results
      } catch (err) {
        console.error("Error compressing image", err);
        setError("Failed to process image. Try a smaller one.");
      }
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setAiResult(null);
  };

  const handleAiAnalyze = async () => {
    if (!input.trim() && !selectedImage) return;
    setLoading(true);
    setError('');
    setAiResult(null);

    try {
      if (!hasApiKey()) {
          setError('API Key is missing. Manual entry required.');
          setMode('manual');
          setLoading(false);
          return;
      }
      
      let result;
      if (selectedImage) {
        // Image analysis
        result = await analyzeFoodWithGemini({ imageBase64: selectedImage, text: input });
      } else {
        // Text analysis
        result = await analyzeFoodWithGemini(input);
      }
      
      if (result) {
        setAiResult(result);
      } else {
        setError('Could not identify food. Please try again or use manual entry.');
      }
    } catch (err) {
      setError('An error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAi = () => {
    if (aiResult) {
      // 1. Add to Log
      onAdd(
        aiResult.name, 
        {
          calories: aiResult.calories,
          protein: aiResult.protein,
          carbs: aiResult.carbs,
          fat: aiResult.fat
        },
        selectedImage || undefined
      );

      // 2. Save to Personal Database (Only macros/name, not the image to save space)
      StorageService.saveFoodToDatabase(userId, aiResult);
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

    // 1. Add to Log (include image if manually selected)
    onAdd(manualName, foodData, selectedImage || undefined);

    // 2. Save to Personal Database
    StorageService.saveFoodToDatabase(userId, foodData);
  };

  const handleSelectSavedFood = (food: SavedFoodItem) => {
    onAdd(food.name, {
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat
    });
    // Update usage count by re-saving (even if it came from static, we save it to personal now)
    StorageService.saveFoodToDatabase(userId, {
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-600 p-4 flex justify-between items-center shrink-0">
          <h2 className="text-white font-bold text-lg">Log Food</h2>
          <button onClick={onCancel} className="text-white hover:text-emerald-100 p-1 rounded-full hover:bg-emerald-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Mode Toggle */}
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

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {mode === 'ai' ? (
            <div className="space-y-4">
              
              {/* Image Input Area */}
              <div className="flex items-center gap-3">
                 <input 
                   type="file" 
                   accept="image/*" 
                   // Removed capture="environment" to allow gallery selection
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
                        setAiResult(null);
                      }}
                      placeholder={selectedImage ? "Add description (optional)..." : "e.g. 雞胸肉 / 200g Chicken"}
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

              {/* Suggestions / Database Results */}
              {input && filteredFoods.length > 0 && !aiResult && !selectedImage && (
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
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-xs">OR ANALYZE WITH AI</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>
                </div>
              )}

              {/* Empty State / Hints */}
              {!input && !loading && !aiResult && !selectedImage && (
                 <div className="text-center py-8">
                    {savedFoods.length > 0 ? (
                      <div className="space-y-2">
                         <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent Foods</p>
                         <div className="flex flex-wrap gap-2 justify-center">
                           {savedFoods.slice(0, 5).map(food => (
                             <button 
                               key={food.id}
                               onClick={() => handleSelectSavedFood(food)}
                               className="px-3 py-1 bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-700 rounded-full text-sm transition"
                             >
                               {food.name}
                             </button>
                           ))}
                         </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        <p>Type any food (e.g., 白飯, 雞胸肉) or upload a photo.</p>
                      </div>
                    )}
                 </div>
              )}

              {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}

              {/* AI Result Card */}
              {aiResult && (
                <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 animate-fade-in shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">AI Estimate</span>
                        <h3 className="font-bold text-xl text-gray-800">{aiResult.name}</h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-center text-sm mb-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-gray-500 text-xs mb-1">Calories</div>
                      <div className="font-bold text-lg text-gray-800">{aiResult.calories}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-emerald-500 text-xs mb-1">Protein</div>
                      <div className="font-bold text-gray-800">{aiResult.protein}g</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-blue-500 text-xs mb-1">Carbs</div>
                      <div className="font-bold text-gray-800">{aiResult.carbs}g</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-red-500 text-xs mb-1">Fat</div>
                      <div className="font-bold text-gray-800">{aiResult.fat}g</div>
                    </div>
                  </div>
                  <button 
                    onClick={handleConfirmAi}
                    className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 font-bold shadow-md hover:shadow-lg transition-all transform active:scale-95"
                  >
                    Add to Log
                  </button>
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
                   capture="environment"
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
