
import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { UserProfile, FoodLogItem, MacroNutrients, WorkoutLogItem, BodyCheckItem } from './types';
import { generateId, getTodayDateString } from './utils/calculations';
import ProfileForm from './components/ProfileForm';
import Dashboard from './components/Dashboard'; // This is now Day Detail View
import CalendarView from './components/CalendarView';
import FoodLogger from './components/FoodLogger';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  // Data States
  const [logs, setLogs] = useState<FoodLogItem[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutLogItem[]>([]);
  const [bodyChecks, setBodyChecks] = useState<BodyCheckItem[]>([]);
  
  // View States
  const [viewMode, setViewMode] = useState<'calendar' | 'day'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  
  // Modal States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [isCreatingNewUser, setIsCreatingNewUser] = useState(false);

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    const loadedUsers = StorageService.getUsers();
    setUsers(loadedUsers);
    
    const currentId = StorageService.getCurrentUserId();
    if (currentId) {
      const user = loadedUsers.find(u => u.id === currentId);
      if (user) loginUser(user);
    }
  };

  const loginUser = (user: UserProfile) => {
    setCurrentUser(user);
    StorageService.setCurrentUserId(user.id);
    
    // Load User Data
    setLogs(StorageService.getLogs(user.id));
    setWorkouts(StorageService.getWorkouts(user.id));
    setBodyChecks(StorageService.getBodyChecks(user.id));
    
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
  };

  // --- Actions ---

  const handleSaveProfile = (profile: UserProfile) => {
    StorageService.saveUser(profile);
    const updatedUsers = StorageService.getUsers();
    setUsers(updatedUsers);
    loginUser(profile);
  };

  const handleExportData = () => {
    const data = StorageService.createBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutritrack-backup-${getTodayDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setViewMode('day');
  };

  const handleAddLog = (name: string, macros: MacroNutrients, image?: string) => {
    if (!currentUser) return;
    const newLog: FoodLogItem = {
      id: generateId(),
      name,
      ...macros,
      image,
      timestamp: Date.now(),
      date: selectedDate // Use selected date, not just today
    };
    StorageService.addLog(currentUser.id, newLog);
    setLogs(prev => [...prev, newLog]);
    setIsAddingFood(false);
  };

  const handleDeleteLog = (logId: string) => {
    if (!currentUser) return;
    StorageService.deleteLog(currentUser.id, logId);
    setLogs(prev => prev.filter(l => l.id !== logId));
  };

  const handleAddWorkout = (item: WorkoutLogItem) => {
    if (!currentUser) return;
    StorageService.addWorkout(currentUser.id, item);
    setWorkouts(prev => [...prev, item]);
  };

  const handleDeleteWorkout = (id: string) => {
    if (!currentUser) return;
    StorageService.deleteWorkout(currentUser.id, id);
    setWorkouts(prev => prev.filter(w => w.id !== id));
  };

  const handleAddBodyCheck = (item: BodyCheckItem) => {
    if (!currentUser) return;
    StorageService.addBodyCheck(currentUser.id, item);
    setBodyChecks(prev => [...prev, item]);
  };

  const handleDeleteBodyCheck = (id: string) => {
    if (!currentUser) return;
    StorageService.deleteBodyCheck(currentUser.id, id);
    setBodyChecks(prev => prev.filter(b => b.id !== id));
  };

  // --- Renders ---

  // 1. Auth / Login Screen
  if (!currentUser && !isCreatingNewUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🥗</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">NutriTrack AI</h1>
            <p className="text-gray-500 mt-2">Track Food • Workouts • Progress</p>
          </div>

          {users.length > 0 && (
            <div className="space-y-4 mb-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Profile</h2>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {users.map(user => (
                  <button 
                    key={user.id}
                    onClick={() => loginUser(user)}
                    className="w-full text-left px-4 py-3 border rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
                        )}
                      </div>
                      <span className="font-medium text-gray-700 group-hover:text-emerald-700">{user.name}</span>
                    </div>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{user.goal.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <button 
            onClick={() => setIsCreatingNewUser(true)}
            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
          >
            Create New Profile
          </button>
          
          <div className="mt-8 text-center text-xs text-gray-400">
             <p>Data stored locally in browser.</p>
             <p>Backup regularly using the export feature.</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Profile Screen
  if (isCreatingNewUser || isEditingProfile) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <ProfileForm 
          initialData={isEditingProfile ? currentUser : null}
          onSave={handleSaveProfile}
          onCancel={() => {
            if (isEditingProfile) setIsEditingProfile(false);
            else setIsCreatingNewUser(false);
          }}
        />
      </div>
    );
  }

  // 3. Main Application (Calendar or Day View)
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setViewMode('calendar')}>
            <span className="text-2xl">🥗</span>
            <span className="font-bold text-gray-800 tracking-tight">NutriTrack</span>
          </div>
          {currentUser && (
             <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden cursor-pointer" onClick={() => setViewMode('calendar')}>
                {currentUser.avatar ? (
                   <img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center">👤</div>
                )}
             </div>
          )}
        </div>
      </nav>

      <main className="p-4">
        {currentUser && (
          viewMode === 'calendar' ? (
            <CalendarView 
              user={currentUser}
              logs={logs}
              workouts={workouts}
              bodyChecks={bodyChecks}
              onSelectDate={handleDateSelect}
              onEditProfile={() => setIsEditingProfile(true)}
              onLogout={logoutUser}
              onExport={handleExportData}
            />
          ) : (
            <Dashboard 
              user={currentUser}
              date={selectedDate}
              logs={logs}
              workouts={workouts}
              bodyChecks={bodyChecks}
              onBack={() => setViewMode('calendar')}
              onDeleteLog={handleDeleteLog}
              onAddFood={() => setIsAddingFood(true)}
              onAddWorkout={handleAddWorkout}
              onDeleteWorkout={handleDeleteWorkout}
              onAddBodyCheck={handleAddBodyCheck}
              onDeleteBodyCheck={handleDeleteBodyCheck}
            />
          )
        )}
      </main>

      {/* Food Logger Modal */}
      {isAddingFood && currentUser && (
        <FoodLogger 
          userId={currentUser.id}
          onAdd={handleAddLog}
          onCancel={() => setIsAddingFood(false)}
        />
      )}
    </div>
  );
};

export default App;
