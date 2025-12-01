
export const NOTIFICATION_KEYS = {
  NOON: 'lunch',
  EVENING: 'dinner'
};

const PREF_KEY = 'nutritrack_notifications_enabled';
const LUNCH_TIME_KEY = 'nutritrack_reminder_lunch';
const DINNER_TIME_KEY = 'nutritrack_reminder_dinner';

export const NotificationService = {
  isSupported: (): boolean => {
    return 'Notification' in window;
  },

  getPermission: (): NotificationPermission => {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  },

  // Checks both Browser Permission AND User Preference
  isEnabled: (): boolean => {
    if (!('Notification' in window)) return false;
    return Notification.permission === 'granted' && localStorage.getItem(PREF_KEY) !== 'false';
  },

  setPreference: (enable: boolean) => {
    localStorage.setItem(PREF_KEY, String(enable));
  },

  getReminderTimes: () => {
    return {
      lunch: localStorage.getItem(LUNCH_TIME_KEY) || '12:00',
      dinner: localStorage.getItem(DINNER_TIME_KEY) || '19:00'
    };
  },

  setReminderTimes: (lunch: string, dinner: string) => {
    localStorage.setItem(LUNCH_TIME_KEY, lunch);
    localStorage.setItem(DINNER_TIME_KEY, dinner);
  },

  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  sendNotification: (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/2921/2921822.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/2921/2921822.png',
        tag: 'nutritrack-reminder'
      });
    }
  },

  checkAndTriggerReminders: () => {
    if (!NotificationService.isEnabled()) return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const dateStr = now.toDateString(); 

    const { lunch, dinner } = NotificationService.getReminderTimes();
    
    // Parse Times
    const [lunchH, lunchM] = lunch.split(':').map(Number);
    const [dinnerH, dinnerM] = dinner.split(':').map(Number);

    const checkTime = (targetH: number, targetM: number, keySuffix: string, title: string, body: string) => {
       const key = `notif_sent_${dateStr}_${keySuffix}`;
       if (localStorage.getItem(key)) return; // Already sent today

       // Check if current time is past target time but within the same hour window (to catch up if opened late)
       // Or strictly matches. Let's do: if (hour == targetH && minute >= targetM)
       // To avoid re-triggering hours later, we restrict to the specific hour of the reminder.
       if (currentHour === targetH && currentMinute >= targetM) {
          NotificationService.sendNotification(title, body);
          localStorage.setItem(key, 'true');
       }
    };

    checkTime(lunchH, lunchM, NOTIFICATION_KEYS.NOON, "🥗 Lunch Time!", "Don't forget to log your lunch to keep your streak going!");
    checkTime(dinnerH, dinnerM, NOTIFICATION_KEYS.EVENING, "🍽️ Dinner Time!", "Time to record your dinner. How are your macros looking?");
  }
};
