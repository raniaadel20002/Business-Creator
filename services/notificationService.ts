import { supabase } from '../supabase';
import { UserNotification } from '../types';

const LOCAL_STORAGE_KEY_PREFIX = 'bc_notifications_v2_';

// Helper to get local notifications
const getLocalNotifications = (userId: string): UserNotification[] => {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

// Helper to save local notifications
const saveLocalNotifications = (userId: string, notifs: UserNotification[]) => {
  if (!userId) return;
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(notifs.slice(0, 100)));
    window.dispatchEvent(new CustomEvent('bc_notifications_changed', { detail: { userId } }));
  } catch (e) {
    console.warn("Could not save to local notification storage", e);
  }
};

/**
 * Creates a persistent notification for a specific user.
 * Writes to Supabase and saves locally for guaranteed delivery.
 */
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: UserNotification['type'] = 'info',
  suggestWhatsApp: boolean = false,
  isOfficial: boolean = false
) => {
  if (!userId) return;

  const newNotifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const timestamp = new Date().toISOString();

  const newLocalNotif: UserNotification = {
    id: newNotifId,
    userId,
    title,
    message,
    type: type || 'info',
    suggestWhatsApp: Boolean(suggestWhatsApp),
    read: false,
    isOfficial: Boolean(isOfficial),
    createdAt: timestamp,
  };

  // 1. Instantly save to local user sync
  try {
    const existing = getLocalNotifications(userId);
    saveLocalNotifications(userId, [newLocalNotif, ...existing]);
  } catch (e) {
    console.warn("Local notification save warning:", e);
  }

  // 2. Insert into Supabase table
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type: type || 'info',
      suggest_whats_app: Boolean(suggestWhatsApp),
      read: false,
      is_official: Boolean(isOfficial),
      created_at: timestamp,
    });

    if (error) {
      console.warn("Supabase notification insert warning (saved in local store):", error.message);
    } else {
      console.log(`Notification registered successfully for user ${userId}: ${title}`);
    }
  } catch (err) {
    console.warn("Network or Supabase error during notification insert:", err);
  }
};

/**
 * Subscribes to real-time notifications for a user.
 * Merges Supabase records and local store seamlessly.
 */
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: UserNotification[]) => void
): (() => void) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  let isSubscribed = true;

  const fetchAndMergeNotifications = async () => {
    if (!isSubscribed) return;
    const localList = getLocalNotifications(userId);

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!isSubscribed) return;

      const remoteList = (!error && data && Array.isArray(data)) ? data.map(mapDbToNotification) : [];

      // Merge and deduplicate by id or title+timestamp
      const combinedMap = new Map<string, UserNotification>();

      // Put remote first
      remoteList.forEach(item => {
        if (item.id) combinedMap.set(item.id, item);
        else combinedMap.set(`${item.title}_${item.createdAt}`, item);
      });

      // Overlay local
      localList.forEach(item => {
        const key = item.id || `${item.title}_${item.createdAt}`;
        if (!combinedMap.has(key)) {
          combinedMap.set(key, item);
        }
      });

      const merged = Array.from(combinedMap.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      callback(merged);
    } catch (err) {
      if (!isSubscribed) return;
      callback(localList);
    }
  };

  fetchAndMergeNotifications();

  // 1. Supabase Realtime channel
  let channel: any = null;
  try {
    channel = supabase
      .channel(`notifications_feed:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchAndMergeNotifications();
        }
      )
      .subscribe();
  } catch (e) {
    console.warn("Could not attach Supabase realtime channel for notifications", e);
  }

  // 2. Custom local event listener
  const handleLocalChange = (e: any) => {
    if (!e.detail || e.detail.userId === userId) {
      fetchAndMergeNotifications();
    }
  };
  window.addEventListener('bc_notifications_changed', handleLocalChange);

  // 3. Fallback polling
  const interval = setInterval(() => {
    fetchAndMergeNotifications();
  }, 6000);

  return () => {
    isSubscribed = false;
    window.removeEventListener('bc_notifications_changed', handleLocalChange);
    clearInterval(interval);
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (e) {}
    }
  };
};

/**
 * Marks a single notification as read.
 */
export const markNotificationAsRead = async (notificationId: string, userId?: string) => {
  if (!notificationId) return;

  // Local update
  if (userId) {
    const localList = getLocalNotifications(userId);
    const updated = localList.map(n => n.id === notificationId ? { ...n, read: true } : n);
    saveLocalNotifications(userId, updated);
  }

  // Remote update
  try {
    if (!notificationId.startsWith('local-') && !notificationId.startsWith('notif-')) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
    }
  } catch (error) {
    console.warn("Failed to mark notification as read remotely:", error);
  }
};

/**
 * Marks all unread notifications of a user as read.
 */
export const markAllNotificationsAsRead = async (userId: string) => {
  if (!userId) return;

  // Local update
  const localList = getLocalNotifications(userId);
  const updated = localList.map(n => ({ ...n, read: true }));
  saveLocalNotifications(userId, updated);

  // Remote update
  try {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
  } catch (error) {
    console.warn("Failed to mark all notifications as read remotely:", error);
  }
};

/**
 * Deletes a single notification.
 */
export const deleteNotification = async (notificationId: string, userId?: string) => {
  if (!notificationId) return;

  // Local delete
  if (userId) {
    const localList = getLocalNotifications(userId);
    const updated = localList.filter(n => n.id !== notificationId);
    saveLocalNotifications(userId, updated);
  }

  // Remote delete
  try {
    if (!notificationId.startsWith('local-') && !notificationId.startsWith('notif-')) {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
    }
  } catch (err) {
    console.warn("Exception in deleteNotification:", err);
  }
};

// ---- Mapping helper with full null-safety ----
function mapDbToNotification(row: any): UserNotification {
  if (!row) {
    return {
      id: '',
      userId: '',
      title: '',
      message: '',
      type: 'info',
      createdAt: new Date().toISOString(),
      read: false
    };
  }

  return {
    id: row.id || '',
    userId: row.user_id || row.userId || '',
    title: row.title || 'إشعار',
    message: row.message || '',
    type: row.type || 'info',
    suggestWhatsApp: Boolean(row.suggest_whats_app || row.suggestWhatsApp),
    read: Boolean(row.read),
    isOfficial: Boolean(row.is_official || row.isOfficial),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}
