import React, { useState } from 'react';
import { generateWorkoutPlan, WorkoutPlanResult, hasApiKey } from '../services/geminiService';

interface WorkoutAdvisorProps {
  onAddExercise: (exerciseName: string, sets: number, reps: number) => void;
  onClose: () => void;
}

const BODY_PARTS = [
  { name: 'Chest (胸)', focus: ['Overall', 'Upper Chest', 'Lower Chest', 'Push Strength'] },
  { name: 'Back (背)', focus: ['Overall', 'Width (Lats)', 'Thickness', 'Pull Strength'] },
  { name: 'Legs (腿)', focus: ['Overall', 'Quads', 'Hamstrings', 'Glutes'] },
  { name: 'Shoulders (肩)', focus: ['Overall', 'Front Delt', 'Side Delt', 'Rear Delt'] },
  { name: 'Arms (手)', focus: ['Biceps', 'Triceps'] },
  { name: 'Abs (腹)', focus: ['Core Strength', 'Six Pack'] },
];

const WorkoutAdvisor: React.FC<WorkoutAdvisorProps> = ({ onAddExercise, onClose }) => {
  const [mode, setMode] = useState<'quick' | 'chat'>('quick');
  const [selectedPart, setSelectedPart] = useState(BODY_PARTS[0]);
  const [selectedFocus, setSelectedFocus] = useState(BODY_PARTS[0].focus[0]);
  const [customInput, setCustomInput] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<WorkoutPlanResult | null>(null);

  const handleGenerate = async () => {
    if (!hasApiKey()) {
      alert("Please configure API Key first.");
      return;
    }

    setLoading(true);
    setPlan(null);

    try {
      let target = '';
      let context = '';

      if (mode === 'quick') {
        target = `${selectedPart.name} - Focus: ${selectedFocus}`;
        context = "Standard hypertrophy workout.";
      } else {
        target = "Custom Goal";
        context = customInput;
      }

      const result = await generateWorkoutPlan(target, context);
      if (result) {
        setPlan(result);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 shrink-0 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h2 className="text-white font-bold text-lg">AI Coach</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b shrink-0 bg-gray-50">
          <div className="flex gap-2 mb-4">
             <button 
               onClick={() => setMode('quick')}
               className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${mode === 'quick' ? 'bg-white text-blue-600 shadow-sm border' : 'text-gray-500 hover:bg-gray-200'}`}
             >
               Quick Select
             </button>
             <button 
               onClick={() => setMode('chat')}
               className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${mode === 'chat' ? 'bg-white text-blue-600 shadow-sm border' : 'text-gray-500 hover:bg-gray-200'}`}
             >
               Chat Request
             </button>
          </div>

          {mode === 'quick' ? (
            <div className="flex gap-2">
               <select 
                 className="flex-1 p-2 border rounded-lg text-sm"
                 value={selectedPart.name}
                 onChange={(e) => {
                    const part = BODY_PARTS.find(p => p.name === e.target.value)!;
                    setSelectedPart(part);
                    setSelectedFocus(part.focus[0]);
                 }}
               >
                 {BODY_PARTS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
               </select>
               <select 
                 className="flex-1 p-2 border rounded-lg text-sm"
                 value={selectedFocus}
                 onChange={(e) => setSelectedFocus(e.target.value)}
               >
                 {selectedPart.focus.map(f => <option key={f} value={f}>{f}</option>)}
               </select>
            </div>
          ) : (
            <input 
              className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. I have 20 mins and only dumbbells, want to train arms."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
            />
          )}

          <button 
            onClick={handleGenerate}
            disabled={loading || (mode === 'chat' && !customInput.trim())}
            className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? 'Thinking...' : 'Generate Plan'}
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {plan ? (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                 <h3 className="font-bold text-lg text-blue-800">{plan.planName}</h3>
                 <p className="text-sm text-gray-600 mt-1">{plan.advice}</p>
              </div>

              <div className="space-y-3">
                 {plan.exercises.map((ex, idx) => (
                   <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-300 transition group">
                      <div className="flex justify-between items-start">
                         <div>
                            <h4 className="font-bold text-gray-800">{ex.name}</h4>
                            <div className="flex gap-3 text-sm text-gray-600 mt-1">
                               <span className="bg-gray-100 px-2 py-0.5 rounded">Sets: {ex.sets}</span>
                               <span className="bg-gray-100 px-2 py-0.5 rounded">Reps: {ex.reps}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2 italic">{ex.tips}</p>
                         </div>
                         <button 
                           onClick={() => onAddExercise(ex.name, ex.sets, parseInt(ex.reps) || 10)}
                           className="bg-blue-50 text-blue-600 p-2 rounded-full hover:bg-blue-100 transition shrink-0"
                           title="Add to Log"
                         >
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                         </button>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t flex items-center gap-1">
                         <span className="text-xs text-red-500">📺</span>
                         <a 
                           href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.youtubeQuery)}`}
                           target="_blank"
                           rel="noreferrer"
                           className="text-xs text-blue-500 hover:underline font-medium"
                         >
                           Watch Tutorial
                         </a>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          ) : (
            !loading && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="text-4xl mb-2">🏋️</span>
                <p>Select options or describe your goal to get a plan.</p>
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
};

export default WorkoutAdvisor;