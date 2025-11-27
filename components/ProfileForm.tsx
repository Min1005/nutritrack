
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Gender, ActivityLevel, Goal } from '../types';
import { calculateBMR, calculateTDEE, calculateTargetCalories, generateId } from '../utils/calculations';
import { compressImage } from '../utils/imageUtils';

interface ProfileFormProps {
  initialData?: UserProfile | null;
  onSave: (profile: UserProfile) => void;
  onCancel: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ initialData, onSave, onCancel }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [avatar, setAvatar] = useState(initialData?.avatar || '');
  const [height, setHeight] = useState(initialData?.height?.toString() || '');
  const [weight, setWeight] = useState(initialData?.weight?.toString() || '');
  const [age, setAge] = useState(initialData?.age?.toString() || '');
  const [gender, setGender] = useState<Gender>(initialData?.gender || Gender.Male);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(initialData?.activityLevel || ActivityLevel.Sedentary);
  const [goal, setGoal] = useState<Goal>(initialData?.goal || Goal.Maintain);
  
  const [calculatedTDEE, setCalculatedTDEE] = useState<number>(0);
  const [calculatedTarget, setCalculatedTarget] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseFloat(age);

    if (!isNaN(h) && !isNaN(w) && !isNaN(a)) {
      const bmr = calculateBMR(w, h, a, gender);
      const tdee = calculateTDEE(bmr, activityLevel);
      const target = calculateTargetCalories(tdee, goal);
      
      setCalculatedTDEE(tdee);
      setCalculatedTarget(target);
    }
  }, [height, weight, age, gender, activityLevel, goal]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Square crop approximation by standard resize
        const compressed = await compressImage(file, 200, 0.8);
        setAvatar(compressed);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !height || !weight || !age) return;

    const h = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseFloat(age);
    
    // Final Calculation
    const bmr = calculateBMR(w, h, a, gender);
    const tdee = calculateTDEE(bmr, activityLevel);
    const targetCalories = calculateTargetCalories(tdee, goal);

    const profile: UserProfile = {
      id: initialData?.id || generateId(),
      name,
      avatar,
      height: h,
      weight: w,
      age: a,
      gender,
      activityLevel,
      goal,
      tdee,
      targetCalories
    };

    onSave(profile);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{initialData ? 'Edit Profile' : 'Create New Profile'}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Avatar Upload */}
        <div className="flex flex-col items-center mb-6">
           <input 
             type="file" 
             accept="image/*" 
             ref={fileInputRef} 
             className="hidden" 
             onChange={handleAvatarUpload}
           />
           <div 
             onClick={() => fileInputRef.current?.click()}
             className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 overflow-hidden transition relative group"
           >
             {avatar ? (
               <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
             ) : (
               <div className="text-gray-400 text-center">
                 <span className="text-2xl">📷</span>
                 <p className="text-[10px]">Upload</p>
               </div>
             )}
             <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition" />
           </div>
           <p className="text-xs text-gray-500 mt-2">Click to set profile photo</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input 
            type="text" 
            required
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2"
            placeholder="e.g. John Doe"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Age</label>
            <input 
              type="number" 
              required
              step="1"
              value={age} 
              onChange={e => setAge(e.target.value)} 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select 
              value={gender} 
              onChange={e => setGender(e.target.value as Gender)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2"
            >
              <option value={Gender.Male}>Male</option>
              <option value={Gender.Female}>Female</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
            <input 
              type="number" 
              required
              step="0.1"
              value={height} 
              onChange={e => setHeight(e.target.value)} 
              placeholder="175.5"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
            <input 
              type="number" 
              required
              step="0.1"
              value={weight} 
              onChange={e => setWeight(e.target.value)} 
              placeholder="70.2"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Activity Level</label>
          <select 
            value={activityLevel} 
            onChange={e => setActivityLevel(e.target.value as ActivityLevel)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2"
          >
            <option value={ActivityLevel.Sedentary}>Sedentary (Office job, little exercise)</option>
            <option value={ActivityLevel.Light}>Lightly Active (1-3 days/week)</option>
            <option value={ActivityLevel.Moderate}>Moderately Active (3-5 days/week)</option>
            <option value={ActivityLevel.Active}>Active (6-7 days/week)</option>
            <option value={ActivityLevel.VeryActive}>Very Active (Physical job + training)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Goal</label>
          <select 
            value={goal} 
            onChange={e => setGoal(e.target.value as Goal)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2 bg-emerald-50 text-emerald-900 font-medium"
          >
            <option value={Goal.Cut}>Lose Weight (Deficit ~400kcal)</option>
            <option value={Goal.Maintain}>Maintain Weight</option>
            <option value={Goal.Bulk}>Gain Muscle (Surplus ~300kcal)</option>
          </select>
        </div>

        {/* Live TDEE Preview */}
        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 mt-4 space-y-2">
          <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
             <span className="text-sm text-emerald-800">Maintenance Calories (TDEE)</span>
             <span className="font-bold text-emerald-700">{calculatedTDEE > 0 ? calculatedTDEE : '---'}</span>
          </div>
          <div className="flex justify-between items-center pt-1">
             <span className="text-sm text-emerald-800 font-bold">Daily Target ({goal === Goal.Cut ? 'Cut' : goal === Goal.Bulk ? 'Bulk' : 'Maintain'})</span>
             <span className="font-bold text-2xl text-emerald-700">{calculatedTarget > 0 ? calculatedTarget : '---'} <span className="text-xs">kcal</span></span>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
           {initialData && (
             <button 
               type="button" 
               onClick={onCancel}
               className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
             >
               Cancel
             </button>
           )}
          <button 
            type="submit" 
            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            {initialData ? 'Update Profile' : 'Create Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;
