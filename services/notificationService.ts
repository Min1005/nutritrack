
export const NOTIFICATION_KEYS = {
  NOON: 'noon',
  EVENING: 'evening'
};

const PREF_KEY = 'nutritrack_notifications_enabled';

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
    // Enabled if permission is granted AND user hasn't explicitly disabled it in app
    return Notification.permission === 'granted' && localStorage.getItem(PREF_KEY) !== 'false';
  },

  setPreference: (enable: boolean) => {
    localStorage.setItem(PREF_KEY, String(enable));
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
        icon: 'https://cdn-icons-png.flaticon.com/512/2921/2921822.png', // App Icon
        badge: 'https://cdn-icons-png.flaticon.com/512/2921/2921822.png',
        tag: 'nutritrack-reminder' // Prevents duplicate notifications stacking
      });
    }
  },

  checkAndTriggerReminders: () => {
    // Check the comprehensive isEnabled status (Permission + Preference)
    if (!NotificationService.isEnabled()) return;

    const now = new Date();
    const hour = now.getHours();
    const dateStr = now.toDateString(); // e.g., "Fri Nov 29 2024"

    // Keys to track if sent today
    const noonKey = `notif_sent_${dateStr}_${NOTIFICATION_KEYS.NOON}`;
    const eveningKey = `notif_sent_${dateStr}_${NOTIFICATION_KEYS.EVENING}`;

    // Logic for Noon (12:00 - 12:59)
    if (hour === 12) {
      if (!localStorage.getItem(noonKey)) {
        NotificationService.sendNotification(
          "🥗 Lunch Time!",
          "Don't forget to log your lunch to keep your streak going!"
        );
        localStorage.setItem(noonKey, 'true');
      }
    }

    // Logic for Evening (19:00 - 19:59)
    if (hour === 19) {
      if (!localStorage.getItem(eveningKey)) {
        NotificationService.sendNotification(
          "🍽️ Dinner Time!",
          "Time to record your dinner. How are your macros looking?"
        );
        localStorage.setItem(eveningKey, 'true');
      }
    }
  }
};
