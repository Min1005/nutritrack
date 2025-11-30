
import React, { useState, useEffect } from 'react';
import { getMonthDays, getMonthName } from '../utils/dateUtils';
import { FoodLogItem, WorkoutLogItem, BodyCheckItem, UserProfile, DailyStats } from '../types';
import { NotificationService } from '../services/notificationService';

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
  const [showMenu, setShowMenu] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    // Check status on mount
    setNotificationsEnabled(NotificationService.isEnabled());
  }, [showMenu]); // Re-check when menu opens

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

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      // User wants to disable
      NotificationService.setPreference(false);
      setNotificationsEnabled(false);
    } else {
      // User wants to enable
      const granted = await NotificationService.requestPermission();
      if (granted) {
        NotificationService.setPreference(true);
        setNotificationsEnabled(true);
        alert("Reminders enabled! You will be notified at 12:00 PM and 7:00 PM.");
      } else {
        alert("Permission denied. Please enable notifications in your browser settings.");
      }
    }
    setShowMenu(false);
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
      <div className="bg-white p-6 rounded-xl shadow-sm flex items-center justify-between relative z-10">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Hi, {user.name}</h1>
           <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold uppercase">{user.goal}</span>
              <span>•</span>
              <span>Target: <span className="font-semibold text-gray-700">{user.targetCalories} kcal</span></span>
           </div>
        </div>

        {/* User Avatar & Dropdown */}
        <div className="relative">
           <button 
             onClick={() => setShowMenu(!showMenu)}
             className="w-14 h-14 rounded-full bg-gray-200 border-2 border-emerald-100 flex items-center justify-center overflow-hidden focus:outline-none focus:ring-4 focus:ring-emerald-50 transition shadow-sm hover:shadow-md"
           >
             {user.avatar ? (
               <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
             ) : (
               <div className="text-2xl">👤</div>
             )}
           </button>

           {/* Dropdown Menu */}
           {showMenu && (
             <>
               <div className="fixed inset-0 z-10 cursor-default" onClick={() => setShowMenu(false)}></div>
               <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-2 animate-fade-in overflow-hidden">
                 <div className="px-4 py-2 border-b border-gray-50 mb-1">
                    <p className="text-xs font-bold text-gray-400 uppercase">Menu</p>
                 </div>
                 
                 <button 
                   onClick={() => { setShowMenu(false); onViewStats(); }}
                   className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-3 transition"
                 >
                   <span>📈</span> Trends & Analytics
                 </button>
                 
                 <button 
                   onClick={() => { setShowMenu(false); onEditProfile(); }}
                   className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-3 transition"
                 >
                   <span>✏️</span> Edit Profile
                 </button>

                 <button 
                   onClick={handleToggleNotifications}
                   className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-3 transition"
                 >
                   <span>{notificationsEnabled ? '🔕' : '🔔'}</span> 
                   {notificationsEnabled ? 'Disable Reminders' : 'Enable Reminders'}
                 </button>
                 
                 <button 
                   onClick={() => { setShowMenu(false); onExport(); }}
                   className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-3 transition"
                 >
                   <span>💾</span> Backup Data
                 </button>
                 
                 <div className="border-t border-gray-100 my-1"></div>
                 
                 <button 
                   onClick={() => { setShowMenu(false); onLogout(); }}
                   className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition font-medium"
                 >
                   <span>🚪</span> Logout
                 </button>
               </div>
             </>
           )}
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
           <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
           </button>
           <h2 className="text-lg font-bold text-gray-800">{getMonthName(currentMonth)} {currentYear}</h2>
           <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
           </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 text-center mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{d}</div>
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
                   ${isToday ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100' : 'border-gray-100 hover:border-emerald-300 bg-white hover:bg-gray-50'}
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
                   <div className={`mt-auto mb-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${stats.isGoalMet ? 'text-green-700 bg-green-100' : 'text-gray-500 bg-gray-100'}`}>
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