
import React, { useState } from 'react';
import { getMonthDays, getMonthName } from '../utils/dateUtils';
import { FoodLogItem, WorkoutLogItem, BodyCheckItem, UserProfile, DailyStats, ThemeColor } from '../types';
import { THEMES } from '../utils/theme';

interface CalendarViewProps {
  user: UserProfile;
  logs: FoodLogItem[];
  workouts: WorkoutLogItem[];
  bodyChecks: BodyCheckItem[];
  dailyStats: DailyStats[];
  selectedDate: string;
  theme: ThemeColor;
  onSelectDate: (date: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  user, logs, workouts, bodyChecks, dailyStats, selectedDate, theme, onSelectDate 
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const days = getMonthDays(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getDayStats = (dateStr: string) => {
    const dayLogs = logs.filter(l => l.date === dateStr);
    const dayWorkouts = workouts.filter(w => w.date === dateStr);
    const dayChecks = bodyChecks.filter(b => b.date === dateStr);
    const dayStats = dailyStats.find(s => s.date === dateStr);
    
    const totalCals = dayLogs.reduce((acc, curr) => acc + curr.calories, 0);
    
    return {
      hasData: dayLogs.length > 0 || dayWorkouts.length > 0 || dayChecks.length > 0 || !!dayStats,
      calories: totalCals,
      hasWorkout: dayWorkouts.length > 0,
      hasPhoto: dayChecks.length > 0,
      hasWeight: !!dayStats?.weight,
      hasNote: !!dayStats?.note,
      isGoalMet: totalCals > 0 && Math.abs(totalCals - user.targetCalories) < 200 // Within 200 cal range
    };
  };

  const themeConfig = THEMES[theme];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header Profile Card */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm flex items-center justify-between relative z-10 border border-gray-100 dark:border-gray-700 transition-colors">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Hi, {user.name}</h1>
           <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${themeConfig.lightBg} ${themeConfig.text}`}>{user.goal}</span>
              <span>•</span>
              <span>Target: <span className="font-semibold text-gray-700 dark:text-gray-300">{user.targetCalories} kcal</span></span>
           </div>
        </div>

        {/* User Avatar (Static) */}
        <div className={`w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 border-2 flex items-center justify-center overflow-hidden border-gray-100 dark:border-gray-600`}>
           {user.avatar ? (
             <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
           ) : (
             <div className="text-2xl">👤</div>
           )}
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex justify-between items-center mb-6 px-2">
           <button onClick={prevMonth} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
           </button>
           <h2 className="text-xl font-bold text-gray-800 dark:text-white">{getMonthName(currentMonth)} {currentYear}</h2>
           <button onClick={nextMonth} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
           </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 text-center mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <div 
              key={d} 
              className={`text-xs font-medium uppercase tracking-wider ${i === 0 ? 'text-red-400 dark:text-red-400' : i === 6 ? 'text-blue-400 dark:text-blue-400' : 'text-gray-300 dark:text-gray-500'}`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-3 md:gap-4">
           {days.map(({ date: dateStr, isCurrentMonth }, index) => {
             const date = new Date(dateStr);
             const isSelected = dateStr === selectedDate;
             const dayNum = date.getDate();
             const stats = getDayStats(dateStr);

             // Dynamic Theme Classes for Selected State
             const selectedStyle = `${themeConfig.activeClass} scale-105 z-10 font-bold border-transparent`;
             
             // Muted style for adjacent months
             const normalStyle = isCurrentMonth 
               ? "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent hover:border-gray-100 dark:hover:border-gray-600" 
               : "bg-gray-50/50 dark:bg-gray-900/50 text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent";

             return (
               <button 
                 key={dateStr}
                 onClick={() => onSelectDate(dateStr)}
                 className={`
                   relative aspect-square rounded-2xl flex flex-col items-center justify-start pt-2 transition-all duration-300 border
                   ${isSelected ? selectedStyle : normalStyle}
                 `}
               >
                 <span className="text-sm">{dayNum}</span>
                 
                 {/* Indicators */}
                 <div className="flex gap-1 mt-1.5 flex-wrap justify-center px-1">
                    {/* Workout: Blue usually, or Theme color if selected? Let's keep distinct colors for types. */}
                    {stats.hasWorkout && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/80' : 'bg-blue-400'}`} title="Workout"></div>}
                    
                    {/* Body Check: Indigo/Camera */}
                    {stats.hasPhoto && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/80' : 'bg-indigo-400'}`} title="Body Check"></div>}
                    
                    {/* Stats/Note: Purple */}
                    {(stats.hasWeight || stats.hasNote) && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/80' : 'bg-purple-400'}`} title="Weight/Note"></div>}
                 </div>

                 {stats.calories > 0 && (
                   <div className={`mt-auto mb-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : stats.isGoalMet ? 'text-emerald-700 bg-emerald-100/50 dark:bg-emerald-900/50 dark:text-emerald-300' : 'text-gray-400 bg-gray-100 dark:bg-gray-700 dark:text-gray-400'}`}>
                     {stats.calories}
                   </div>
                 )}
               </button>
             );
           })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
