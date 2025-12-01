
import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, FoodLogItem, WorkoutLogItem, BodyCheckItem, DailyStats, ThemeColor } from '../types';
import { formatDateReadable } from '../utils/calculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import FitnessTracker from './FitnessTracker';
import { THEMES } from '../utils/theme';

interface DayDetailProps {
  user: UserProfile;
  date: string;
  logs: FoodLogItem[];
  workouts: WorkoutLogItem[];
  bodyChecks: BodyCheckItem[];
  dailyStats?: DailyStats;
  theme: ThemeColor;
  onUpdateDailyStats: (stats: DailyStats) => void;
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
  user, date, logs, workouts, bodyChecks, dailyStats, theme, onUpdateDailyStats, onBack,
  onDeleteLog, onAddFood, onEditLog,
  onAddWorkout, onDeleteWorkout, onAddBodyCheck, onDeleteBodyCheck 
}) => {
  const [activeTab, setActiveTab] = useState<'nutrition' | 'fitness'>('nutrition');
  
  // Daily Stats Local State
  const [weight, setWeight] = useState(dailyStats?.weight?.toString() || '');
  const [bodyFat, setBodyFat] = useState(dailyStats?.bodyFat?.toString() || '');
  const [note, setNote] = useState(dailyStats?.note || '');
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

  // Sync with props
  useEffect(() => {
    setWeight(dailyStats?.weight?.toString() || '');
    setBodyFat(dailyStats?.bodyFat?.toString() || '');
    setNote(dailyStats?.note || '');
  }, [dailyStats, date]);

  const handleStatsSave = () => {
    onUpdateDailyStats({
      date,
      weight: weight ? parseFloat(weight) : undefined,
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      note: note.trim() || undefined
    });
    setIsStatsExpanded(false);
  };

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

  // Fitness Data
  const todaysWorkouts = useMemo(() => workouts.filter(w => w.date === date), [workouts, date]);
  const todaysBodyChecks = useMemo(() => bodyChecks.filter(b => b.date === date), [bodyChecks, date]);

  const themeConfig = THEMES[theme];

  return (
    <div className="space-y-2">
      
      {/* Date Header */}
      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm transition-colors">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div className="flex-1">
           <h2 className="text-base font-bold text-gray-800 dark:text-white">{formatDateReadable(date)}</h2>
           <p className="text-xs text-gray-500 dark:text-gray-400">Daily Log</p>
        </div>
        <button 
          onClick={() => setIsStatsExpanded(!isStatsExpanded)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${dailyStats?.weight || dailyStats?.note ? `${themeConfig.lightBg} ${themeConfig.text}` : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}
        >
          {dailyStats?.weight ? `${dailyStats.weight}kg` : 'Record Stats'} ✏️
        </button>
      </div>

      {/* Daily Stats Section (Collapsible) */}
      {isStatsExpanded && (
        <div className={`bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border animate-fade-in border-gray-100 dark:border-gray-700 transition-colors`}>
          <div className="grid grid-cols-2 gap-3 mb-2">
             <div>
               <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Weight (kg)</label>
               <input 
                 type="number" step="0.1" placeholder="e.g. 70.5"
                 className={`w-full border rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                 value={weight}
                 onChange={e => setWeight(e.target.value)}
               />
             </div>
             <div>
               <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Body Fat (%)</label>
               <input 
                 type="number" step="0.1" placeholder="e.g. 15.5"
                 className={`w-full border rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                 value={bodyFat}
                 onChange={e => setBodyFat(e.target.value)}
               />
             </div>
          </div>
          <div className="mb-2">
             <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Journal / Notes</label>
             <textarea 
               rows={2}
               className={`w-full border rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
               placeholder="How did you feel today?"
               value={note}
               onChange={e => setNote(e.target.value)}
             />
          </div>
          <button 
            onClick={handleStatsSave}
            className={`w-full text-white py-1.5 rounded-lg text-sm font-bold hover:opacity-90 transition ${themeConfig.gradient} shadow-sm`}
          >
            Save Daily Stats
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors">
        <button 
          onClick={() => setActiveTab('nutrition')}
          className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 ${activeTab === 'nutrition' ? `${themeConfig.lightBg} ${themeConfig.text} border-b-2 border-current` : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
        >
          <span>🥗</span> Nutrition
        </button>
        <button 
           onClick={() => setActiveTab('fitness')}
           className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 ${activeTab === 'fitness' ? `${themeConfig.lightBg} ${themeConfig.text} border-b-2 border-current` : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
        >
          <span>💪</span> Fitness & Body
        </button>
      </div>

      {/* Content */}
      {activeTab === 'nutrition' ? (
        <div className="space-y-2 animate-fade-in">
             {/* Stats Cards */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm col-span-1 md:col-span-2 flex flex-col justify-center transition-colors">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <span className="text-2xl font-bold text-gray-800 dark:text-white">{Math.round(totalMacros.calories)}</span>
                            <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">/ {calorieGoal} kcal</span>
                        </div>
                        <div className="text-right">
                            <span className="block text-xs text-gray-500 dark:text-gray-400">Remaining</span>
                            <span className={`font-bold ${themeConfig.text}`}>{Math.round(remainingCalories)}</span>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div 
                            className={`${themeConfig.gradient} h-3 rounded-full transition-all duration-500 ease-in-out`} 
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-md">
                            <p className="text-[10px] text-blue-500 dark:text-blue-300 font-semibold uppercase">Carbs</p>
                            <p className="font-bold text-sm text-gray-700 dark:text-gray-200">{totalMacros.carbs.toFixed(1)}g</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-1.5 rounded-md">
                            <p className="text-[10px] text-emerald-500 dark:text-emerald-300 font-semibold uppercase">Protein</p>
                            <p className="font-bold text-sm text-gray-700 dark:text-gray-200">{totalMacros.protein.toFixed(1)}g</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/30 p-1.5 rounded-md">
                            <p className="text-[10px] text-red-500 dark:text-red-300 font-semibold uppercase">Fat</p>
                            <p className="font-bold text-sm text-gray-700 dark:text-gray-200">{totalMacros.fat.toFixed(1)}g</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-col items-center justify-center transition-colors">
                     <div className="w-full h-24">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} paddingAngle={5} dataKey="value" stroke="none">
                                    {pieData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.color} /> ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                                  itemStyle={{ color: '#F3F4F6' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="flex gap-2 text-[10px] mt-1 text-gray-600 dark:text-gray-300">
                         <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> C</span>
                         <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> P</span>
                         <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> F</span>
                     </div>
                </div>
             </div>

             {/* Food Log List */}
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-colors">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-bold text-sm text-gray-700 dark:text-gray-200">Food Log</h3>
                      <button onClick={onAddFood} className={`${themeConfig.gradient} text-white text-xs px-3 py-1.5 rounded-md shadow hover:opacity-90 transition`}>
                        + Add Food
                      </button>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {todaysLogs.length === 0 ? (
                          <div className="p-6 text-center text-xs text-gray-400">No meals tracked for this day.</div>
                      ) : (
                          todaysLogs.map(log => (
                              <div 
                                key={log.id} 
                                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center transition cursor-pointer group"
                                onClick={() => onEditLog(log)}
                              >
                                  <div className="flex items-center gap-3">
                                      {log.image ? (
                                        <img src={log.image} alt={log.name} className="w-10 h-10 rounded-md object-cover border border-gray-200 dark:border-gray-600" />
                                      ) : (
                                        <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg border border-gray-200 dark:border-gray-600">🍎</div>
                                      )}
                                      <div>
                                          <p className={`text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:${themeConfig.text} flex items-center gap-2`}>
                                            {log.name} 
                                          </p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round(log.calories)} kcal • P: {log.protein.toFixed(1)}g</p>
                                      </div>
                                  </div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteLog(log.id); }} 
                                    className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 p-1 transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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
             theme={theme}
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
