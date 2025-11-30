import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import { UserProfile, FoodLogItem, DailyStats } from '../types';

interface StatisticsViewProps {
  user: UserProfile;
  logs: FoodLogItem[];
  dailyStats: DailyStats[];
  onBack: () => void;
}

type TimeRange = '7' | '30' | '90';

const StatisticsView: React.FC<StatisticsViewProps> = ({ user, logs, dailyStats, onBack }) => {
  const [range, setRange] = useState<TimeRange>('30');

  const data = useMemo(() => {
    const days = parseInt(range);
    const result = [];
    const today = new Date();
    
    // Generate dates for the selected range
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // 1. Get Weight for this day
      const stat = dailyStats.find(s => s.date === dateStr);
      
      // 2. Get Total Calories for this day
      const dayLogs = logs.filter(l => l.date === dateStr);
      const totalCalories = dayLogs.reduce((acc, curr) => acc + curr.calories, 0);

      result.push({
        date: dateStr,
        displayDate,
        weight: stat?.weight || null, // Allow null for connected line
        calories: totalCalories || 0,
        goal: user.targetCalories,
        tdee: user.tdee
      });
    }
    return result;
  }, [range, logs, dailyStats, user]);

  // Calculate some summary stats
  const averageCals = Math.round(data.reduce((acc, curr) => acc + curr.calories, 0) / data.length);
  const recordedWeights = data.filter(d => d.weight !== null).map(d => d.weight as number);
  const minWeight = recordedWeights.length ? Math.min(...recordedWeights) : 0;
  const maxWeight = recordedWeights.length ? Math.max(...recordedWeights) : 0;
  
  // Dynamic Y-axis domain for weight to make the chart look better
  const weightDomain = [Math.floor(minWeight - 1), Math.ceil(maxWeight + 1)];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm transition-colors">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div className="flex-1">
           <h2 className="text-xl font-bold text-gray-800 dark:text-white">Trends & Analytics</h2>
           <p className="text-xs text-gray-500 dark:text-gray-400">Track your progress over time</p>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg transition-colors">
           {(['7', '30', '90'] as TimeRange[]).map(r => (
             <button
               key={r}
               onClick={() => setRange(r)}
               className={`px-3 py-1 text-xs font-bold rounded-md transition ${range === r ? 'bg-white dark:bg-gray-600 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
             >
               {r} Days
             </button>
           ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-emerald-50 dark:border-emerald-900/30 transition-colors">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Avg Calories</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{averageCals}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Target: {user.targetCalories}</p>
         </div>
         <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-blue-50 dark:border-blue-900/30 transition-colors">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Latest Weight</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{recordedWeights.length > 0 ? recordedWeights[recordedWeights.length - 1] : user.weight} <span className="text-sm">kg</span></p>
         </div>
         <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-purple-50 dark:border-purple-900/30 transition-colors">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Weight Change</p>
            <p className={`text-2xl font-bold ${recordedWeights.length > 1 ? (recordedWeights[recordedWeights.length - 1] - recordedWeights[0] < 0 ? 'text-green-500' : 'text-red-500') : 'text-gray-600 dark:text-gray-400'}`}>
              {recordedWeights.length > 1 ? (recordedWeights[recordedWeights.length - 1] - recordedWeights[0]).toFixed(1) : '0'} <span className="text-sm">kg</span>
            </p>
         </div>
         <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-orange-50 dark:border-orange-900/30 transition-colors">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Log Streak</p>
            <p className="text-2xl font-bold text-orange-500">{data.filter(d => d.calories > 0).length} <span className="text-sm">days</span></p>
         </div>
      </div>

      {/* Weight Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-colors">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <span>⚖️</span> Weight Trend
        </h3>
        <div className="h-64 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.3} />
               <XAxis 
                 dataKey="displayDate" 
                 tick={{fontSize: 10, fill: '#9CA3AF'}} 
                 tickMargin={10} 
                 minTickGap={30}
                 axisLine={{stroke: '#e5e7eb', opacity: 0.3}}
                 tickLine={false}
               />
               <YAxis 
                 domain={weightDomain} 
                 tick={{fontSize: 10, fill: '#9CA3AF'}} 
                 unit="kg"
                 axisLine={{stroke: '#e5e7eb', opacity: 0.3}}
                 tickLine={false}
               />
               <Tooltip 
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#1F2937', color: '#F3F4F6' }}
                 itemStyle={{ color: '#F3F4F6' }}
                 formatter={(value: number) => [`${value} kg`, 'Weight']}
               />
               <Line 
                 type="monotone" 
                 dataKey="weight" 
                 stroke="#4F46E5" 
                 strokeWidth={3} 
                 dot={{r: 4, strokeWidth: 2, fill: '#4F46E5'}} 
                 activeDot={{r: 6}}
                 connectNulls 
               />
             </LineChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* Calorie Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-colors">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <span>🔥</span> Calorie History
        </h3>
        <div className="h-64 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.3} />
               <XAxis 
                 dataKey="displayDate" 
                 tick={{fontSize: 10, fill: '#9CA3AF'}} 
                 tickMargin={10} 
                 minTickGap={30}
                 axisLine={{stroke: '#e5e7eb', opacity: 0.3}}
                 tickLine={false}
               />
               <YAxis 
                 tick={{fontSize: 10, fill: '#9CA3AF'}}
                 axisLine={{stroke: '#e5e7eb', opacity: 0.3}}
                 tickLine={false}
               />
               <Tooltip 
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#1F2937', color: '#F3F4F6' }}
                 itemStyle={{ color: '#F3F4F6' }}
               />
               <Legend wrapperStyle={{fontSize: '12px', color: '#9CA3AF'}} />
               
               <Bar dataKey="calories" fill="#34D399" radius={[4, 4, 0, 0]} name="Intake" barSize={20} />
               
               {/* Goal Line */}
               <Line 
                 type="step" 
                 dataKey="goal" 
                 stroke="#F87171" 
                 strokeWidth={2} 
                 dot={false} 
                 name="Target" 
                 strokeDasharray="5 5"
               />
             </ComposedChart>
           </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default StatisticsView;