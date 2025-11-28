import React, { useState, useRef, useEffect } from 'react';
import { WorkoutLogItem, BodyCheckItem } from '../types';
import { generateId } from '../utils/calculations';
import { compressImage } from '../utils/imageUtils';
import { commonExercises } from '../utils/exerciseData';
import WorkoutAdvisor from './WorkoutAdvisor';

interface FitnessTrackerProps {
  date: string;
  workouts: WorkoutLogItem[];
  bodyChecks: BodyCheckItem[];
  onAddWorkout: (item: WorkoutLogItem) => void;
  onDeleteWorkout: (id: string) => void;
  onAddBodyCheck: (item: BodyCheckItem) => void;
  onDeleteBodyCheck: (id: string) => void;
}

const FitnessTracker: React.FC<FitnessTrackerProps> = ({ 
  date, workouts, bodyChecks, onAddWorkout, onDeleteWorkout, onAddBodyCheck, onDeleteBodyCheck 
}) => {
  // Form State
  const [exercise, setExercise] = useState('');
  const [sets, setSets] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState('Gym');
  
  // Autocomplete State
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredExercises, setFilteredExercises] = useState<string[]>([]);
  
  // AI Coach State
  const [showAdvisor, setShowAdvisor] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const tags = ['Gym', 'Cardio', 'Home', 'Chest', 'Back', 'Legs', 'Arms', 'Abs', 'Yoga'];

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExerciseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setExercise(val);
    
    if (val.length > 0) {
      const matches = commonExercises.filter(ex => 
        ex.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredExercises(matches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectExercise = (name: string) => {
    setExercise(name);
    setShowSuggestions(false);
  };

  const isFormValid = exercise.trim() !== '' && sets !== '' && reps !== '' && weight !== '';

  const handleAddWorkout = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isFormValid) return;

    const newWorkout: WorkoutLogItem = {
      id: generateId(),
      exercise: exercise,
      sets: parseInt(sets),
      reps: parseInt(reps),
      weight: parseFloat(weight),
      date: date,
      tags: [selectedTag],
      timestamp: Date.now()
    };
    onAddWorkout(newWorkout);
    
    // Reset but keep tags?
    setExercise('');
    setSets('');
    setReps('');
    setWeight('');
    setShowSuggestions(false);
  };

  const handleAdvisorAdd = (name: string, s: number, r: number) => {
    setExercise(name);
    setSets(s.toString());
    setReps(r.toString());
    setWeight(''); // User must input weight based on their strength
    setShowAdvisor(false);
    // Focus weight input?
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const compressed = await compressImage(file, 600, 0.6); // Aggressive compression for body shots
        const newItem: BodyCheckItem = {
          id: generateId(),
          date: date,
          image: compressed,
          timestamp: Date.now()
        };
        onAddBodyCheck(newItem);
      } catch (err) {
        alert("Failed to process image.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Workout Section */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>💪</span> Workouts
          </h3>
          <button 
            onClick={() => setShowAdvisor(true)}
            className="text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg hover:shadow-lg transition flex items-center gap-1 font-bold"
          >
            <span>✨</span> AI Coach
          </button>
        </div>

        {/* Add Workout Form */}
        <form onSubmit={handleAddWorkout} className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100 relative">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
             <div className="md:col-span-2 relative" ref={dropdownRef}>
               <label className="block text-xs font-semibold text-gray-500 mb-1">Exercise (動作) <span className="text-red-500">*</span></label>
               <input 
                 type="text" 
                 placeholder="e.g. Bench Press"
                 className="w-full border rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                 value={exercise}
                 onChange={handleExerciseChange}
                 onFocus={() => { if (exercise) setShowSuggestions(true); }}
                 required
                 autoComplete="off"
               />
               
               {/* Autocomplete Dropdown */}
               {showSuggestions && filteredExercises.length > 0 && (
                 <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                   {filteredExercises.map((ex, idx) => (
                     <button
                       key={idx}
                       type="button"
                       onClick={() => selectExercise(ex)}
                       className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition border-b last:border-0 border-gray-50"
                     >
                       {ex}
                     </button>
                   ))}
                 </div>
               )}
             </div>
             
             <div className="grid grid-cols-3 gap-3 md:col-span-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Sets (組數) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    placeholder="4"
                    className="w-full border rounded-lg p-2 text-sm"
                    value={sets}
                    onChange={e => setSets(e.target.value)}
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Reps (次數) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    placeholder="10"
                    className="w-full border rounded-lg p-2 text-sm"
                    value={reps}
                    onChange={e => setReps(e.target.value)}
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Weight (kg) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    placeholder="60"
                    className="w-full border rounded-lg p-2 text-sm"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    required
                    min="0"
                    step="0.5"
                  />
                </div>
             </div>
           </div>
           
           <div className="flex justify-between items-center mt-2">
              <select 
                className="border rounded-lg p-2 text-xs bg-white text-gray-600"
                value={selectedTag}
                onChange={e => setSelectedTag(e.target.value)}
              >
                {tags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button 
                type="submit"
                disabled={!isFormValid}
                className={`px-6 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all ${
                  isFormValid 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add Log
              </button>
           </div>
        </form>

        {/* Workout List */}
        <div className="space-y-2">
          {workouts.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No workouts recorded today.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2">Exercise</th>
                    <th className="px-3 py-2 text-center">Sets</th>
                    <th className="px-3 py-2 text-center">Reps</th>
                    <th className="px-3 py-2 text-center">Weight</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {workouts.map(w => (
                    <tr key={w.id} className="bg-white hover:bg-gray-50">
                      <td className="px-3 py-3 font-medium text-gray-900">
                        {w.exercise || (w as any).name} 
                        {/* Fallback for legacy data */}
                        <div className="text-xs text-gray-400 font-normal">
                          {w.tags.join(', ')}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600">{w.sets || '-'}</td>
                      <td className="px-3 py-3 text-center text-gray-600">{w.reps || '-'}</td>
                      <td className="px-3 py-3 text-center text-gray-600">{w.weight ? `${w.weight}kg` : '-'}</td>
                      <td className="px-3 py-3 text-right">
                        <button onClick={() => onDeleteWorkout(w.id)} className="text-red-400 hover:text-red-600 px-2 font-bold">
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Body Check Section */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>📸</span> Body Check
          </h3>
          <input 
             type="file" 
             accept="image/*" 
             className="hidden"
             ref={fileInputRef}
             onChange={handlePhotoUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : '+ Add Photo'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
           {bodyChecks.length === 0 ? (
             <div className="col-span-2 text-center text-gray-400 text-sm py-8 border-2 border-dashed border-gray-200 rounded-lg">
               Upload a photo to track your physique.
             </div>
           ) : (
             bodyChecks.map(check => (
               <div key={check.id} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-[3/4] bg-gray-100">
                 <img src={check.image} alt="Body Check" className="w-full h-full object-cover" />
                 <button 
                   onClick={() => onDeleteBodyCheck(check.id)}
                   className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                 </button>
               </div>
             ))
           )}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">Photos are stored locally on this device.</p>
      </div>

      {/* Advisor Modal */}
      {showAdvisor && (
        <WorkoutAdvisor 
          onClose={() => setShowAdvisor(false)} 
          onAddExercise={handleAdvisorAdd}
        />
      )}

    </div>
  );
};

export default FitnessTracker;