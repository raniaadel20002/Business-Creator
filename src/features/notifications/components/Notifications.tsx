import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Trash2, 
  CheckCheck, 
  MessageSquare, 
  Sparkles, 
  Palette, 
  Coins, 
  ArrowUpRight, 
  ShieldAlert, 
  ExternalLink,
  Shield,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { UserNotification } from '../../../types/types';
import { 
  subscribeToNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification 
} from '../services/notificationService';

interface NotificationsProps {
  onNavigate?: (view: any) => void;
}

export default function Notifications({ onNavigate }: NotificationsProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToNotifications(user.id, (data) => {
      setNotifications(Array.isArray(data) ? data : []);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user?.id]);

  const handleDelete = async (id: string) => {
    if (!id) return;
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await deleteNotification(id);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const formatDate = (isoString?: any) => {
    if (!isoString) return '';
    try {
      const date = isoString?.toDate ? isoString.toDate() : new Date(isoString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return '';
    }
  };

  const getNotificationStyles = (type?: string) => {
    switch (type) {
      case 'balance_depleted':
        return {
          icon: Coins,
          iconClass: 'text-amber-600',
          borderClass: 'border-amber-100',
        };
      case 'recharge_renew':
        return {
          icon: ArrowUpRight,
          iconClass: 'text-green-600',
          borderClass: 'border-green-100',
        };
      case 'project_created':
        return {
          icon: Sparkles,
          iconClass: 'text-orange-600',
          borderClass: 'border-orange-100',
        };
      case 'logo_created':
        return {
          icon: Palette,
          iconClass: 'text-blue-600',
          borderClass: 'border-blue-100',
        };
      case 'feedback_submitted':
        return {
          icon: MessageSquare,
          iconClass: 'text-purple-600',
          borderClass: 'border-purple-100',
        };
      case 'error':
        return {
          icon: ShieldAlert,
          iconClass: 'text-red-600',
          borderClass: 'border-red-100',
        };
      case 'support_reply':
        return {
          icon: Shield,
          iconClass: 'text-orange-600',
          borderClass: 'border-orange-100',
        };
      default:
        return {
          icon: Bell,
          iconClass: 'text-gray-600',
          borderClass: 'border-gray-100',
        };
    }
  };

  const unreadCount = (notifications || []).filter(n => n && !n.read).length;

  return (
    <div className="w-full max-w-4xl mx-auto" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl shadow-orange-500/5 border border-orange-50/60 p-6 md:p-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 mb-6 border-b border-gray-100">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100/80">
              <Bell size={26} className="stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">مركز الإشعارات</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">تابع تحديثات مشاريعك، رصيدك، ورسائل الإدارة الرسمية</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {unreadCount > 0 && user?.id && (
              <button
                onClick={() => {
                  setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                  markAllNotificationsAsRead(user.id);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-orange-100"
              >
                <CheckCheck size={15} />
                <span>تحديد الكل كمقروء ({unreadCount})</span>
              </button>
            )}

            {onNavigate && (
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200/60"
              >
                <span>الرئيسية</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center text-gray-500 font-bold flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            <span className="text-xs">جاري تحميل الإشعارات...</span>
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="py-16 text-center max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 mx-auto">
              <Bell size={32} className="stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">سجل الإشعارات فارغ</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              ستظهر هنا كافة التنبيهات الخاصة بترقية حسابك وتحديثات مشاريعك وتأكيدات عملياتك.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {notifications.map((notif) => {
              if (!notif) return null;
              const styles = getNotificationStyles(notif.type);
              const IconComp = styles.icon;

              return (
                <div
                  key={notif.id || Math.random().toString()}
                  onClick={() => notif.id && !notif.read && markNotificationAsRead(notif.id)}
                  className={`p-4 md:p-5 rounded-2xl border transition-all flex flex-col md:flex-row gap-4 items-start md:items-center ${
                    notif.read ? 'bg-white hover:bg-gray-50/50' : 'bg-orange-50/30 border-orange-100/90 shadow-sm shadow-orange-500/5'
                  } ${styles.borderClass}`}
                >
                  {/* Official Company Logo Avatar */}
                  {notif.isOfficial || notif.type === 'support_reply' ? (
                    <div className="w-10 h-10 rounded-2xl bg-white border border-orange-200/90 flex items-center justify-center p-1.5 shrink-0 shadow-sm relative overflow-visible">
                      <img 
                        src="/logoo.png" 
                        alt="Business Creator" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="absolute -bottom-1 -left-1 bg-blue-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[7px] border-2 border-white font-black" title="حساب رسمي موثق">✓</span>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center">
                      <IconComp size={20} className={`${styles.iconClass} stroke-[2]`} />
                    </div>
                  )}

                  {/* Body */}
                  <div className="flex-1 space-y-1 text-right">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-gray-900 text-sm md:text-base">
                        {notif.title || 'إشعار جديد'}
                      </h4>
                      {(notif.isOfficial || notif.type === 'support_reply') && (
                        <span className="inline-flex items-center gap-1 bg-orange-100/70 border border-orange-200 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-md">
                          <span>Business Creator</span>
                          <span className="text-blue-500 font-bold" title="حساب رسمي موثق">✓</span>
                        </span>
                      )}
                      {!notif.read && (
                        <span className="px-2 py-0.5 bg-orange-600 text-white rounded-full text-[9px] font-black leading-none">
                          جديد
                        </span>
                      )}
                    </div>
                    
                    {notif.message && (
                      <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-medium">
                        {notif.message}
                      </p>
                    )}

                    {notif.createdAt && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 pt-0.5">
                        <Clock size={11} />
                        <span>{formatDate(notif.createdAt)}</span>
                      </span>
                    )}

                    {/* Navigation actions based on notification type */}
                    {(notif.type === 'project_created' || notif.type === 'logo_created') && onNavigate && (
                      <div className="pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (notif.id && !notif.read) {
                              markNotificationAsRead(notif.id);
                            }
                            onNavigate('saved-plans');
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer border-none"
                        >
                          <span>عرض في مشاريعي</span>
                        </button>
                      </div>
                    )}

                    {notif.type === 'recharge_renew' && onNavigate && (
                      <div className="pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (notif.id && !notif.read) {
                              markNotificationAsRead(notif.id);
                            }
                            onNavigate('profile');
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer border-none"
                        >
                          <span>عرض في الملف الشخصي</span>
                        </button>
                      </div>
                    )}

                    {/* WhatsApp CTA */}
                    {notif.suggestWhatsApp && (
                      <div className="pt-2 flex flex-wrap gap-2 items-center">
                        <a
                          href="https://wa.me/201034927416"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageSquare size={13} />
                          <span>تحدث معنا عبر واتساب</span>
                          <ExternalLink size={11} />
                        </a>
                        <span className="text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                          فريق الدعم مستعد لمساعدتك فوراً!
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 self-end md:self-center shrink-0">
                    {notif.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notif.id!);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                        title="حذف الإشعار"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
