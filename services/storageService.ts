
import { UserProfile, FoodLogItem, SavedFoodItem, WorkoutLogItem, BodyCheckItem, DataBackup, DailyStats } from '../types';
import { DB, STORES } from './db';

const CURRENT_USER_ID_KEY = 'nutritrack_current_user_id';

export const StorageService = {
  // Users
  getUsers: async (): Promise<UserProfile[]> => {
    return await DB.getAll<UserProfile>(STORES.USERS);
  },

  saveUser: async (user: UserProfile): Promise<void> => {
    await DB.put(STORES.USERS, user);
  },

  deleteUser: async (userId: string): Promise<void> => {
    await DB.delete(STORES.USERS, userId);
  },

  // Session (Still in LocalStorage for sync access if needed, but we mostly pass user obj)
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

  getLogs: async (userId: string): Promise<FoodLogItem[]> => {
    return await DB.getAll<FoodLogItem>(STORES.LOGS, 'userId', userId);
  },

  addLog: async (userId: string, log: FoodLogItem): Promise<void> => {
    const logWithUser = { ...log, userId };
    await DB.put(STORES.LOGS, logWithUser);
  },

  updateLog: async (userId: string, updatedLog: FoodLogItem): Promise<void> => {
    const logWithUser = { ...updatedLog, userId };
    await DB.put(STORES.LOGS, logWithUser);
  },

  deleteLog: async (userId: string, logId: string): Promise<void> => {
    await DB.delete(STORES.LOGS, logId);
  },

  // --- Workout Logs ---

  getWorkouts: async (userId: string): Promise<WorkoutLogItem[]> => {
    return await DB.getAll<WorkoutLogItem>(STORES.WORKOUTS, 'userId', userId);
  },

  addWorkout: async (userId: string, item: WorkoutLogItem): Promise<void> => {
    await DB.put(STORES.WORKOUTS, { ...item, userId });
  },

  deleteWorkout: async (userId: string, id: string): Promise<void> => {
    await DB.delete(STORES.WORKOUTS, id);
  },

  // --- Body Checks ---

  getBodyChecks: async (userId: string): Promise<BodyCheckItem[]> => {
    return await DB.getAll<BodyCheckItem>(STORES.BODY_CHECKS, 'userId', userId);
  },

  addBodyCheck: async (userId: string, item: BodyCheckItem): Promise<void> => {
    await DB.put(STORES.BODY_CHECKS, { ...item, userId });
  },

  deleteBodyCheck: async (userId: string, id: string): Promise<void> => {
    await DB.delete(STORES.BODY_CHECKS, id);
  },

  // --- Daily Stats (Weight / Note) ---

  getDailyStats: async (userId: string): Promise<DailyStats[]> => {
    // In IDB we store with ID = userId_date. 
    // We fetch all by userId index.
    return await DB.getAll<DailyStats>(STORES.DAILY_STATS, 'userId', userId);
  },

  saveDailyStats: async (userId: string, stats: DailyStats): Promise<void> => {
    const id = `${userId}_${stats.date}`;
    await DB.put(STORES.DAILY_STATS, { ...stats, id, userId });
  },

  // --- Personal Food Database ---

  getSavedFoods: async (userId: string): Promise<SavedFoodItem[]> => {
    const foods = await DB.getAll<SavedFoodItem>(STORES.SAVED_FOODS, 'userId', userId);
    return foods.sort((a, b) => b.timesUsed - a.timesUsed);
  },

  saveFoodToDatabase: async (userId: string, item: Omit<SavedFoodItem, 'id' | 'timesUsed'>): Promise<void> => {
    const foods = await StorageService.getSavedFoods(userId);
    const existing = foods.find(f => f.name.toLowerCase() === item.name.toLowerCase());

    if (existing) {
      await DB.put(STORES.SAVED_FOODS, {
        ...existing,
        ...item,
        timesUsed: (existing.timesUsed || 0) + 1,
        userId
      });
    } else {
      const newItem: SavedFoodItem & { userId: string } = {
        ...item,
        id: Math.random().toString(36).substring(2, 9),
        timesUsed: 1,
        userId
      };
      await DB.put(STORES.SAVED_FOODS, newItem);
    }
  },

  // --- Backup / Restore ---
  
  createBackup: async (): Promise<string> => {
    const users = await DB.getAll<UserProfile>(STORES.USERS);
    const logsArr = await DB.getAll<FoodLogItem & {userId: string}>(STORES.LOGS);
    const workoutsArr = await DB.getAll<WorkoutLogItem & {userId: string}>(STORES.WORKOUTS);
    const bodyChecksArr = await DB.getAll<BodyCheckItem & {userId: string}>(STORES.BODY_CHECKS);
    const savedFoodsArr = await DB.getAll<SavedFoodItem & {userId: string}>(STORES.SAVED_FOODS);
    const dailyStatsArr = await DB.getAll<DailyStats & {userId: string}>(STORES.DAILY_STATS);

    // Group by UserID for the JSON format (to match old structure roughly or just dump flat lists)
    // To minimize complexity, we'll group them so restore logic is cleaner
    const groupBy = (arr: any[]) => {
      return arr.reduce((acc, curr) => {
        const uid = curr.userId;
        if (!acc[uid]) acc[uid] = [];
        acc[uid].push(curr);
        return acc;
      }, {});
    };

    const backup: DataBackup = {
      version: 3, // IDB Version
      users: users,
      logs: groupBy(logsArr),
      workouts: groupBy(workoutsArr),
      bodyChecks: groupBy(bodyChecksArr),
      savedFoods: groupBy(savedFoodsArr),
      dailyStats: groupBy(dailyStatsArr),
    };
    return JSON.stringify(backup, null, 2);
  },

  restoreBackup: async (jsonString: string): Promise<boolean> => {
    try {
      const data: DataBackup = JSON.parse(jsonString);
      if (!data.users) return false;

      // Clear existing DB? Or Merge? Let's Clear to be safe on restore
      await DB.clear(STORES.USERS);
      await DB.clear(STORES.LOGS);
      await DB.clear(STORES.WORKOUTS);
      await DB.clear(STORES.BODY_CHECKS);
      await DB.clear(STORES.SAVED_FOODS);
      await DB.clear(STORES.DAILY_STATS);

      // Restore Users
      for (const u of data.users) await DB.put(STORES.USERS, u);

      // Helper to flatten record to array with userId
      const restoreStore = async (store: string, record: Record<string, any[]>) => {
        if (!record) return;
        for (const [uid, items] of Object.entries(record)) {
          for (const item of items) {
            // Ensure userId is present (backup from V2 might have it in key only)
            // For DailyStats, ensure ID is present
            if (store === STORES.DAILY_STATS && !item.id) {
               item.id = `${uid}_${item.date}`;
            }
            await DB.put(store, { ...item, userId: uid });
          }
        }
      };

      await restoreStore(STORES.LOGS, data.logs);
      await restoreStore(STORES.WORKOUTS, data.workouts);
      await restoreStore(STORES.BODY_CHECKS, data.bodyChecks);
      await restoreStore(STORES.SAVED_FOODS, data.savedFoods);
      await restoreStore(STORES.DAILY_STATS, data.dailyStats);
      
      return true;
    } catch (e) {
      console.error("Restore failed", e);
      return false;
    }
  }
};
