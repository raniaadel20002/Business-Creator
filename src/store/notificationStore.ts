import { create } from 'zustand';

export interface GlobalNotification {
  id: string;
  title: string;
  message: string;
  type: 'chat_message' | 'generate_plan' | 'complete_pro' | 'generate_logo' | 'info' | 'error';
  actionLabel: string;
  onAction: () => void;
  createdAt: number;
}

interface NotificationStore {
  notifications: GlobalNotification[];
  unreadNotificationsCount: number;
  addGlobalNotification: (notification: Omit<GlobalNotification, 'createdAt'>) => void;
  dismissNotification: (id: string) => void;
  setUnreadNotificationsCount: (count: number) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadNotificationsCount: 0,

  addGlobalNotification: (notification) =>
    set((state) => {
      if (state.notifications.some((n) => n.id === notification.id)) return state;
      return {
        notifications: [{ ...notification, createdAt: Date.now() }, ...state.notifications],
      };
    }),

  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  setUnreadNotificationsCount: (count) => set({ unreadNotificationsCount: count }),

  clearAll: () => set({ notifications: [], unreadNotificationsCount: 0 }),
}));
