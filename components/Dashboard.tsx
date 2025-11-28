
import React, { useState, useMemo } from 'react';
import { UserProfile, FoodLogItem, WorkoutLogItem, BodyCheckItem } from '../types';
import { formatDateReadable } from '../utils/calculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import FitnessTracker from './FitnessTracker';

interface DayDetailProps {
  user: UserProfile;
  date: string;
  logs: FoodLogItem[];
  workouts: WorkoutLogItem[];
  bodyChecks: BodyCheckItem[];
  onBack: () => void;
  // Food Actions
  onDeleteLog: (id: string) => void;
  onAddFood: () => void;
  onEditLog: (log: FoodLogItem) => void;
  // Fitness Actions
  onAddWorkout: (item: WorkoutLogItem) => void;
  onDeleteWorkout: (id: string) => void;
  onAddBodyCheck: (item: BodyCheckItem) => void;
  onDeleteBodyCheck: (id: string) => void;
}

const Dashboard: React.FC<DayDetailProps> = ({ 
  user, date, logs, workouts, bodyChecks, onBack,
  onDeleteLog, onAddFood, onEditLog,
  onAddWorkout, onDeleteWorkout, onAddBodyCheck, onDeleteBodyCheck 
}) => {
  const [activeTab, setActiveTab] = useState<'nutrition' | 'fitness'>('nutrition');

  // Nutrition Calcs
  const todaysLogs = useMemo(() => logs.filter(log => log.date === date), [logs, date]);
  
  const totalMacros = useMemo(() => {
    return todaysLogs.reduce((acc, curr) => ({
      calories: acc.calories + curr.calories,
      protein: acc.protein + curr.protein,
      carbs: acc.carbs + curr.carbs,
      fat: acc.fat + curr.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [todaysLogs]);

  const calorieGoal = user.targetCalories;
  const remainingCalories = Math.max(0, calorieGoal - totalMacros.calories);
  const progressPercent = Math.min(100, (totalMacros.calories / calorieGoal) * 100);

  const pieData = [
    { name: 'Protein', value: totalMacros.protein, color: '#34D399' }, 
    { name: 'Carbs', value: totalMacros.carbs, color: '#60A5FA' }, 
    { name: 'Fat', value: totalMacros.fat, color: '#F87171' }, 
  ];

  // Fitness Data (Filtered by date in Parent or here? Parent passes all, we filter here for safety)
  const todaysWorkouts = useMemo(() => workouts.filter(w => w.date === date), [workouts, date]);
  const todaysBodyChecks = useMemo(() => bodyChecks.filter(b => b.date === date), [bodyChecks, date]);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      
      {/* Date Header */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div>
           <h2 className="text-lg font-bold text-gray-800">{formatDateReadable(date)}</h2>
           <p className="text-xs text-gray-500">Daily Log</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <button 
          onClick={() => setActiveTab('nutrition')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'nutrition' ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <span>🥗</span> Nutrition
        </button>
        <button 
           onClick={() => setActiveTab('fitness')}
           className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'fitness' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <span>💪</span> Fitness & Body
        </button>
      </div>

      {/* Content */}
      {activeTab === 'nutrition' ? (
        <div className="space-y-4 animate-fade-in">
             {/* Stats Cards */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-md col-span-1 md:col-span-2 flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <span className="text-3xl font-bold text-gray-800">{totalMacros.calories}</span>
                            <span className="text-gray-500 ml-1">/ {calorieGoal} kcal</span>
                        </div>
                        <div className="text-right">
                            <span className="block text-sm text-gray-500">Remaining</span>
                            <span className="font-bold text-emerald-600">{remainingCalories}</span>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-4 rounded-full transition-all duration-500 ease-in-out" 
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                        <div className="bg-blue-50 p-2 rounded-lg">
                            <p className="text-xs text-blue-500 font-semibold uppercase">Carbs</p>
                            <p className="font-bold text-gray-700">{Math.round(totalMacros.carbs)}g</p>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-lg">
                            <p className="text-xs text-emerald-500 font-semibold uppercase">Protein</p>
                            <p className="font-bold text-gray-700">{Math.round(totalMacros.protein)}g</p>
                        </div>
                        <div className="bg-red-50 p-2 rounded-lg">
                            <p className="text-xs text-red-500 font-semibold uppercase">Fat</p>
                            <p className="font-bold text-gray-700">{Math.round(totalMacros.fat)}g</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center">
                     <div className="w-full h-32">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                    {pieData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.color} /> ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="flex gap-2 text-xs mt-2">
                         <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div> C</span>
                         <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> P</span>
                         <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div> F</span>
                     </div>
                </div>
             </div>

             {/* Food Log List */}
             <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                      <h3 className="font-bold text-gray-700">Food Log</h3>
                      <button onClick={onAddFood} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg shadow transition">
                        + Add Food
                      </button>
                  </div>
                  <div className="divide-y divide-gray-100">
                      {todaysLogs.length === 0 ? (
                          <div className="p-8 text-center text-gray-400">No meals tracked for this day.</div>
                      ) : (
                          todaysLogs.map(log => (
                              <div 
                                key={log.id} 
                                className="p-4 hover:bg-gray-50 flex justify-between items-center transition cursor-pointer group"
                                onClick={() => onEditLog(log)}
                              >
                                  <div className="flex items-center gap-4">
                                      {log.image ? (
                                        <img src={log.image} alt={log.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                                      ) : (
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl border border-gray-200">🍎</div>
                                      )}
                                      <div>
                                          <p className="font-semibold text-gray-800 group-hover:text-emerald-600 flex items-center gap-2">
                                            {log.name} 
                                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">EDIT</span>
                                          </p>
                                          <p className="text-xs text-gray-500">{log.calories} kcal • P: {log.protein}g</p>
                                      </div>
                                  </div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteLog(log.id); }} 
                                    className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                  </button>
                              </div>
                          ))
                      )}
                  </div>
             </div>
        </div>
      ) : (
        <div className="animate-fade-in">
           <FitnessTracker 
             date={date}
             workouts={todaysWorkouts}
             bodyChecks={todaysBodyChecks}
             onAddWorkout={onAddWorkout}
             onDeleteWorkout={onDeleteWorkout}
             onAddBodyCheck={onAddBodyCheck}
             onDeleteBodyCheck={onDeleteBodyCheck}
           />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
