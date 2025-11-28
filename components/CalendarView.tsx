
import React, { useState } from 'react';
import { getMonthDays, getMonthName } from '../utils/dateUtils';
import { FoodLogItem, WorkoutLogItem, BodyCheckItem, UserProfile, DailyStats } from '../types';

interface CalendarViewProps {
  user: UserProfile;
  logs: FoodLogItem[];
  workouts: WorkoutLogItem[];
  bodyChecks: BodyCheckItem[];
  dailyStats: DailyStats[];
  onSelectDate: (date: string) => void;
  onEditProfile: () => void;
  onLogout: () => void;
  onExport: () => void;
  onViewStats: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  user, logs, workouts, bodyChecks, dailyStats, onSelectDate, onEditProfile, onLogout, onExport, onViewStats 
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

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      
      {/* Header Profile Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           {/* Avatar */}
           <div className="w-16 h-16 rounded-full bg-gray-200 border-2 border-emerald-100 flex-shrink-0 overflow-hidden">
             {user.avatar ? (
               <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
             )}
           </div>
           
           <div>
              <h1 className="text-2xl font-bold text-gray-800">Hi, {user.name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                 <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold uppercase">{user.goal}</span>
                 <span>•</span>
                 <span>Target: <span className="font-semibold text-gray-700">{user.targetCalories} kcal</span></span>
              </div>
           </div>
        </div>

        <div className="flex gap-2 flex-wrap justify-center md:justify-end">
           <button onClick={onViewStats} className="text-sm border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-50 transition flex items-center gap-1">
             Trends 📈
           </button>
           <button onClick={onEditProfile} className="text-sm border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-50 transition">
             Edit Profile
           </button>
           <button onClick={onExport} className="text-sm border border-blue-200 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition">
             Backup
           </button>
           <button onClick={onLogout} className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
             Logout
           </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
           <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
           </button>
           <h2 className="text-lg font-bold text-gray-800">{getMonthName(currentMonth)} {currentYear}</h2>
           <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
           </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 text-center mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-xs font-semibold text-gray-400 uppercase">{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
           {days.map((dateStr, index) => {
             if (!dateStr) return <div key={`empty-${index}`} className="aspect-square"></div>;
             
             const date = new Date(dateStr);
             const isToday = new Date().toDateString() === date.toDateString();
             const dayNum = date.getDate();
             const stats = getDayStats(dateStr);

             return (
               <button 
                 key={dateStr}
                 onClick={() => onSelectDate(dateStr)}
                 className={`
                   relative aspect-square rounded-xl border flex flex-col items-center justify-start pt-2 transition
                   ${isToday ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' : 'border-gray-100 hover:border-emerald-300 bg-white hover:bg-gray-50'}
                 `}
               >
                 <span className={`text-sm font-medium ${isToday ? 'text-emerald-700' : 'text-gray-700'}`}>{dayNum}</span>
                 
                 {/* Indicators */}
                 <div className="flex gap-0.5 mt-1 flex-wrap justify-center px-1">
                    {stats.hasWorkout && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Workout"></div>}
                    {stats.hasPhoto && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" title="Body Check"></div>}
                    {stats.hasWeight && <span className="text-[8px] leading-none" title="Weight Recorded">⚖️</span>}
                    {stats.hasNote && <span className="text-[8px] leading-none" title="Note Recorded">📝</span>}
                 </div>

                 {stats.calories > 0 && (
                   <div className={`mt-auto mb-1 text-[10px] font-bold px-1 rounded ${stats.isGoalMet ? 'text-green-600 bg-green-100' : 'text-gray-500 bg-gray-100'}`}>
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
