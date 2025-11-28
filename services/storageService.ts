
import { UserProfile, FoodLogItem, SavedFoodItem, WorkoutLogItem, BodyCheckItem, DataBackup } from '../types';

const USERS_KEY = 'nutritrack_users';
const LOGS_KEY = 'nutritrack_logs';
const SAVED_FOODS_KEY = 'nutritrack_saved_foods';
const CURRENT_USER_ID_KEY = 'nutritrack_current_user_id';
const WORKOUTS_KEY = 'nutritrack_workouts';
const BODY_CHECKS_KEY = 'nutritrack_body_checks';

// Helper for Record<string, T[]> parsing
const getRecord = <T>(key: string): Record<string, T[]> => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : {};
};

const saveRecord = <T>(key: string, data: Record<string, T[]>) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const StorageService = {
  getUsers: (): UserProfile[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveUser: (user: UserProfile): void => {
    const users = StorageService.getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  deleteUser: (userId: string): void => {
    const users = StorageService.getUsers();
    const newUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
  },

  getCurrentUserId: (): string | null => {
    return localStorage.getItem(CURRENT_USER_ID_KEY);
  },

  setCurrentUserId: (id: string | null): void => {
    if (id) {
      localStorage.setItem(CURRENT_USER_ID_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_USER_ID_KEY);
    }
  },

  // --- Food Logs ---

  getLogs: (userId: string): FoodLogItem[] => {
    const parsedLogs = getRecord<FoodLogItem>(LOGS_KEY);
    return parsedLogs[userId] || [];
  },

  addLog: (userId: string, log: FoodLogItem): void => {
    const parsedLogs = getRecord<FoodLogItem>(LOGS_KEY);
    if (!parsedLogs[userId]) parsedLogs[userId] = [];
    parsedLogs[userId].push(log);
    saveRecord(LOGS_KEY, parsedLogs);
  },

  updateLog: (userId: string, updatedLog: FoodLogItem): void => {
    const parsedLogs = getRecord<FoodLogItem>(LOGS_KEY);
    if (parsedLogs[userId]) {
      const index = parsedLogs[userId].findIndex(l => l.id === updatedLog.id);
      if (index !== -1) {
        parsedLogs[userId][index] = updatedLog;
        saveRecord(LOGS_KEY, parsedLogs);
      }
    }
  },

  deleteLog: (userId: string, logId: string): void => {
    const parsedLogs = getRecord<FoodLogItem>(LOGS_KEY);
    if (parsedLogs[userId]) {
      parsedLogs[userId] = parsedLogs[userId].filter(l => l.id !== logId);
      saveRecord(LOGS_KEY, parsedLogs);
    }
  },

  // --- Workout Logs ---

  getWorkouts: (userId: string): WorkoutLogItem[] => {
    const parsed = getRecord<WorkoutLogItem>(WORKOUTS_KEY);
    return parsed[userId] || [];
  },

  addWorkout: (userId: string, item: WorkoutLogItem): void => {
    const parsed = getRecord<WorkoutLogItem>(WORKOUTS_KEY);
    if (!parsed[userId]) parsed[userId] = [];
    parsed[userId].push(item);
    saveRecord(WORKOUTS_KEY, parsed);
  },

  deleteWorkout: (userId: string, id: string): void => {
    const parsed = getRecord<WorkoutLogItem>(WORKOUTS_KEY);
    if (parsed[userId]) {
      parsed[userId] = parsed[userId].filter(x => x.id !== id);
      saveRecord(WORKOUTS_KEY, parsed);
    }
  },

  // --- Body Checks ---

  getBodyChecks: (userId: string): BodyCheckItem[] => {
    const parsed = getRecord<BodyCheckItem>(BODY_CHECKS_KEY);
    return parsed[userId] || [];
  },

  addBodyCheck: (userId: string, item: BodyCheckItem): void => {
    const parsed = getRecord<BodyCheckItem>(BODY_CHECKS_KEY);
    if (!parsed[userId]) parsed[userId] = [];
    parsed[userId].push(item);
    saveRecord(BODY_CHECKS_KEY, parsed);
  },

  deleteBodyCheck: (userId: string, id: string): void => {
    const parsed = getRecord<BodyCheckItem>(BODY_CHECKS_KEY);
    if (parsed[userId]) {
      parsed[userId] = parsed[userId].filter(x => x.id !== id);
      saveRecord(BODY_CHECKS_KEY, parsed);
    }
  },

  // --- Personal Food Database ---

  getSavedFoods: (userId: string): SavedFoodItem[] => {
    const parsed = getRecord<SavedFoodItem>(SAVED_FOODS_KEY);
    return parsed[userId] || [];
  },

  saveFoodToDatabase: (userId: string, item: Omit<SavedFoodItem, 'id' | 'timesUsed'>): void => {
    const parsed = getRecord<SavedFoodItem>(SAVED_FOODS_KEY);
    if (!parsed[userId]) parsed[userId] = [];
    
    const existingIndex = parsed[userId].findIndex(f => f.name.toLowerCase() === item.name.toLowerCase());
    
    if (existingIndex >= 0) {
      parsed[userId][existingIndex] = {
        ...parsed[userId][existingIndex],
        ...item,
        timesUsed: (parsed[userId][existingIndex].timesUsed || 0) + 1
      };
    } else {
      parsed[userId].push({
        ...item,
        id: Math.random().toString(36).substring(2, 9),
        timesUsed: 1
      });
    }
    
    parsed[userId].sort((a, b) => b.timesUsed - a.timesUsed);
    saveRecord(SAVED_FOODS_KEY, parsed);
  },

  // --- Backup / Restore ---
  
  createBackup: (): string => {
    const backup: DataBackup = {
      version: 1,
      users: StorageService.getUsers(),
      logs: getRecord<FoodLogItem>(LOGS_KEY),
      workouts: getRecord<WorkoutLogItem>(WORKOUTS_KEY),
      bodyChecks: getRecord<BodyCheckItem>(BODY_CHECKS_KEY),
      savedFoods: getRecord<SavedFoodItem>(SAVED_FOODS_KEY),
    };
    return JSON.stringify(backup, null, 2);
  },

  restoreBackup: (jsonString: string): boolean => {
    try {
      const data: DataBackup = JSON.parse(jsonString);
      if (!data.users || !data.logs) return false;

      localStorage.setItem(USERS_KEY, JSON.stringify(data.users));
      localStorage.setItem(LOGS_KEY, JSON.stringify(data.logs));
      if (data.workouts) localStorage.setItem(WORKOUTS_KEY, JSON.stringify(data.workouts));
      if (data.bodyChecks) localStorage.setItem(BODY_CHECKS_KEY, JSON.stringify(data.bodyChecks));
      if (data.savedFoods) localStorage.setItem(SAVED_FOODS_KEY, JSON.stringify(data.savedFoods));
      
      return true;
    } catch (e) {
      console.error("Restore failed", e);
      return false;
    }
  }
};
