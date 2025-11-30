
import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { NotificationService } from './services/notificationService';
import { UserProfile, FoodLogItem, MacroNutrients, WorkoutLogItem, BodyCheckItem, IngredientItem, DailyStats, ThemeColor } from './types';
import { THEMES } from './utils/theme';
import { generateId, getTodayDateString, calculateBMR, calculateTDEE, calculateTargetCalories } from './utils/calculations';
import ProfileForm from './components/ProfileForm';
import Dashboard from './components/Dashboard'; 
import CalendarView from './components/CalendarView';
import FoodLogger from './components/FoodLogger';
import StatisticsView from './components/StatisticsView';

const THEME_KEY = 'nutritrack_theme';
const DARK_MODE_KEY = 'nutritrack_dark_mode';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  // App Settings
  const [theme, setTheme] = useState<ThemeColor>('emerald');
  const [darkMode, setDarkMode] = useState(false);

  // Data States
  const [logs, setLogs] = useState<FoodLogItem[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutLogItem[]>([]);
  const [bodyChecks, setBodyChecks] = useState<BodyCheckItem[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  
  // View States
  const [viewMode, setViewMode] = useState<'calendar' | 'day' | 'stats'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  
  // UI States
  const [showMenu, setShowMenu] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Modal States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [isCreatingNewUser, setIsCreatingNewUser] = useState(false);
  const [editingLog, setEditingLog] = useState<FoodLogItem | null>(null);

  // Initial Load
  useEffect(() => {
    loadAllData();

    // Load Theme
    const savedTheme = localStorage.getItem(THEME_KEY) as ThemeColor;
    if (savedTheme && THEMES[savedTheme]) setTheme(savedTheme);

    // Load Dark Mode
    const savedDarkMode = localStorage.getItem(DARK_MODE_KEY);
    if (savedDarkMode === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedDarkMode === 'false') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
       // System preference default
       if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setDarkMode(true);
          document.documentElement.classList.add('dark');
       }
    }

    // Start Notification Scheduler (Check every minute)
    const notificationInterval = setInterval(() => {
      NotificationService.checkAndTriggerReminders();
    }, 60000); // 60 seconds

    // Immediate check on load
    NotificationService.checkAndTriggerReminders();

    return () => clearInterval(notificationInterval);
  }, []);

  // Check notification status when menu opens
  useEffect(() => {
    if (showMenu) {
      setNotificationsEnabled(NotificationService.isEnabled());
    }
  }, [showMenu]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const loadedUsers = await StorageService.getUsers();
      setUsers(loadedUsers);
      
      const currentId = StorageService.getCurrentUserId();
      if (currentId) {
        const user = loadedUsers.find(u => u.id === currentId);
        if (user) await loginUser(user);
      }
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (user: UserProfile) => {
    setCurrentUser(user);
    StorageService.setCurrentUserId(user.id);
    
    // Load User Data Async
    const [l, w, b, d] = await Promise.all([
      StorageService.getLogs(user.id),
      StorageService.getWorkouts(user.id),
      StorageService.getBodyChecks(user.id),
      StorageService.getDailyStats(user.id)
    ]);

    setLogs(l);
    setWorkouts(w);
    setBodyChecks(b);
    setDailyStats(d);
    
    setIsEditingProfile(false);
    setIsCreatingNewUser(false);
    setViewMode('calendar');
  };

  const logoutUser = () => {
    setCurrentUser(null);
    StorageService.setCurrentUserId(null);
    setLogs([]);
    setWorkouts([]);
    setBodyChecks([]);
    setDailyStats([]);
    setShowMenu(false);
  };

  // --- Actions ---

  const handleToggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem(DARK_MODE_KEY, String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSaveTheme = (newTheme: ThemeColor) => {
    setTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  };

  const handleSaveProfile = async (profile: UserProfile) => {
    setLoading(true);
    await StorageService.saveUser(profile);
    const updatedUsers = await StorageService.getUsers();
    setUsers(updatedUsers);
    await loginUser(profile);
    setLoading(false);
  };

  const handleUpdateDailyStats = async (stats: DailyStats) => {
    if (!currentUser) return;

    // 1. Save Stats
    await StorageService.saveDailyStats(currentUser.id, stats);
    
    // 2. Update Local State
    setDailyStats(prev => {
      const index = prev.findIndex(s => s.date === stats.date);
      if (index >= 0) {
        const newStats = [...prev];
        newStats[index] = stats;
        return newStats;
      }
      return [...prev, stats];
    });

    // 3. Dynamic TDEE Update (Only if weight changed for TODAY)
    const todayStr = getTodayDateString();
    if (stats.date === todayStr && stats.weight && stats.weight !== currentUser.weight) {
      const newWeight = stats.weight;
      
      // Recalculate Logic
      const bmr = calculateBMR(newWeight, currentUser.height, currentUser.age, currentUser.gender);
      const tdee = calculateTDEE(bmr, currentUser.activityLevel);
      const targetCalories = calculateTargetCalories(tdee, currentUser.goal);

      const updatedUser: UserProfile = {
        ...currentUser,
        weight: newWeight,
        tdee,
        targetCalories
      };

      // Save updated user profile
      await StorageService.saveUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);
    }
  };

  const handleExportData = async () => {
    const data = await StorageService.createBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutritrack-backup-${getTodayDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShowMenu(false);
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
    // Don't close menu immediately so they can see the toggle switch state
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setViewMode('day');
  };

  // --- Food Logic ---

  const handleAddLog = async (name: string, macros: MacroNutrients, image?: string, ingredients?: IngredientItem[]) => {
    if (!currentUser) return;
    const newLog: FoodLogItem = {
      id: generateId(),
      name,
      ...macros,
      image,
      ingredients,
      timestamp: Date.now(),
      date: selectedDate // Use selected date, not just today
    };
    await StorageService.addLog(currentUser.id, newLog);
    setLogs(prev => [...prev, newLog]);
    setIsAddingFood(false);
  };

  const handleEditLog = (log: FoodLogItem) => {
    setEditingLog(log);
    setIsAddingFood(true);
  };

  const handleUpdateLog = async (updatedLog: FoodLogItem) => {
    if (!currentUser) return;
    await StorageService.updateLog(currentUser.id, updatedLog);
    setLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
    setIsAddingFood(false);
    setEditingLog(null);
  };

  const handleDeleteLog = async (logId: string) => {
    if (!currentUser) return;
    await StorageService.deleteLog(currentUser.id, logId);
    setLogs(prev => prev.filter(l => l.id !== logId));
  };

  // --- Workout Logic ---

  const handleAddWorkout = async (item: WorkoutLogItem) => {
    if (!currentUser) return;
    await StorageService.addWorkout(currentUser.id, item);
    setWorkouts(prev => [...prev, item]);
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!currentUser) return;
    await StorageService.deleteWorkout(currentUser.id, id);
    setWorkouts(prev => prev.filter(w => w.id !== id));
  };

  // --- Body Check Logic ---

  const handleAddBodyCheck = async (item: BodyCheckItem) => {
    if (!currentUser) return;
    await StorageService.addBodyCheck(currentUser.id, item);
    setBodyChecks(prev => [...prev, item]);
  };

  const handleDeleteBodyCheck = async (id: string) => {
    if (!currentUser) return;
    await StorageService.deleteBodyCheck(currentUser.id, id);
    setBodyChecks(prev => prev.filter(b => b.id !== id));
  };

  // --- Renders ---

  const currentTheme = THEMES[theme];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center">
           <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4`}></div>
           <p className="text-gray-500 dark:text-gray-400 font-medium">Initializing Database...</p>
        </div>
      </div>
    );
  }

  // 1. Auth / Login Screen
  if (!currentUser && !isCreatingNewUser) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md transition-colors">
          <div className="text-center mb-8">
            <div className={`bg-emerald-100 dark:bg-emerald-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <span className="text-3xl">🥗</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">NutriTrack AI</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Track Food • Workouts • Progress</p>
          </div>

          {users.length > 0 && (
            <div className="space-y-4 mb-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Profile</h2>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {users.map(user => (
                  <button 
                    key={user.id}
                    onClick={() => loginUser(user)}
                    className={`w-full text-left px-4 py-3 border rounded-xl dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition flex items-center justify-between group`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg text-gray-400">👤</div>
                        )}
                      </div>
                      <span className={`font-medium text-gray-700 dark:text-gray-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400`}>{user.name}</span>
                    </div>
                    <span className={`text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-1 rounded-full`}>{user.goal.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <button 
            onClick={() => setIsCreatingNewUser(true)}
            className={`w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 dark:shadow-none`}
          >
            Create New Profile
          </button>
          
          <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
             <p>Data stored locally (IndexedDB).</p>
             <p>Backup regularly using the export feature.</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Profile Screen
  if (isCreatingNewUser || isEditingProfile) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4">
        <ProfileForm 
          initialData={isEditingProfile ? currentUser : null}
          onSave={handleSaveProfile}
          onCancel={() => {
            if (isEditingProfile) setIsEditingProfile(false);
            else setIsCreatingNewUser(false);
            setShowMenu(false);
          }}
        />
      </div>
    );
  }

  // 3. Main Application (Calendar / Day / Stats)
  const renderMainContent = () => {
    switch (viewMode) {
      case 'stats':
        return (
          <StatisticsView 
            user={currentUser}
            logs={logs}
            dailyStats={dailyStats}
            onBack={() => setViewMode('calendar')}
            theme={theme}
          />
        );
      case 'day':
        return (
          <Dashboard 
            user={currentUser}
            date={selectedDate}
            logs={logs}
            workouts={workouts}
            bodyChecks={bodyChecks}
            dailyStats={dailyStats.find(s => s.date === selectedDate)}
            theme={theme}
            onUpdateDailyStats={handleUpdateDailyStats}
            onBack={() => setViewMode('calendar')}
            onDeleteLog={handleDeleteLog}
            onAddFood={() => {
              setEditingLog(null);
              setIsAddingFood(true);
            }}
            onEditLog={handleEditLog}
            onAddWorkout={handleAddWorkout}
            onDeleteWorkout={handleDeleteWorkout}
            onAddBodyCheck={handleAddBodyCheck}
            onDeleteBodyCheck={handleDeleteBodyCheck}
          />
        );
      case 'calendar':
      default:
        return (
          <CalendarView 
            user={currentUser}
            logs={logs}
            workouts={workouts}
            bodyChecks={bodyChecks}
            dailyStats={dailyStats}
            selectedDate={selectedDate}
            theme={theme}
            onSelectDate={handleDateSelect}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors duration-300">
      <nav className={`${currentTheme.gradient} shadow-md sticky top-0 z-30 transition-all duration-300`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setViewMode('calendar')}>
            <span className="text-2xl drop-shadow-sm">🥗</span>
            <span className="font-bold text-lg md:text-xl tracking-tight drop-shadow-sm">NutriTrack</span>
          </div>
          {currentUser && (
             <div className="relative">
                <button 
                   onClick={() => setShowMenu(!showMenu)}
                   className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 backdrop-blur-sm overflow-hidden focus:outline-none hover:bg-white/30 transition shadow-sm"
                >
                   {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg text-white">👤</div>
                   )}
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10 cursor-default" onClick={() => setShowMenu(false)}></div>
                    <div className="absolute right-0 top-full mt-3 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-20 py-2 animate-fade-in overflow-hidden transition-colors">
                      <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700 mb-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">Menu</p>
                      </div>

                      {/* Dark Mode Toggle */}
                      <button 
                        onClick={handleToggleDarkMode}
                        className={`w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:${currentTheme.lightBg} flex items-center justify-between gap-3 transition`}
                      >
                         <div className="flex items-center gap-3">
                           <span>{darkMode ? '🌙' : '☀️'}</span>
                           <span>Dark Mode</span>
                         </div>
                         <div className={`w-10 h-5 rounded-full relative transition-colors ${darkMode ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${darkMode ? 'left-6' : 'left-1'}`}></div>
                         </div>
                      </button>
                      
                      {/* Theme Picker */}
                      <div className="px-4 py-3">
                         <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Theme Style</p>
                         <div className="grid grid-cols-4 gap-2">
                            {(Object.keys(THEMES) as ThemeColor[]).map((c) => (
                              <button
                                key={c}
                                onClick={() => handleSaveTheme(c)}
                                className={`w-full aspect-square rounded-full border-2 transition relative overflow-hidden ${theme === c ? 'border-gray-600 dark:border-gray-300 scale-105 shadow-md' : 'border-transparent hover:scale-105'}`}
                                title={THEMES[c].name}
                              >
                                <div className={`absolute inset-0 ${THEMES[c].gradient}`}></div>
                              </button>
                            ))}
                         </div>
                      </div>

                      <div className="border-t border-gray-50 dark:border-gray-700 my-1"></div>
                      
                      <button 
                        onClick={() => { setShowMenu(false); setViewMode('stats'); }}
                        className={`w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:${currentTheme.lightBg} flex items-center gap-3 transition`}
                      >
                        <span>📈</span> Trends & Analytics
                      </button>
                      
                      <button 
                        onClick={() => { setShowMenu(false); setIsEditingProfile(true); }}
                        className={`w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:${currentTheme.lightBg} flex items-center gap-3 transition`}
                      >
                        <span>✏️</span> Edit Profile
                      </button>

                      <button 
                        onClick={handleToggleNotifications}
                        className={`w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:${currentTheme.lightBg} flex items-center gap-3 transition`}
                      >
                        <span>{notificationsEnabled ? '🔕' : '🔔'}</span> 
                        {notificationsEnabled ? 'Disable Reminders' : 'Enable Reminders'}
                      </button>
                      
                      <button 
                        onClick={handleExportData}
                        className={`w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:${currentTheme.lightBg} flex items-center gap-3 transition`}
                      >
                        <span>💾</span> Backup Data
                      </button>
                      
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                      
                      <button 
                        onClick={logoutUser}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition font-medium"
                      >
                        <span>🚪</span> Logout
                      </button>
                    </div>
                  </>
                )}
             </div>
          )}
        </div>
      </nav>

      <main className="p-4">
        {currentUser && renderMainContent()}
      </main>

      {/* Food Logger Modal */}
      {isAddingFood && currentUser && (
        <FoodLogger 
          userId={currentUser.id}
          initialLog={editingLog}
          onAdd={handleAddLog}
          onUpdate={handleUpdateLog}
          onCancel={() => {
            setIsAddingFood(false);
            setEditingLog(null);
          }}
        />
      )}
    </div>
  );
};

export default App;
