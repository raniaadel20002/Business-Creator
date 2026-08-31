import React, { useState, useEffect } from 'react';
import { supabase, handleSupabaseError } from '../../../services/supabase';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Calendar, 
  Search, 
  Filter, 
  ArrowRight, 
  Activity, 
  ShieldAlert, 
  Cpu, 
  Eye, 
  Clock, 
  User as UserIcon,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  X,
  Database,
  Check,
  MessageCircle,
  Trash2,
  Ban,
  Download,
  Settings,
  Shield,
  Layers,
  BarChart3,
  Mail,
  Send,
  UserCheck,
  AlertCircle,
  Award,
  Coins,
  CreditCard,
  Sparkles,
  CheckCircle2,
  LogIn,
  LogOut,
  Palette,
  Lightbulb,
  MessageSquare,
  Radio,
  Compass,
  ExternalLink,
  Smartphone,
  MapPin,
  CheckCircle
} from 'lucide-react';
import { ActivityLog, BusinessPlan, UserProfile } from '../../../types/types';
import { createNotification } from '../../../services/notificationService';
import { adminUpgradeUserAccount } from '../../../../server/services/payments/tempPaymentService';
import { ErrorTracker } from '../server/services/telemetry/errorTracker';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

function formatArabicDateTime(dateStr?: string | null): string {
  if (!dateStr) return 'غير مسجل';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'غير مسجل';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    const timeStr = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    if (diffMs < 0 || diffMins < 2) return 'متواجد الآن 🟢';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة (${timeStr})`;
    if (diffHours < 24 && d.getDate() === now.getDate()) return `اليوم ${timeStr}`;
    if (diffDays === 1) return `أمس ${timeStr}`;
    return `${d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })} - ${timeStr}`;
  } catch {
    return 'غير مسجل';
  }
}

interface Stats {
  totalUsers: number;
  proUsersCount: number;
  freeUsersCount: number;
  totalProjects: number;
  activeProjects: number;
  proProjectsCount: number;
  totalLogosCount: number;
  totalMessagesCount: number;
  onlineUsersCount: number;
  tokenUsage: number;
  totalPaymentRequests: number;
  pendingPaymentsCount: number;
  recentProjects: any[];
  recentUsers: any[];
  logs: ActivityLog[];
  feedbacks: any[];
  chatSessions: any[];
  registrationData: { labels: string[], data: number[] };
  auditFlags: any[];
}

type TabType = 'overview' | 'payments' | 'users' | 'projects' | 'feedbacks' | 'security';

interface AdminCardHeaderProps {
  icon: React.ComponentType<{ size: number; className?: string }>;
  title: string;
  countLabel: string;
  count: number;
}

const AdminCardHeader: React.FC<AdminCardHeaderProps> = ({ icon: Icon, title, countLabel, count }) => (
  <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
    <h3 className="font-bold text-sm text-white flex items-center gap-2">
      <Icon size={14} className="text-[#FF7E01]" />
      {title}
    </h3>
    <span className="bg-[#FF7E01]/10 text-[#FF7E01] text-[10px] px-2 py-0.5 rounded-full font-bold">
      {countLabel}: {count}
    </span>
  </div>
);

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  
  // Selection States
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectOwner, setProjectOwner] = useState<UserProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedAuditAlert, setSelectedAuditAlert] = useState<any>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [userModalTab, setUserModalTab] = useState<'overview' | 'questionnaire' | 'projects' | 'chats' | 'logs'>('overview');

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination States
  const [usersPage, setUsersPage] = useState(1);
  const [projectsPage, setProjectsPage] = useState(1);
  const [feedbacksPage, setFeedbacksPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Reset pagination pages on search or tab change to keep view valid
  useEffect(() => {
    setUsersPage(1);
    setProjectsPage(1);
    setFeedbacksPage(1);
    setPaymentsPage(1);
    setLogsPage(1);
  }, [searchQuery, activeTab]);

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      // 1. Fetch Users
      const { data: usersData, error: usersError } = await supabase.from('users').select('*');
      if (usersError) handleSupabaseError(usersError, 'LIST', 'users');

      // 2. Fetch Projects
      const { data: projectsData, error: projError } = await supabase.from('projects').select('*');
      if (projError) handleSupabaseError(projError, 'LIST', 'projects');

      // 3. Fetch Chat Sessions
      const { data: chatSessionsData } = await supabase.from('chat_sessions').select('*');

      // 4. Fetch Logs - limit 500
      const { data: logsData } = await supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500);

      const localErrors = ErrorTracker.getLocalErrors().map(err => ({
        id: err.id || `loc-${err.timestamp}`,
        action: `[CLIENT LOG] ${err.context}: ${err.errorMessage}`,
        details: err.metadata || {},
        timestamp: err.timestamp,
        userId: err.userId || 'client',
        userName: 'Client Runtime',
        userEmail: err.userEmail || 'telemetry@local',
      } as ActivityLog));

      const logs = [...localErrors, ...(logsData || []).map((d: any) => ({
        ...d,
        userId: d.user_id,
        userName: d.user_name,
        userEmail: d.user_email,
      } as ActivityLog))].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // 5. Fetch Feedbacks
      const { data: feedbacksData } = await supabase.from('feedbacks').select('*');
      const feedbacks = (feedbacksData || []).map((d: any) => ({
        ...d,
        id: d.id,
        userId: d.user_id || d.userId,
        userName: d.user_name || d.userName || '',
        userEmail: d.user_email || d.userEmail || '',
        type: d.type || 'general',
        text: d.text || '',
        reply: d.reply || null,
        repliedAt: d.replied_at || d.repliedAt || null,
        status: d.status || 'new',
        createdAt: d.created_at || d.createdAt,
      })).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      let totalGlobalLogos = 0;
      let totalGlobalMessages = 0;
      let onlineUsersCount = 0;

      const allUsers = (usersData || []).map((d: any) => {
        const uId = d.id;
        const uEmail = (d.email || '').trim();
        const userProjects = (projectsData || []).filter((p: any) => p.user_id === uId);
        const projectsCount = userProjects.length;

        // Calculate logos count from projects (if plan_data contains logoSystem/concept) + logs
        let logosCount = 0;
        userProjects.forEach((p: any) => {
          try {
            const parsed = typeof p.plan_data === 'string' ? JSON.parse(p.plan_data) : (p.plan_data || {});
            if (parsed?.identity?.logoSystem || parsed?.identity?.logoConcept) {
              logosCount++;
            }
          } catch {}
        });
        const logoLogs = logs.filter(l => (l.userId === uId || (uEmail && l.userEmail?.toLowerCase() === uEmail.toLowerCase())) && (l.action?.includes('Logo') || l.action?.includes('شعار')));
        logosCount = Math.max(logosCount, logoLogs.length);
        totalGlobalLogos += logosCount;

        // Calculate messages count from chat_sessions + logs
        const userChats = (chatSessionsData || []).filter((c: any) => c.user_id === uId);
        let messagesCount = userChats.reduce((sum: number, c: any) => {
          try {
            const msgs = Array.isArray(c.messages) ? c.messages : (typeof c.messages === 'string' ? JSON.parse(c.messages) : []);
            return sum + msgs.filter((m: any) => m.role === 'user').length;
          } catch {
            return sum;
          }
        }, 0);
        const msgLogs = logs.filter(l => (l.userId === uId || (uEmail && l.userEmail?.toLowerCase() === uEmail.toLowerCase())) && (l.action?.includes('Advisor Message') || l.action?.includes('رسالة') || l.action?.includes('Chat')));
        messagesCount = Math.max(messagesCount, msgLogs.length);
        totalGlobalMessages += messagesCount;

        // User activity logs
        const userLogs = logs.filter(l => l.userId === uId || (uEmail && l.userEmail?.toLowerCase() === uEmail.toLowerCase()));

        // Entry (Login) time
        const loginLog = userLogs.find(l => l.action?.includes('Login') || l.action?.includes('دخول') || l.action?.includes('Session Start') || l.action?.includes('Session Active'));
        const lastLoginAt = d.user_data?.lastLoginAt || d.userData?.lastLoginAt || loginLog?.timestamp || d.created_at || d.createdAt || '';

        // Exit (Logout) time
        const logoutLog = userLogs.find(l => l.action?.includes('Logout') || l.action?.includes('خروج') || l.action?.includes('Leave') || l.action?.includes('Session End'));
        const lastLogoutAt = d.user_data?.lastLogoutAt || d.userData?.lastLogoutAt || logoutLog?.timestamp || null;

        // Last seen activity
        const lastSeenAt = d.user_data?.lastSeenAt || d.userData?.lastSeenAt || userLogs[0]?.timestamp || lastLoginAt;
        const isOnline = lastSeenAt ? (Date.now() - new Date(lastSeenAt).getTime() < 7 * 60 * 1000) : false;
        if (isOnline) onlineUsersCount++;

        return {
          ...d,
          id: d.id,
          uid: d.id,
          email: uEmail,
          displayName: d.display_name || d.displayName || uEmail.split('@')[0] || 'بدون اسم',
          photoURL: d.photo_url || d.photoURL || '',
          subscriptionPlan: (d.subscription_plan || d.subscriptionPlan || 'FREE').toUpperCase(),
          subscription_plan: (d.subscription_plan || d.subscriptionPlan || 'FREE').toUpperCase(),
          tokens: Number(d.tokens) || 0,
          dailyGenerations: d.daily_generations || d.dailyGenerations || 0,
          createdAt: d.created_at || d.createdAt || '',
          updatedAt: d.updated_at || d.updatedAt || '',
          userData: d.user_data || d.userData || null,
          banned: Boolean(d.banned),
          projectsCount,
          logosCount,
          messagesCount,
          lastLoginAt,
          lastLogoutAt,
          lastSeenAt,
          isOnline,
          userProjects,
          userChats,
          userLogs
        };
      }) as any[];
      const totalUsers = allUsers.length;
      const recentUsers = [...allUsers]
        .sort((a, b) => new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime());

      const proUsersCount = allUsers.filter(u => u.subscriptionPlan === 'PRO').length;
      const freeUsersCount = Math.max(0, totalUsers - proUsersCount);

      const allProjects = (projectsData || []).map((d: any) => {
        let isPro = false;
        let parsed = null;
        try {
          parsed = typeof d.plan_data === 'string' ? JSON.parse(d.plan_data) : (d.plan_data || {});
          isPro = Boolean(parsed?.isPro);
        } catch {}

        const owner = allUsers.find(u => u.uid === d.user_id || u.id === d.user_id);

        return {
          ...d,
          id: d.id,
          userId: d.user_id,
          userName: owner?.displayName || owner?.email?.split('@')[0] || 'مستخدم',
          userEmail: owner?.email || '',
          projectName: d.project_name || parsed?.projectName || 'بدون عنوان',
          concept: d.concept || parsed?.concept || '',
          type: d.type || parsed?.type || 'business',
          createdAt: d.created_at || d.createdAt,
          planData: d.plan_data,
          isPro,
          ownerPlan: owner?.subscriptionPlan || 'FREE'
        };
      }) as any[];
      const totalProjects = allProjects.length;
      const activeProjects = allProjects.filter(p => p.status === 'active').length;
      const proProjectsCount = allProjects.filter(p => p.isPro).length;
      const recentProjects = [...allProjects]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      const paymentRequestsList = feedbacks.filter(f => f.type === 'payment_request' || (typeof f.text === 'string' && f.text.includes('طلب دفع')));
      const totalPaymentRequests = paymentRequestsList.length;
      const pendingPaymentsCount = paymentRequestsList.filter(f => {
        const owner = allUsers.find(u => u.uid === f.userId || u.id === f.userId || (u.email && f.userEmail && u.email.toLowerCase() === f.userEmail.toLowerCase()));
        const isAlreadyPro = owner?.subscriptionPlan === 'PRO';
        return !isAlreadyPro && f.status !== 'replied' && f.status !== 'completed';
      }).length;

      // Real token calculation
      const totalTokensInCirculation = allUsers.reduce((sum, u) => sum + (Number(u.tokens) || 0), 0);

      // Generate Registration Chart Data (Last 30 days)
      const labels: string[] = [];
      const data: number[] = [];
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        labels.push(d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }));
        const count = allUsers.filter(u => (u.created_at || u.createdAt || '').startsWith(dateStr)).length;
        data.push(count);
      }

      // Live Active Audit Flags Scan
      const auditFlags: any[] = [];
      
      // A. Negative / Zero Tokens warning
      allUsers.forEach(u => {
        if (u.tokens !== undefined && u.tokens < 0) {
          auditFlags.push({
            id: `tok-neg-${u.uid || u.id}`,
            userId: u.uid || u.id,
            userEmail: u.email,
            userName: u.displayName || 'مستخدم مجهول',
            type: 'رصيد نقاط سالب',
            message: `المستخدم لديه نقاط سالبة (${u.tokens} نقطة). قد يشير ذلك لمحاولة تخطي قيود الخادم.`,
            severity: 'high',
            timestamp: u.createdAt || new Date().toISOString(),
            details: { tokens: u.tokens, plan: u.subscriptionPlan }
          });
        }
      });

      // B. High generation volume spam
      const aiLogs = logs.filter(l => l.action === 'Generate Plan');
      const userCounts: Record<string, { count: number; name: string; email: string }> = {};
      aiLogs.forEach(l => {
        if (!userCounts[l.userId]) {
          userCounts[l.userId] = { count: 0, name: l.userName, email: l.userEmail };
        }
        userCounts[l.userId].count++;
      });
      Object.entries(userCounts).forEach(([uid, info]) => {
        if (info.count > 5) {
          auditFlags.push({
            id: `spam-ai-${uid}`,
            userId: uid,
            userEmail: info.email,
            userName: info.name,
            type: 'استهلاك غير اعتيادي للذكاء الاصطناعي',
            message: `المستخدم قام بطلب خطة عمل (${info.count} مرات). يرجى التحقق من سلوكه أو تحديد رصيده.`,
            severity: 'medium',
            timestamp: new Date().toISOString(),
            details: { totalRequests: info.count }
          });
        }
      });

      // C. Action scripting (Rapid clicks under 1 second)
      const userTimestamps: Record<string, string[]> = {};
      logs.forEach(l => {
        if (!userTimestamps[l.userId]) userTimestamps[l.userId] = [];
        userTimestamps[l.userId].push(l.timestamp);
      });
      Object.entries(userTimestamps).forEach(([uid, times]) => {
        let rapidCount = 0;
        const sortedTimes = [...times].sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
        for (let i = 1; i < sortedTimes.length; i++) {
          const diff = new Date(sortedTimes[i]).getTime() - new Date(sortedTimes[i-1]).getTime();
          if (diff > 0 && diff < 800) {
            rapidCount++;
          }
        }
        if (rapidCount > 3) {
          const user = allUsers.find(u => u.uid === uid || u.id === uid);
          auditFlags.push({
            id: `script-rapid-${uid}`,
            userId: uid,
            userEmail: user?.email || '',
            userName: user?.displayName || 'مستخدم مجهول',
            type: 'نقرات سريعة متتالية (نظام الأمان)',
            message: `تم رصد عدد ${rapidCount} نقرات سريعة متتالية بفارق أقل من ثانية. يخشى استخدام نصوص برمجية خبيثة (Bot).`,
            severity: 'high',
            timestamp: sortedTimes[sortedTimes.length-1],
            details: { rapidIntervalCount: rapidCount }
          });
        }
      });

      setStats({
        totalUsers,
        proUsersCount,
        freeUsersCount,
        totalProjects,
        activeProjects,
        proProjectsCount,
        totalLogosCount: totalGlobalLogos,
        totalMessagesCount: totalGlobalMessages,
        onlineUsersCount,
        tokenUsage: totalTokensInCirculation,
        totalPaymentRequests,
        pendingPaymentsCount,
        recentProjects,
        recentUsers,
        logs,
        feedbacks,
        chatSessions: chatSessionsData || [],
        registrationData: { labels, data },
        auditFlags
      });
      setLastSyncTime(new Date());
    } catch (err: any) {
      console.error("Admin fetch error:", err);
      setError("تعذر تحميل البيانات. تأكد من صلاحيات المسؤول.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Live Realtime Subscriptions for instantaneous UI updates on any platform change
    const channel = supabase
      .channel('admin_live_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchStats(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchStats(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedbacks' }, () => {
        fetchStats(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logs' }, () => {
        fetchStats(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchStats(true);
      })
      .subscribe();

    // Active polling interval every 5 seconds to ensure 100% synchronization
    const interval = setInterval(() => {
      fetchStats(true);
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Helper for admin action logging
  const logAdminAction = async (action: string, details?: any) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const adminUser = authData?.user;
      await supabase.from('logs').insert({
        user_id: adminUser?.id || '00000000-0000-0000-0000-000000000000',
        user_name: adminUser?.user_metadata?.full_name || 'مسؤول النظام',
        user_email: adminUser?.email || 'admin@businesscreator.com',
        action,
        details: details ? { module: 'Admin', ...details } : { module: 'Admin' },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Failed to log admin action:", err);
    }
  };

  // Controls Handlers
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("⚠️ هل أنت متأكد تماماً من حذف هذا المستخدم نهائياً؟ سيتم إلغاء وصوله وحذف مستنده.")) return;
    try {
      await supabase.from('users').delete().eq('id', userId);
      await logAdminAction(`حذف المستخدم ${userId}`);
      alert("تم حذف المستخدم من قاعدة البيانات بنجاح.");
      setSelectedUser(null);
      fetchStats(true);
    } catch (e) {
      console.error("Failed to delete user", e);
      alert("تعذر حذف المستخدم.");
    }
  };

  const handleToggleBanUser = async (userId: string, currentBanned: boolean) => {
    const actionText = currentBanned ? "إلغاء حظر" : "حظر";
    if (!window.confirm(`هل أنت متأكد من ${actionText} هذا المستخدم؟`)) return;
    try {
      await supabase.from('users').update({
        banned: !currentBanned,
        status: !currentBanned ? 'banned' : 'active'
      }).eq('id', userId);
      await logAdminAction(`${actionText} المستخدم ${userId}`);
      alert(`تم ${actionText} المستخدم وتجميد صلاحياته بنجاح.`);
      if (selectedUser && selectedUser.uid === userId) {
        setSelectedUser(prev => prev ? { ...prev, banned: !currentBanned } as any : null);
      }
      fetchStats(true);
    } catch (e) {
      console.error("Failed to ban/unban user", e);
      alert("فشل تحديث حالة المستخدم.");
    }
  };

  const handleManualUpgradeUser = async (userId: string, userEmail?: string, feedbackId?: string) => {
    const confirmMsg = `هل أنت متأكد من ترقية حساب ${userEmail || userId} إلى باقة رواد الأعمال (PRO) وشحن 100,000 نقطة؟`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await adminUpgradeUserAccount({ userId, userEmail, feedbackId });
      if (res.success) {
        alert("🎉 تمت ترقية الحساب بنجاح إلى باقة رواد الأعمال (PRO) وشحن 100,000 نقطة وإرسال إشعار رسمي للمستخدم!");
        if (selectedUser && (selectedUser.uid === userId || (selectedUser as any).id === userId)) {
          setSelectedUser(prev => prev ? { ...prev, subscriptionPlan: 'PRO', tokens: res.newTokens } as any : null);
        }
        fetchStats(true);
      } else {
        alert(res.error || "تعذرت ترقية الحساب.");
      }
    } catch (e: any) {
      console.error("Error upgrading user manually:", e);
      alert("حدث خطأ أثناء ترقية الحساب.");
    }
  };

  const handleAdjustTokens = async (userId: string, currentTokens: number) => {
    const amountStr = window.prompt(`تعديل نقاط المستخدم. الرصيد الحالي: ${currentTokens || 0}.\nأدخل القيمة الجديدة للرصيد:`);
    if (amountStr === null) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount)) {
      alert("يرجى إدخال رقم صحيح.");
      return;
    }
    try {
      await supabase.from('users').update({ tokens: amount }).eq('id', userId);
      await createNotification(
        userId,
        'تعديل رصيد النقاط',
        `تم تحديث رصيد نقاط حسابك بنجاح بواسطة إدارة المنصة ليصبح رصيدك الحالي: ${amount} نقطة.`,
        'recharge_renew',
        false,
        true
      );
      await logAdminAction(`تعديل رصيد نقاط المستخدم ${userId} إلى ${amount}`);
      alert("تم شحن الرصيد الجديد وتنبيه المستخدم.");
      if (selectedUser && selectedUser.uid === userId) {
        setSelectedUser(prev => prev ? { ...prev, tokens: amount } as any : null);
      }
      fetchStats(true);
    } catch (e) {
      console.error("Failed to adjust tokens", e);
      alert("فشل تحديث النقاط.");
    }
  };

  const handleSendWarning = async (userId: string) => {
    const msg = window.prompt("اكتب نص التحذير أو التنبيه الأمني لإرساله فوراً للمستخدم:");
    if (!msg) return;
    try {
      await createNotification(
        userId,
        'تنبيه وتحذير أمني رسمي',
        msg,
        'support_reply',
        false,
        true
      );
      alert("تم توجيه الإنذار الرسمي للمستخدم بنجاح.");
    } catch (e) {
      console.error("Failed to send warning", e);
      alert("فشل توجيه الإنذار.");
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المشروع نهائياً؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    try {
      await supabase.from('projects').delete().eq('id', id);
      await logAdminAction(`حذف مشروع ${id}`);
      alert("تم حذف المشروع بنجاح.");
      setSelectedProject(null);
      fetchStats(true);
    } catch (e) {
      console.error("Error deleting project", e);
      alert("فشل حذف المشروع.");
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;
    try {
      await supabase.from('feedbacks').delete().eq('id', id);
      alert("تم حذف الرسالة بنجاح.");
      fetchStats(true);
    } catch (e) {
      console.error("Error deleting feedback", e);
    }
  };

  const handleSendFeedbackReply = async (feedback: any) => {
    if (!replyText.trim()) {
      alert("يرجى كتابة نص الرد أولاً.");
      return;
    }
    try {
      // 1. Send dynamic notification as requested with isOfficial flag
      await createNotification(
        feedback.userId || 'anonymous',
        `الرد الرسمي على رسالتك: (${feedback.type === 'suggestion' ? 'اقتراحك' : 'مشكلتك'})`,
        replyText,
        'support_reply',
        true, // Offer whatsapp support action inside notification
        true  // Mark as Official! Displays verified badge & custom Business Creator branding!
      );

      // 2. Update status of the support feedback doc in Supabase
      await supabase.from('feedbacks').update({
        reply: replyText,
        replied_at: new Date().toISOString(),
        status: 'replied'
      }).eq('id', feedback.id);

      alert("تم إرسال ردك بنجاح! سيظهر للمستخدم في مركز إشعاراته مع شارة التوثيق الخضراء واسم وشعار Business Creator.");
      setReplyText('');
      setReplyingToId(null);
      fetchStats(true);
    } catch (e) {
      console.error("Error replying to feedback:", e);
      alert("تعذر إرسال الرد.");
    }
  };

  const viewProjectDetails = (project: any) => {
    try {
      let parsedPlan;
      if (typeof project.planData === 'string') {
        parsedPlan = JSON.parse(project.planData);
      } else {
        parsedPlan = project.planData;
      }
      setSelectedProject({ ...project, parsedPlan });
      
      // Look up owner details
      const owner = stats?.recentUsers.find(u => u.uid === project.userId || u.id === project.userId);
      setProjectOwner(owner || null);
    } catch (e) {
      console.error("Failed to parse plan data", e);
      alert("عفواً، تعذر فتح تفاصيل خطة العمل.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] space-y-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-[#FF7E01]/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#FF7E01] border-t-transparent rounded-full animate-spin"></div>
          <Cpu className="absolute inset-0 m-auto text-[#FF7E01] animate-pulse" size={24} />
        </div>
        <p className="text-slate-400 font-bold text-xs tracking-wider animate-pulse">جاري فحص وتأمين ملفات الإدارة...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="bg-red-950/40 border border-red-500/30 p-6 rounded-2xl text-red-200 w-full max-w-md text-center space-y-4">
          <ShieldAlert size={40} className="text-red-500 mx-auto" />
          <h2 className="text-xl font-bold">وصول غير مصرح به</h2>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        titleColor: '#FF7E01',
        bodyColor: '#F8FAFC',
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        borderWidth: 1,
        borderColor: 'rgba(255, 126, 1, 0.2)'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.02)' },
        ticks: { color: '#64748B', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748B', font: { size: 10 } }
      }
    }
  };

  const chartData = {
    labels: stats?.registrationData.labels,
    datasets: [
      {
        label: 'تسجيل الدخول',
        data: stats?.registrationData.data,
        borderColor: '#FF7E01',
        backgroundColor: 'rgba(255, 126, 1, 0.04)',
        borderWidth: 2,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#0F172A',
        pointBorderColor: '#FF7E01',
        pointBorderWidth: 1.5,
        pointRadius: 3
      }
    ]
  };

  const allFeedbacks = stats?.feedbacks || [];
  const paymentRequests = allFeedbacks.filter(f => f.type === 'payment_request' || (typeof f.text === 'string' && f.text.includes('طلب دفع')));
  const pendingPaymentRequests = paymentRequests.filter(f => f.status !== 'replied' && f.status !== 'completed');
  const regularFeedbacks = allFeedbacks.filter(f => f.type !== 'payment_request' && !(typeof f.text === 'string' && f.text.includes('طلب دفع')));

  const tabs: { id: TabType; label: string; icon: React.FC<any>; count?: number }[] = [
    { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
    { id: 'payments', label: 'طلبات الدفع', icon: Coins, count: pendingPaymentRequests.length },
    { id: 'users', label: 'المستخدمين', icon: Users, count: stats?.recentUsers.length },
    { id: 'projects', label: 'المشاريع', icon: Briefcase, count: stats?.totalProjects },
    { id: 'feedbacks', label: 'الرسائل والدعم', icon: MessageCircle, count: regularFeedbacks.length },
    { id: 'security', label: 'الأمان والسجلات', icon: ShieldAlert, count: stats?.auditFlags.length }
  ];

  const filteredUsers = stats?.recentUsers.filter(u => u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())) || [];
  const filteredProjects = stats?.recentProjects.filter(p => p.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) || p.userName?.toLowerCase().includes(searchQuery.toLowerCase())) || [];

  // Paginated Slices to prevent rendering lag
  const totalUsersPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE);

  const totalProjectsPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice((projectsPage - 1) * ITEMS_PER_PAGE, projectsPage * ITEMS_PER_PAGE);

  const totalFeedbacksPages = Math.ceil(regularFeedbacks.length / ITEMS_PER_PAGE);
  const paginatedFeedbacks = regularFeedbacks.slice((feedbacksPage - 1) * ITEMS_PER_PAGE, feedbacksPage * ITEMS_PER_PAGE);

  const totalPaymentsPages = Math.ceil(paymentRequests.length / ITEMS_PER_PAGE);
  const paginatedPayments = paymentRequests.slice((paymentsPage - 1) * ITEMS_PER_PAGE, paymentsPage * ITEMS_PER_PAGE);

  const allLogs = stats?.logs || [];
  const totalLogsPages = Math.ceil(allLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = allLogs.slice((logsPage - 1) * ITEMS_PER_PAGE, logsPage * ITEMS_PER_PAGE);

  // Dynamically resolve questionnaire data with fallback to projects
  const getSelectedUserQuestionnaire = () => {
    if (!selectedUser) return null;
    if (selectedUser.userData) return selectedUser.userData;
    if (stats?.recentProjects) {
      const userProject = stats.recentProjects.find(p => p.userId === (selectedUser as any).id || p.userId === selectedUser.uid);
      if (userProject) {
        try {
          const parsed = typeof userProject.planData === 'string' ? JSON.parse(userProject.planData) : userProject.planData;
          if (parsed && parsed.userData) {
            return parsed.userData;
          }
        } catch (e) {
          console.error("Failed to parse fallback userData from project", e);
        }
      }
    }
    return null;
  };
  const userQuestionnaireData = getSelectedUserQuestionnaire();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-3 md:p-6 font-sans selection:bg-[#FF7E01]/30 pb-32 text-xs" dir="rtl">
      
      {/* Header (Very Compact) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF7E01]/10 rounded-xl flex items-center justify-center text-[#FF7E01]">
            <Cpu size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">لوحة تحكم الإدارة</h1>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                تحديث لحظي مباشر (Live)
              </span>
            </div>
            <p className="text-slate-400 mt-0.5 text-[10px] flex items-center gap-2">
              <span>آخر مزامنة لقاعدة البيانات: <strong className="text-slate-300 font-mono">{lastSyncTime.toLocaleTimeString('ar-EG')}</strong></span>
            </p>
          </div>
        </div>

        {/* Global Compact Search & Live Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="البحث السريع..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-[#0F172A] border border-white/10 hover:border-white/20 focus:border-[#FF7E01] rounded-xl py-1.5 pr-8 pl-3 text-xs outline-none transition-all placeholder-slate-600 w-44 md:w-56"
            />
          </div>
          <button 
            onClick={() => fetchStats(true)} 
            disabled={isRefreshing}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 transition-colors flex items-center justify-center cursor-pointer" 
            title="تحديث البيانات الفوري"
          >
            <Clock size={14} className={isRefreshing ? 'animate-spin text-[#FF7E01]' : ''} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs - Super Compact Pill Style */}
      <div className="flex overflow-x-auto pb-2 mb-6 gap-1.5 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all text-[11px] ${
              activeTab === tab.id 
                ? 'bg-[#FF7E01] text-white shadow-md' 
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <tab.icon size={12} />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="bg-black/30 text-white text-[9px] px-1.5 py-0.5 rounded-md font-medium">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: OVERVIEW (Snug Compact Panels with Real Data) */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Snug Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { 
                label: 'إجمالي الأعضاء', 
                value: (stats?.totalUsers ?? 0).toLocaleString(), 
                subtitle: `PRO: ${stats?.proUsersCount || 0} | مجاني: ${stats?.freeUsersCount || 0}`,
                icon: Users, 
                color: 'text-blue-400', 
                bg: 'bg-blue-400/10' 
              },
              { 
                label: 'المشاريع المنشأة', 
                value: (stats?.totalProjects ?? 0).toLocaleString(), 
                subtitle: `${stats?.proProjectsCount || 0} خطة احترافية`,
                icon: Briefcase, 
                color: 'text-orange-400', 
                bg: 'bg-[#FF7E01]/10' 
              },
              { 
                label: 'الشعارات المصممة', 
                value: (stats?.totalLogosCount ?? 0).toLocaleString(), 
                subtitle: 'شعار تم توليده بالذكاء',
                icon: Palette, 
                color: 'text-pink-400', 
                bg: 'bg-pink-400/10' 
              },
              { 
                label: 'رسائل المرشد', 
                value: (stats?.totalMessagesCount ?? 0).toLocaleString(), 
                subtitle: 'رسالة ومحادثة إرشادية',
                icon: Compass, 
                color: 'text-cyan-400', 
                bg: 'bg-cyan-400/10' 
              },
              { 
                label: 'المتواجدين الآن', 
                value: (stats?.onlineUsersCount ?? 0).toLocaleString(), 
                subtitle: 'نشط خلال آخر 7 دقائق',
                icon: Radio, 
                color: 'text-emerald-400', 
                bg: 'bg-emerald-400/10' 
              },
              { 
                label: 'رصيد النقاط الفعلي', 
                value: (stats?.tokenUsage ?? 0).toLocaleString(), 
                subtitle: 'نقطة مشحونة بالحسابات', 
                icon: Sparkles, 
                color: 'text-purple-400', 
                bg: 'bg-purple-400/10' 
              }
            ].map((item, i) => (
              <div key={i} className="bg-[#0F172A] p-3.5 rounded-xl border border-white/5 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-slate-400 font-medium text-[10px]">{item.label}</p>
                  <div className="space-y-0.5">
                    <h3 className="text-base font-black text-white">{item.value}</h3>
                    {item.subtitle && <span className="text-slate-500 text-[8px] font-bold block">{item.subtitle}</span>}
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${item.bg} ${item.color} shrink-0`}>
                  <item.icon size={16} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-[#0F172A] p-4 rounded-xl border border-white/5 space-y-3">
              <div>
                <h3 className="text-xs font-bold text-white">إحصائيات الانضمام والنمو</h3>
                <p className="text-[10px] text-slate-500">معدل تسجيل الحسابات الجديدة خلال 30 يوماً الأخيرة</p>
              </div>
              <div className="h-[220px]">
                <Line options={chartOptions} data={chartData} />
              </div>
            </div>

            {/* Recent Activity Log Panel */}
            <div className="bg-[#0F172A] p-4 rounded-xl border border-white/5 flex flex-col h-[280px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Activity size={12} className="text-[#FF7E01]" />
                  سجل النشاط الآني
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {stats?.logs.slice(0, 6).map((log, i) => (
                  <div key={i} className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="font-bold text-white text-[10px]">{log.action}</p>
                      <p className="text-[9px] text-slate-400">{log.userName} ({log.userEmail})</p>
                    </div>
                    <span className="text-slate-500 text-[8px] shrink-0 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: USERS (Complete Control and Action panel) */}
      {activeTab === 'users' && (
        <div className="bg-[#0F172A] rounded-xl border border-white/5 overflow-hidden animate-in fade-in duration-300">
          <AdminCardHeader
            icon={Users}
            title="التحكم في أعضاء المنصة"
            countLabel="مجموع الأعضاء"
            count={filteredUsers.length}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#1E293B]/40 text-slate-400 font-bold border-b border-white/5 whitespace-nowrap">
                <tr>
                  <th className="px-3 py-3">المستخدم / المعرف</th>
                  <th className="px-3 py-3">الباقة والرصيد</th>
                  <th className="px-3 py-3 text-center">💡 المشاريع</th>
                  <th className="px-3 py-3 text-center">🎨 الشعارات</th>
                  <th className="px-3 py-3 text-center">🧭 رسائل المرشد</th>
                  <th className="px-3 py-3 text-center">⏱️ وقت آخر دخول</th>
                  <th className="px-3 py-3 text-center">🚪 آخر خروج / الحالة</th>
                  <th className="px-3 py-3 text-center">الإجراءات والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedUsers.map((u, idx) => (
                  <tr key={idx} className={`hover:bg-white/5 transition-colors ${u.banned ? 'opacity-60 bg-red-950/10' : ''}`}>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-xs shrink-0">
                          {u.displayName?.[0] || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-white font-bold truncate max-w-[140px]">{u.displayName || 'بدون اسم'}</p>
                            {u.isOnline && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="متواجد حالياً على المنصة"></span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 truncate block">{u.email}</span>
                          <span className="text-[8px] text-slate-500 font-mono block">انضم: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : '-'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="space-y-1">
                        {u.subscriptionPlan === 'PRO' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-[#FF7E01] border border-orange-500/40 shadow-xs">
                            <Sparkles size={10} className="text-orange-400" />
                            👑 PRO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            خطة البداية
                          </span>
                        )}
                        <span className="text-orange-400 font-black text-[10px] block font-mono">{(u.tokens ?? 0).toLocaleString()} نقطة</span>
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 font-black text-[11px]">
                        <Lightbulb size={12} className="text-[#FF7E01]" />
                        {u.projectsCount || 0}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 font-black text-[11px]">
                        <Palette size={12} className="text-pink-400" />
                        {u.logosCount || 0}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-black text-[11px]">
                        <MessageSquare size={12} className="text-cyan-400" />
                        {u.messagesCount || 0}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span className="text-[10px] text-slate-300 font-mono flex items-center justify-center gap-1">
                        <LogIn size={11} className="text-blue-400" />
                        {formatArabicDateTime(u.lastLoginAt)}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      {u.isOnline ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          متواجد الآن
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
                          <LogOut size={11} className="text-slate-500" />
                          {u.lastLogoutAt ? formatArabicDateTime(u.lastLogoutAt) : (u.lastSeenAt ? formatArabicDateTime(u.lastSeenAt) : 'غير مسجل')}
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {u.subscriptionPlan !== 'PRO' && (
                          <button 
                            onClick={() => handleManualUpgradeUser(u.uid || u.id, u.email)}
                            className="px-2 py-1 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-lg transition-all font-black text-[9px] flex items-center gap-1 shadow-xs cursor-pointer"
                            title="ترقية الحساب فوراً إلى PRO وشحن 100,000 نقطة"
                          >
                            <Sparkles size={10} /> ترقية PRO
                          </button>
                        )}
                        <button 
                          onClick={() => { setSelectedUser(u); setUserModalTab('overview'); }}
                          className="px-2.5 py-1 bg-[#FF7E01]/10 hover:bg-[#FF7E01] text-[#FF7E01] hover:text-white rounded-lg transition-all font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={12} /> فحص العضو
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-slate-500">لا يوجد أعضاء لعرضهم</div>
            )}
          </div>

          {/* Users Table Pagination Controls */}
          {totalUsersPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/[0.02] text-slate-300">
              <button
                disabled={usersPage === 1}
                onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-slate-300 rounded-lg font-bold text-[10px] transition-all"
              >
                <ChevronRight size={12} /> السابق
              </button>
              <span className="text-slate-400 font-bold text-[10px]">
                الصفحة {usersPage} من {totalUsersPages}
              </span>
              <button
                disabled={usersPage === totalUsersPages}
                onClick={() => setUsersPage(p => Math.min(totalUsersPages, p + 1))}
                className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-slate-300 rounded-lg font-bold text-[10px] transition-all"
              >
                التالي <ChevronLeft size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: PROJECTS (Comprehensive control and Creator lookup info) */}
      {activeTab === 'projects' && (
        <div className="bg-[#0F172A] rounded-xl border border-white/5 overflow-hidden animate-in fade-in duration-300">
          <AdminCardHeader
            icon={Briefcase}
            title="مشاريع رواد الأعمال المحفوظة"
            countLabel="إجمالي المشاريع"
            count={filteredProjects.length}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#1E293B]/40 text-slate-400 font-bold border-b border-white/5">
                <tr>
                  <th className="px-4 py-3">اسم المشروع ومفتاح الهوية</th>
                  <th className="px-4 py-3">تاريخ الإنشاء</th>
                  <th className="px-4 py-3">منشئ المشروع</th>
                  <th className="px-4 py-3 text-center">التحكم والعمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedProjects.map((p, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          p.isPro ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-white/5 border border-white/10 text-slate-400'
                        }`}>
                          <Layers size={12} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-bold">{p.projectName || 'بدون عنوان'}</p>
                            {p.isPro ? (
                              <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[8px] font-black px-1.5 py-0.2 rounded-full">
                                PRO احترافي
                              </span>
                            ) : (
                              <span className="bg-slate-800 text-slate-400 text-[8px] font-medium px-1.5 py-0.2 rounded-full">
                                مجاني
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono block">ID: {p.id?.slice(0, 12)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 font-mono text-[10px]">
                      {p.createdAt ? new Date(p.createdAt).toLocaleString('ar-EG') : '-'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-slate-300 font-medium">{p.userName || 'مستخدم'}</p>
                        {p.ownerPlan === 'PRO' && (
                          <span className="text-[8px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1 py-0.2 rounded font-black">
                            PRO
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono block">{p.userEmail || `UID: ${p.userId?.slice(0, 8)}...`}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => viewProjectDetails(p)}
                          className="px-3 py-1.5 bg-[#FF7E01]/10 hover:bg-[#FF7E01] text-[#FF7E01] hover:text-white rounded-lg transition-all font-bold text-[10px] flex items-center gap-1"
                        >
                          <Eye size={12} /> عرض تفاصيل المشروع والمالك
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProjects.length === 0 && (
              <div className="p-8 text-center text-slate-500">لا توجد مشاريع مسجلة بعد</div>
            )}
          </div>

          {/* Projects Table Pagination Controls */}
          {totalProjectsPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/[0.02] text-slate-300">
              <button
                disabled={projectsPage === 1}
                onClick={() => setProjectsPage(p => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-slate-300 rounded-lg font-bold text-[10px] transition-all"
              >
                <ChevronRight size={12} /> السابق
              </button>
              <span className="text-slate-400 font-bold text-[10px]">
                الصفحة {projectsPage} من {totalProjectsPages}
              </span>
              <button
                disabled={projectsPage === totalProjectsPages}
                onClick={() => setProjectsPage(p => Math.min(totalProjectsPages, p + 1))}
                className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-slate-300 rounded-lg font-bold text-[10px] transition-all"
              >
                التالي <ChevronLeft size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: PAYMENTS (Payment Requests & 1-Click Upgrade) */}
      {activeTab === 'payments' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-[#0F172A] rounded-xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Coins size={14} className="text-[#FF7E01]" />
                طلبات الدفع والترقية المؤقتة (WhatsApp)
              </h3>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="bg-orange-500/10 text-[#FF7E01] px-2.5 py-1 rounded-full font-bold border border-orange-500/20">
                  طلبات قيد الانتظار: {pendingPaymentRequests.length}
                </span>
                <span className="bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full font-bold border border-green-500/20">
                  طلبات مكتملة: {paymentRequests.filter(r => r.status === 'replied' || r.status === 'completed').length}
                </span>
              </div>
            </div>

            <div className="divide-y divide-white/5">
              {paginatedPayments.map((p, i) => {
                const ownerUser = stats?.recentUsers.find(u => 
                  u.uid === p.userId || 
                  u.id === p.userId || 
                  (u.email && p.userEmail && u.email.toLowerCase() === p.userEmail.toLowerCase())
                );
                const isUserPro = ownerUser?.subscriptionPlan === 'PRO' || p.status === 'replied' || p.status === 'completed';
                
                return (
                  <div key={i} className={`p-4 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${
                    !isUserPro ? 'bg-orange-500/[0.04] hover:bg-orange-500/[0.08] border-r-2 border-orange-500' : 'bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04] border-r-2 border-emerald-500'
                  }`}>
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                        !isUserPro ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {!isUserPro ? '⏳' : '👑'}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-white text-sm">{ownerUser?.displayName || p.userName || 'مستخدم'}</p>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider border flex items-center gap-1 ${
                            !isUserPro 
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {!isUserPro ? '🔴 قيد الانتظار - لم يتم تفعيل الحساب' : '🟢 تم تفعيل باقة PRO للمستخدم بنجاح ✓'}
                          </span>
                          {ownerUser && (
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                              الرصيد الحالي: {ownerUser.tokens?.toLocaleString()} نقطة
                            </span>
                          )}
                        </div>
                        
                        <p className="text-slate-300 text-xs font-mono">{p.userEmail || ownerUser?.email}</p>
                        
                        <div className="flex items-center gap-4 text-[10px] text-slate-400 flex-wrap pt-0.5">
                          <span className="text-[#FF7E01] font-black">خطة رواد الأعمال (PRO) - 499 ج.م</span>
                          <span>•</span>
                          <span>توقيت الطلب: {p.createdAt?.toDate ? p.createdAt.toDate().toLocaleString('ar-EG') : (p.createdAt ? new Date(p.createdAt).toLocaleString('ar-EG') : '-')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                      {!isUserPro ? (
                        <button
                          onClick={() => handleManualUpgradeUser(p.userId || ownerUser?.id, p.userEmail || ownerUser?.email, p.id)}
                          className="px-4 py-2 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
                        >
                          <Sparkles size={14} />
                          <span>ترقية الحساب الآن (PRO)</span>
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-bold text-xs flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          <CheckCircle2 size={14} className="text-emerald-400" /> الحساب مفعّل
                        </span>
                      )}

                      {(p.userEmail || ownerUser?.email) && (
                        <a
                          href={`https://wa.me/201034927416?text=${encodeURIComponent(`أهلاً بك بخصوص طلب الترقية لحسابك: ${p.userEmail || ownerUser?.email}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-all font-bold text-xs"
                          title="فتح محادثة الواتساب"
                        >
                          <MessageCircle size={14} />
                        </a>
                      )}

                      <button
                        onClick={() => handleDeleteFeedback(p.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                        title="حذف الطلب"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {paymentRequests.length === 0 && (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <Coins size={32} className="mx-auto text-slate-600 opacity-40" />
                  <p className="font-bold text-sm">لا توجد طلبات دفع جديدة حالياً</p>
                  <p className="text-xs text-slate-600">أي مستخدم يضغط على زر الدفع ستظهر بياناته هنا فوراً لترقية حسابه بضغطة زر واحدة.</p>
                </div>
              )}
            </div>

            {/* Payments List Pagination Controls */}
            {totalPaymentsPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/[0.02] text-slate-300">
                <button
                  disabled={paymentsPage === 1}
                  onClick={() => setPaymentsPage(p => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-slate-300 rounded-lg font-bold text-[10px] transition-all"
                >
                  <ChevronRight size={12} /> السابق
                </button>
                <span className="text-slate-400 font-bold text-[10px]">
                  الصفحة {paymentsPage} من {totalPaymentsPages}
                </span>
                <button
                  disabled={paymentsPage === totalPaymentsPages}
                  onClick={() => setPaymentsPage(p => Math.min(totalPaymentsPages, p + 1))}
                  className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-slate-300 rounded-lg font-bold text-[10px] transition-all"
                >
                  التالي <ChevronLeft size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: SUPPORT & FEEDBACKS (Detailed Reply Interface) */}
      {activeTab === 'feedbacks' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-[#0F172A] rounded-xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/5">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <MessageCircle size={14} className="text-[#FF7E01]" />
                صندوق وارد رسائل الدعم الفني والملاحظات
              </h3>
            </div>

            <div className="divide-y divide-white/5">
              {paginatedFeedbacks.map((f, i) => (
                <div key={i} className="p-4 hover:bg-white/[0.01] transition-colors flex flex-col md:flex-row gap-4 items-start">
                  <div className="w-full md:w-48 shrink-0 space-y-1">
                    <p className="font-bold text-white">{f.userName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{f.userEmail}</p>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                      f.type === 'suggestion' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      f.type === 'problem' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    }`}>
                      {f.type === 'suggestion' ? 'اقتراح' : f.type === 'problem' ? 'مشكلة' : 'استفسار'}
                    </span>
                    {f.status === 'replied' && (
                      <span className="block text-[9px] text-green-400 font-bold">✓ تمت الاستجابة</span>
                    )}
                  </div>

                  <div className="flex-1 bg-white/5 p-3 rounded-lg border border-white/5 relative w-full space-y-2">
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{f.text}</p>
                    
                    {f.reply && (
                      <div className="bg-orange-500/5 border border-[#FF7E01]/20 p-2 rounded mt-2">
                        <p className="text-[9px] font-bold text-[#FF7E01] mb-1">الرد الإداري المرسل:</p>
                        <p className="text-slate-400 italic text-[10px]">{f.reply}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[9px] text-slate-500 font-mono">
                        {f.createdAt?.toDate ? f.createdAt.toDate().toLocaleString('ar-EG') : (f.createdAt || '-')}
                      </span>
                      
                      <div className="flex gap-1.5">
                        {replyingToId === f.id ? (
                          <div className="w-full flex flex-col gap-2 mt-2">
                            <textarea
                              rows={2}
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="اكتب ردك الرسمي هنا ليتم إرساله في الإشعارات للمستخدم..."
                              className="w-full bg-[#1E293B] border border-white/10 hover:border-white/20 focus:border-[#FF7E01] rounded-lg p-2 text-xs text-white outline-none"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button 
                                onClick={() => handleSendFeedbackReply(f)}
                                className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded font-bold text-[10px] flex items-center gap-1"
                              >
                                <Send size={10} /> إرسال الرد
                              </button>
                              <button 
                                onClick={() => { setReplyingToId(null); setReplyText(''); }}
                                className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-400 rounded font-bold text-[10px]"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => setReplyingToId(f.id)}
                              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-200 rounded font-bold text-[10px]"
                            >
                              الرد على الاستفسار
                            </button>
                            <button 
                              onClick={() => handleDeleteFeedback(f.id)}
                              className="p-1 px-2.5 bg-red-500/10 hover:bg-red-600 hover:text-white text-red-400 rounded font-bold text-[10px]"
                            >
                              حذف
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(!stats?.feedbacks || stats.feedbacks.length === 0) && (
                <div className="p-8 text-center text-slate-500">لا توجد رسائل دعم فني حالية</div>
              )}
            </div>
          </div>

          {/* Feedbacks List Pagination Controls */}
          {totalFeedbacksPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border border-white/5 rounded-xl bg-[#0F172A] text-slate-300">
              <button
                disabled={feedbacksPage === 1}
                onClick={() => setFeedbacksPage(p => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-slate-300 rounded-lg font-bold text-[10px] transition-all"
              >
                <ChevronRight size={12} /> السابق
              </button>
              <span className="text-slate-400 font-bold text-[10px]">
                الصفحة {feedbacksPage} من {totalFeedbacksPages}
              </span>
              <button
                disabled={feedbacksPage === totalFeedbacksPages}
                onClick={() => setFeedbacksPage(p => Math.min(totalFeedbacksPages, p + 1))}
                className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-slate-300 rounded-lg font-bold text-[10px] transition-all"
              >
                التالي <ChevronLeft size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: SECURITY & LOGS (100% active, interactive scanner reviews) */}
      {activeTab === 'security' && (
        <div className="grid lg:grid-cols-2 gap-4 animate-in fade-in duration-300">
          
          {/* Security Alerts Area */}
          <div className="bg-[#0F172A] p-4 rounded-xl border border-white/5 flex flex-col h-[520px]">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 mb-3">
              <ShieldAlert className="text-red-500 animate-pulse" size={14} />
              رادار التهديدات وتنبيهات الأمان (Audit Flags)
            </h3>
            
            <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
              {stats?.auditFlags.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-white/5 rounded-xl border border-white/5 border-dashed h-full">
                  <Shield size={32} className="text-green-500 mb-2 opacity-50" />
                  <p className="font-bold text-white">درع الحماية نشط بالكامل</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">لم يتم رصد أي عمليات اختراق أو استهلاك غير طبيعي</p>
                </div>
              ) : (
                stats?.auditFlags.map((flag, i) => (
                  <div key={i} className={`p-3 rounded-lg border flex gap-3 ${
                    flag.severity === 'high' ? 'bg-red-500/5 border-red-500/20' : 
                    flag.severity === 'medium' ? 'bg-yellow-500/5 border-yellow-500/20' : 
                    'bg-[#FF7E01]/5 border-[#FF7E01]/20'
                  }`}>
                    <div className="mt-0.5">
                      <AlertTriangle size={16} className={flag.severity === 'high' ? 'text-red-500' : flag.severity === 'medium' ? 'text-yellow-500' : 'text-[#FF7E01]'} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between items-center">
                        <span className={`text-[8px] font-black uppercase tracking-wider ${
                           flag.severity === 'high' ? 'text-red-400' : flag.severity === 'medium' ? 'text-yellow-400' : 'text-[#FF7E01]'
                        }`}>{flag.type}</span>
                        <span className="text-slate-500 text-[8px] font-mono">
                          {new Date(flag.timestamp).toLocaleTimeString('ar-EG')}
                        </span>
                      </div>
                      <p className="font-bold text-slate-200 text-[10px]">{flag.message}</p>
                      
                      <div className="pt-2 border-t border-white/5 flex gap-1.5 justify-end">
                        <button 
                          onClick={() => setSelectedAuditAlert(flag)}
                          className="text-[9px] px-2 py-0.5 bg-white/10 rounded font-bold hover:bg-white/20 transition-all text-slate-200"
                        >
                          عرض وفحص
                        </button>
                        <button 
                          onClick={() => handleToggleBanUser(flag.userId, false)}
                          className="text-[9px] px-2 py-0.5 bg-red-600/20 text-red-400 rounded font-bold hover:bg-red-600 hover:text-white transition-all"
                        >
                          تجميد الحساب
                        </button>
                        <button 
                          onClick={() => {
                            setStats(prev => prev ? { ...prev, auditFlags: prev.auditFlags.filter(af => af.id !== flag.id) } : null);
                            alert("تم تجاهل التنبيه.");
                          }}
                          className="text-[9px] px-2 py-0.5 bg-white/5 text-slate-500 rounded hover:text-white transition-all"
                        >
                          تجاهل
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detailed Activity Logs */}
          <div className="bg-[#0F172A] rounded-xl border border-white/5 overflow-hidden flex flex-col h-[520px]">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Database size={12} className="text-[#FF7E01]" />
                سجل الخادم الشامل للنشاطات
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#1E293B]/40 text-slate-400 font-bold border-b border-white/5 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3">توقيت الحدث</th>
                    <th className="px-4 py-3">المستخدم / الوكيل</th>
                    <th className="px-4 py-3">العملية والوحدة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-2 text-slate-500 font-mono text-[9px]">
                        {new Date(log.timestamp).toLocaleString('ar-EG')}
                      </td>
                      <td className="px-4 py-2">
                        <p className="text-white font-bold text-[10px]">{log.userName}</p>
                        <p className="text-[9px] text-slate-500 font-mono">{log.userEmail}</p>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 bg-[#1E293B] border border-white/5 rounded text-[8px] font-bold text-slate-400">
                            {log.module}
                          </span>
                          <span className="text-slate-300 font-medium text-[10px]">{log.action}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allLogs.length === 0 && (
                <div className="p-8 text-center text-slate-500">لا توجد سجلات حالياً</div>
              )}
            </div>

            {/* Logs Table Pagination Controls */}
            {totalLogsPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/[0.02] text-slate-300">
                <button
                  disabled={logsPage === 1}
                  onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-slate-300 rounded-lg font-bold text-[10px] transition-all"
                >
                  <ChevronRight size={12} /> السابق
                </button>
                <span className="text-slate-400 font-bold text-[10px]">
                  الصفحة {logsPage} من {totalLogsPages}
                </span>
                <button
                  disabled={logsPage === totalLogsPages}
                  onClick={() => setLogsPage(p => Math.min(totalLogsPages, p + 1))}
                  className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-slate-300 rounded-lg font-bold text-[10px] transition-all"
                >
                  التالي <ChevronLeft size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: User Profile & Complete Analytics, Projects, Chats, Logs, and Answers slide-over */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#0F172A] w-full max-w-3xl h-full border-r border-white/10 flex flex-col overflow-hidden shadow-2xl relative" dir="rtl">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-sm">
                    {selectedUser.displayName?.[0] || 'U'}
                  </div>
                  {selectedUser.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0F172A]" title="متواجد الآن"></span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">{selectedUser.displayName || 'بيانات العضو'}</h3>
                    {selectedUser.subscriptionPlan === 'PRO' ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-[#FF7E01] border border-orange-500/40">
                        👑 PRO
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        خطة البداية
                      </span>
                    )}
                    {selectedUser.banned && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-950 text-red-400 border border-red-800">
                        🔴 محظور
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedUser.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-1.5 bg-white/5 hover:bg-red-500 hover:text-white text-slate-400 rounded-lg transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Quick Analytics Banner */}
            <div className="p-4 bg-black/20 border-b border-white/5 space-y-3">
              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 text-center">
                  <div className="flex items-center justify-center gap-1 text-orange-400 text-[10px] font-bold mb-0.5">
                    <Lightbulb size={12} />
                    <span>أفكار المشاريع</span>
                  </div>
                  <span className="text-base font-black text-white">{selectedUser.projectsCount || 0}</span>
                </div>

                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 text-center">
                  <div className="flex items-center justify-center gap-1 text-pink-400 text-[10px] font-bold mb-0.5">
                    <Palette size={12} />
                    <span>الشعارات المصممة</span>
                  </div>
                  <span className="text-base font-black text-white">{selectedUser.logosCount || 0}</span>
                </div>

                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 text-center">
                  <div className="flex items-center justify-center gap-1 text-cyan-400 text-[10px] font-bold mb-0.5">
                    <Compass size={12} />
                    <span>رسائل المرشد</span>
                  </div>
                  <span className="text-base font-black text-white">{selectedUser.messagesCount || 0}</span>
                </div>

                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 text-center">
                  <div className="flex items-center justify-center gap-1 text-purple-400 text-[10px] font-bold mb-0.5">
                    <Sparkles size={12} />
                    <span>رصيد النقاط</span>
                  </div>
                  <span className="text-base font-black text-orange-400 font-mono">{(selectedUser.tokens ?? 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Login, Logout, & Session Presence Bar */}
              <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                    <LogIn size={12} />
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">توقيت آخر دخول للمنصة:</span>
                    <span className="text-slate-200 font-bold font-mono">{formatArabicDateTime(selectedUser.lastLoginAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                    <LogOut size={12} />
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">توقيت آخر خروج / الحالة:</span>
                    <span className="text-slate-200 font-bold font-mono">
                      {selectedUser.isOnline ? (
                        <span className="text-emerald-400 font-black">متواجد الآن على المنصة 🟢</span>
                      ) : (
                        selectedUser.lastLogoutAt ? formatArabicDateTime(selectedUser.lastLogoutAt) : (selectedUser.lastSeenAt ? formatArabicDateTime(selectedUser.lastSeenAt) : 'غير مسجل')
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Internal Navigation Sub-Tabs */}
            <div className="flex border-b border-white/5 bg-white/[0.02] px-4 gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'overview', label: 'ملخص الحساب والتحكم', icon: Users },
                { id: 'questionnaire', label: 'استبيان العضو', icon: Database },
                { id: 'projects', label: `المشاريع (${selectedUser.userProjects?.length || 0})`, icon: Briefcase },
                { id: 'chats', label: `المرشد الذكي (${selectedUser.userChats?.length || 0})`, icon: Compass },
                { id: 'logs', label: `سجل النشاط (${selectedUser.userLogs?.length || 0})`, icon: Activity }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setUserModalTab(tab.id as any)}
                  className={`flex items-center gap-1.5 py-3 px-2 border-b-2 font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                    userModalTab === tab.id
                      ? 'border-[#FF7E01] text-[#FF7E01]'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <tab.icon size={13} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Modal Tab Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-right">
              
              {/* SUBTAB 1: Overview & Controls */}
              {userModalTab === 'overview' && (
                <div className="space-y-4">
                  {/* Account Status Card */}
                  <div className="bg-[#1E293B]/60 p-4 rounded-xl border border-white/5 space-y-3">
                    <h4 className="font-bold text-white text-xs border-b border-white/5 pb-2">بيانات الحساب وتاريخ التسجيل</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px]">
                      <div>
                        <span className="text-slate-500 block text-[9px]">حالة الحساب</span>
                        <span className={`font-black ${selectedUser.banned ? 'text-red-500' : 'text-green-500'}`}>
                          {selectedUser.banned ? '🔴 محظور ومجمد' : '🟢 نشط ومصرح'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">باقة العضوية</span>
                        <span className="text-white font-black">{selectedUser.subscriptionPlan || 'FREE'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">رصيد النقاط (Tokens)</span>
                        <span className="text-orange-400 font-black font-mono">{(selectedUser.tokens ?? 0).toLocaleString()} نقطة</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">تاريخ التسجيل بالمنصة</span>
                        <span className="text-slate-300 font-mono">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('ar-EG', { dateStyle: 'long' }) : '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">معرف المستخدم (UID)</span>
                        <span className="text-slate-400 font-mono text-[9px] block truncate">{selectedUser.uid || selectedUser.id}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">التوليدات اليومية المجانية</span>
                        <span className="text-slate-300 font-bold">{selectedUser.dailyGenerations || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Immediate Action & Moderation Controls */}
                  <div className="bg-[#1E293B]/60 p-4 rounded-xl border border-white/5 space-y-3">
                    <h4 className="font-bold text-white text-xs border-b border-white/5 pb-2">إجراءات الإدارة والتحكم السريع</h4>
                    <div className="flex gap-2 flex-wrap">
                      {selectedUser.subscriptionPlan !== 'PRO' && (
                        <button 
                          onClick={() => handleManualUpgradeUser(selectedUser.uid || selectedUser.id, selectedUser.email)}
                          className="px-3 py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-lg text-[10px] font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Sparkles size={12} /> ترقية إلى باقة PRO (100,000 نقطة)
                        </button>
                      )}
                      <button 
                        onClick={() => handleAdjustTokens(selectedUser.uid || selectedUser.id, selectedUser.tokens || 0)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Coins size={12} /> شحن وتعديل النقاط
                      </button>
                      <button 
                        onClick={() => handleToggleBanUser(selectedUser.uid || selectedUser.id, !!selectedUser.banned)}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer ${selectedUser.banned ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                      >
                        <Ban size={12} />
                        {selectedUser.banned ? 'إلغاء الحظر' : 'حظر العضو'}
                      </button>
                      <button 
                        onClick={() => handleSendWarning(selectedUser.uid || selectedUser.id)}
                        className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <AlertTriangle size={12} /> توجيه إنذار أمني
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(selectedUser.uid || selectedUser.id)}
                        className="px-3 py-2 bg-red-950 hover:bg-red-900 text-red-400 rounded-lg border border-red-900/50 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={12} /> حذف المستخدم نهائياً
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: User Projects */}
              {userModalTab === 'projects' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Briefcase size={13} className="text-[#FF7E01]" />
                      مشاريع وخخطط العمل التي أنشأها المستخدم ({selectedUser.userProjects?.length || 0})
                    </h4>
                  </div>

                  {(!selectedUser.userProjects || selectedUser.userProjects.length === 0) ? (
                    <div className="p-8 text-center text-slate-500 bg-white/5 border border-dashed border-white/5 rounded-xl">
                      لم يقم هذا المستخدم بإنشاء أي مشروع حتى الآن.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedUser.userProjects.map((p: any, idx: number) => {
                        let parsed = null;
                        try {
                          parsed = typeof p.plan_data === 'string' ? JSON.parse(p.plan_data) : (p.plan_data || {});
                        } catch {}
                        const hasLogo = Boolean(parsed?.identity?.logoSystem || parsed?.identity?.logoConcept);

                        return (
                          <div key={idx} className="bg-[#1E293B]/60 p-3.5 rounded-xl border border-white/5 flex items-center justify-between gap-3 hover:border-white/10 transition-all">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h5 className="text-white font-bold text-xs truncate">{p.project_name || parsed?.projectName || 'مشروع بدون اسم'}</h5>
                                {parsed?.isPro && (
                                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-orange-500/20 text-[#FF7E01] border border-orange-500/30">PRO</span>
                                )}
                                {hasLogo && (
                                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center gap-1">
                                    <Palette size={9} /> شعار مصمم
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-400 text-[10px] line-clamp-1">{p.concept || parsed?.concept || 'لا يوجد وصف'}</p>
                              <span className="text-slate-500 text-[8px] font-mono block">
                                تاريخ الإنشاء: {p.created_at ? new Date(p.created_at).toLocaleDateString('ar-EG', { dateStyle: 'medium' }) : '-'}
                              </span>
                            </div>
                            <button
                              onClick={() => viewProjectDetails({ ...p, planData: p.plan_data, userName: selectedUser.displayName, userEmail: selectedUser.email })}
                              className="px-3 py-1.5 bg-[#FF7E01]/10 hover:bg-[#FF7E01] text-[#FF7E01] hover:text-white rounded-lg font-bold text-[10px] transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <Eye size={12} /> فحص المشروع
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 3: Advisor Chat Sessions */}
              {userModalTab === 'chats' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Compass size={13} className="text-[#FF7E01]" />
                      محادثات وجلسات المرشد الذكي ({selectedUser.userChats?.length || 0})
                    </h4>
                  </div>

                  {(!selectedUser.userChats || selectedUser.userChats.length === 0) ? (
                    <div className="p-8 text-center text-slate-500 bg-white/5 border border-dashed border-white/5 rounded-xl">
                      لا توجد جلسات محادثة مسجلة للمستشار مع هذا المستخدم.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedUser.userChats.map((chat: any, idx: number) => {
                        let msgs = [];
                        try {
                          msgs = Array.isArray(chat.messages) ? chat.messages : (typeof chat.messages === 'string' ? JSON.parse(chat.messages) : []);
                        } catch {}
                        const userMsgsCount = msgs.filter((m: any) => m.role === 'user').length;

                        return (
                          <div key={idx} className="bg-[#1E293B]/60 p-3.5 rounded-xl border border-white/5 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MessageSquare size={13} className="text-cyan-400" />
                                <h5 className="text-white font-bold text-xs">{chat.title || 'محادثة استشارية'}</h5>
                              </div>
                              <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full text-[9px] font-bold border border-cyan-500/20">
                                {userMsgsCount} رسالة مرسلة
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-slate-500 border-t border-white/5 pt-2">
                              <span>معرف الجلسة: <strong className="font-mono text-slate-400">{chat.id?.slice(0, 16)}...</strong></span>
                              <span>آخر تحديث: {chat.updated_at ? new Date(chat.updated_at).toLocaleString('ar-EG') : '-'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 4: User Activity Logs */}
              {userModalTab === 'logs' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Activity size={13} className="text-[#FF7E01]" />
                      سجل النشاط الزمني الكامل للمستخدم ({selectedUser.userLogs?.length || 0})
                    </h4>
                  </div>

                  {(!selectedUser.userLogs || selectedUser.userLogs.length === 0) ? (
                    <div className="p-8 text-center text-slate-500 bg-white/5 border border-dashed border-white/5 rounded-xl">
                      لا توجد سجلات نشاط مسجلة لهذا المستخدم.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedUser.userLogs.map((l: any, idx: number) => (
                        <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between gap-3">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-[#1E293B] border border-white/5 rounded text-[8px] font-bold text-slate-400">
                                {l.details?.module || l.module || 'نظام'}
                              </span>
                              <p className="text-white font-bold text-[11px] truncate">{l.action}</p>
                            </div>
                            {l.details?.projectName && (
                              <p className="text-[9px] text-[#FF7E01] truncate">المشروع: {l.details.projectName}</p>
                            )}
                          </div>
                          <span className="text-slate-400 text-[9px] font-mono shrink-0">
                            {new Date(l.timestamp).toLocaleString('ar-EG')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 5: Questionnaire Form Answers */}
              {userModalTab === 'questionnaire' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-[#FF7E01] border-b border-[#FF7E01]/20 pb-1 flex items-center gap-1.5">
                    <Database size={13} />
                    إجابات استبيان التسجيل (12 خطوة تفصيلية)
                  </h4>

                  {userQuestionnaireData ? (
                    <div className="space-y-3">
                      {/* Step 1: Personal Data */}
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-2">
                        <p className="font-bold text-slate-200 border-b border-white/5 pb-1 text-[10px]">1. البيانات الشخصية والموقع</p>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div><span className="text-slate-500">الاسم الكامل:</span> <span className="text-slate-300 font-bold">{userQuestionnaireData.fullName || '-'}</span></div>
                          <div><span className="text-slate-500">السن:</span> <span className="text-slate-300">{userQuestionnaireData.age || '-'}</span></div>
                          <div><span className="text-slate-500">الجنسية:</span> <span className="text-slate-300">{userQuestionnaireData.nationality || '-'}</span></div>
                          <div><span className="text-slate-500">المدينة / البلد:</span> <span className="text-slate-300">{userQuestionnaireData.city || '-'}</span></div>
                          <div><span className="text-slate-500">الهاتف:</span> <span className="text-slate-300 font-mono">{userQuestionnaireData.phone || '-'}</span></div>
                          <div><span className="text-slate-500">الجنس:</span> <span className="text-slate-300">{userQuestionnaireData.gender || '-'}</span></div>
                          <div className="col-span-2"><span className="text-slate-500">روابط التواصل:</span> <span className="text-slate-300 font-mono">{userQuestionnaireData.socialLinks || '-'}</span></div>
                          <div className="col-span-2"><span className="text-slate-500">حلمك الريادي والهدف الأقصى:</span> <p className="text-slate-300 italic mt-0.5">{userQuestionnaireData.ultimateDream || '-'}</p></div>
                        </div>
                      </div>

                      {/* Step 2: Educational & Professional */}
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-2">
                        <p className="font-bold text-slate-200 border-b border-white/5 pb-1 text-[10px]">2. المسار الأكاديمي والخبرات</p>
                        <div className="space-y-2 text-[10px]">
                          <div><span className="text-slate-500">المستوى التعليمي:</span> <span className="text-slate-300 font-bold">{userQuestionnaireData.educationLevel || '-'}</span></div>
                          <div><span className="text-slate-500">تخصص الدراسة:</span> <span className="text-slate-300">{userQuestionnaireData.fieldOfStudy || '-'}</span></div>
                          <div><span className="text-slate-500">الخبرة المهنية السابقة:</span> <p className="text-slate-300 mt-0.5 leading-relaxed">{userQuestionnaireData.professionalExperience || '-'}</p></div>
                          <div><span className="text-slate-500">الدورات التدريبية المكتسبة:</span> <p className="text-slate-300 mt-0.5">{userQuestionnaireData.trainingCourses || '-'}</p></div>
                          <div><span className="text-slate-500">المهارات الأساسية:</span> <p className="text-slate-300 mt-0.5">{userQuestionnaireData.basicSkills || '-'}</p></div>
                        </div>
                      </div>

                      {/* Step 3: Financial & Capital */}
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-2">
                        <p className="font-bold text-slate-200 border-b border-white/5 pb-1 text-[10px]">3. القدرة التمويلية والموارد</p>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div><span className="text-slate-500">رأس المال المتاح:</span> <span className="text-green-400 font-black">{userQuestionnaireData.availableCapital || '-'}</span></div>
                          <div><span className="text-slate-500">مصادر التمويل المقترحة:</span> <span className="text-slate-300">{userQuestionnaireData.fundingSources || '-'}</span></div>
                          <div className="col-span-2"><span className="text-slate-500">المعدات والموارد المتوفرة حالياً:</span> <p className="text-slate-300 mt-0.5">{userQuestionnaireData.availableEquipment || '-'}</p></div>
                        </div>
                      </div>

                      {/* Step 4: Interests & Talent */}
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-2">
                        <p className="font-bold text-slate-200 border-b border-white/5 pb-1 text-[10px]">4. الشغف والهوايات</p>
                        <div className="space-y-1 text-[10px]">
                          <div><span className="text-slate-500">الهوايات المفضلة:</span> <span className="text-slate-300 font-bold">{userQuestionnaireData.hobbies || '-'}</span></div>
                          <div><span className="text-slate-500">المجالات والقطاعات المثيرة لاهتمامك:</span> <span className="text-slate-300">{userQuestionnaireData.fieldInterests || '-'}</span></div>
                          <div><span className="text-slate-500">المحتوى والصفحات التي تتابعها:</span> <span className="text-slate-300">{userQuestionnaireData.followedContent || '-'}</span></div>
                          <div><span className="text-slate-500">الموهبة أو نقاط قوتك الفطرية:</span> <span className="text-slate-300">{userQuestionnaireData.talent || '-'}</span></div>
                        </div>
                      </div>

                      {/* Step 5: Administration */}
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-2">
                        <p className="font-bold text-slate-200 border-b border-white/5 pb-1 text-[10px]">5. المهارات التنظيمية والتحـديات</p>
                        <div className="space-y-1 text-[10px]">
                          <div><span className="text-slate-500">خبرة الإدارة والتنظيم:</span> <span className="text-slate-300">{userQuestionnaireData.managementExperience || '-'}</span></div>
                          <div><span className="text-slate-500">التحديات المتوقع مواجهتها بالمشروع:</span> <p className="text-slate-300 mt-0.5 leading-relaxed">{userQuestionnaireData.expectedChallenges || '-'}</p></div>
                        </div>
                      </div>

                      {/* Step 6: Custom Preferences */}
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-2">
                        <p className="font-bold text-slate-200 border-b border-white/5 pb-1 text-[10px]">6. الأفكار والتفضيلات الاستثمارية</p>
                        <div className="space-y-2 text-[10px]">
                          <div><span className="text-slate-500">الفكرة الأولية المقترحة:</span> <p className="text-[#FF7E01] font-bold mt-0.5">{userQuestionnaireData.initialIdeas || '-'}</p></div>
                          <div><span className="text-slate-500">ملاحظات مخصصة تود الإشارة إليها:</span> <p className="text-slate-300 mt-0.5 italic">{userQuestionnaireData.specialNotes || '-'}</p></div>
                          <div className="grid grid-cols-2 gap-2 mt-1 pt-1 border-t border-white/5">
                            <div><span className="text-slate-500">تفضيل قطاع الاستثمار:</span> <span className="text-slate-300 font-bold">{userQuestionnaireData.projectTypePreference || '-'}</span></div>
                            <div><span className="text-slate-500">نموذج إدارة العمل المفضل:</span> <span className="text-slate-300 font-bold">{userQuestionnaireData.executionPreference || '-'}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-500 bg-white/5 border border-dashed border-white/5 rounded-lg">
                      لم يكمل هذا المستخدم تعبئة الاستبيان بالكامل بعد.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Project Details & Creator User Lookup (Side-By-Side) */}
      {selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0F172A] w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden transform transition-all">
            
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="space-y-1">
                <h3 className="text-base font-black text-white">{selectedProject.projectName || 'تفاصيل خطة العمل المحفوظة'}</h3>
                <span className="text-[#FF7E01] font-bold text-[9px] bg-[#FF7E01]/10 px-2.5 py-0.5 rounded-full inline-block">خطة منسقة ذكياً بواسطة Business Creator</span>
              </div>
              <button 
                onClick={() => setSelectedProject(null)}
                className="p-2 bg-white/5 hover:bg-red-500 hover:text-white text-slate-400 rounded-xl transition-all"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Split Screen Layout: Owner Profile (Left-Right) */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar text-right" dir="rtl">
              
              {/* Creator Owner LookUp Details Banner */}
              <div className="bg-gradient-to-l from-[#FF7E01]/10 to-transparent p-4 rounded-xl border border-[#FF7E01]/20 space-y-3">
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <UserIcon size={12} className="text-[#FF7E01]" />
                  هوية مالك هذا المشروع ومعلوماته
                </h4>
                {projectOwner ? (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-[11px]">
                    <div className="bg-black/20 p-2.5 rounded-lg">
                      <span className="text-slate-500 block text-[9px] mb-0.5">اسم المالك</span>
                      <span className="text-white font-bold">{projectOwner.displayName || 'مستخدم مجهول'}</span>
                    </div>
                    <div className="bg-black/20 p-2.5 rounded-lg">
                      <span className="text-slate-500 block text-[9px] mb-0.5">البريد الإلكتروني</span>
                      <span className="text-white font-mono">{projectOwner.email}</span>
                    </div>
                    <div className="bg-black/20 p-2.5 rounded-lg">
                      <span className="text-slate-500 block text-[9px] mb-0.5">العضوية</span>
                      <span className="text-[#FF7E01] font-black">{projectOwner.subscriptionPlan || 'FREE'}</span>
                    </div>
                    <div className="bg-black/20 p-2.5 rounded-lg">
                      <span className="text-slate-500 block text-[9px] mb-0.5">نقاط الحساب (Tokens)</span>
                      <span className="text-orange-400 font-black">{projectOwner.tokens ?? 0} نقطة</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-[10px]">تعذر تحميل مستند العضو لمالك المشروع أو الحساب قد تم مسحه سابقاً.</p>
                )}
              </div>

              {/* Project Plan Data Render */}
              <div className="space-y-4">
                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <div className="w-1 h-4 bg-[#FF7E01] rounded-full"></div>
                    المفهوم الاستثماري للمشروع
                  </h4>
                  <div className="bg-[#1E293B]/50 p-4 rounded-xl border border-white/5 text-slate-300 leading-relaxed text-[11px]">
                    {selectedProject.parsedPlan?.concept || 'لم يتم العثور على التفاصيل.'}
                  </div>
                </section>

                <div className="grid md:grid-cols-2 gap-4">
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                      تحليل العقبات والسوق المستهدفة
                    </h4>
                    <div className="bg-[#1E293B]/50 p-4 rounded-xl border border-white/5 space-y-3 h-full">
                      {selectedProject.parsedPlan?.marketAnalysis?.identifiedProblems?.map((prob: any, i: number) => (
                        <div key={i} className="bg-black/20 p-2.5 rounded-lg border border-white/5">
                          <p className="font-bold text-white mb-1 text-[10px]">{prob.problem}</p>
                          <p className="text-[9px] text-slate-400 leading-relaxed">{prob.reasoning}</p>
                        </div>
                      )) || <p className="text-slate-500 italic text-[10px]">لا يتوفر تحليل سوق حالي.</p>}
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                      التوقعات المالية التقديرية
                    </h4>
                    <div className="bg-[#1E293B]/50 p-4 rounded-xl border border-white/5 space-y-2.5 h-full flex flex-col justify-center text-[10px]">
                      <div className="flex justify-between items-center p-2 bg-black/20 rounded-lg">
                        <span className="text-slate-500">التكلفة الإجمالية المطلوبة</span>
                        <span className="text-white font-bold">{selectedProject.parsedPlan?.feasibility?.estimatedCost || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-black/20 rounded-lg">
                        <span className="text-slate-500">العوائد المالية المتوقعة</span>
                        <span className="text-green-400 font-bold">{selectedProject.parsedPlan?.feasibility?.expectedRevenue || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-black/20 rounded-lg">
                        <span className="text-slate-500">نقطة التعادل والاسترداد</span>
                        <span className="text-orange-400 font-bold">{selectedProject.parsedPlan?.feasibility?.breakEvenPoint || '-'}</span>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                    دليل التنفيذ والمراحل الاستراتيجية
                  </h4>
                  <div className="space-y-3">
                    {selectedProject.parsedPlan?.executionGuide?.map((phase: any, i: number) => (
                      <div key={i} className="bg-[#1E293B]/50 p-4 rounded-xl border border-white/5">
                        <h5 className="font-bold text-[#FF7E01] mb-2 text-xs border-b border-white/5 pb-1 block">{phase.phase}</h5>
                        <div className="grid sm:grid-cols-2 gap-2 text-[10px]">
                          {(phase.steps || []).map((step: any, si: number) => (
                            <div key={si} className="flex gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                               <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-slate-500 font-bold">{si+1}</div>
                               <p className="text-slate-300 leading-relaxed">{step.action}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )) || <p className="text-slate-500 text-[10px]">لا تتوفر خطوات تنفيذ حالية.</p>}
                  </div>
                </section>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/5 bg-white/5 flex gap-2">
              <button 
                onClick={() => handleDeleteProject(selectedProject.id)}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-1 w-full"
              >
                <Trash2 size={12} /> حذف المشروع نهائياً من قاعدة البيانات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Audit Flags detailed incident review and resolving drawer */}
      {selectedAuditAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0F172A] w-full max-w-md rounded-2xl border border-white/10 p-5 space-y-4 shadow-2xl relative text-right" dir="rtl">
            <div className="flex justify-between items-start border-b border-white/5 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-black text-[#FF7E01] text-xs">فحص تهديد وتحذير أمني</h3>
                <span className="text-[10px] text-slate-400 font-mono">Incident ID: {selectedAuditAlert.id?.slice(0, 14)}...</span>
              </div>
              <button 
                onClick={() => setSelectedAuditAlert(null)}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg text-red-200">
                <span className="text-[8px] font-bold block uppercase tracking-wider text-red-400">طبيعة المخالفة</span>
                <p className="font-bold text-[11px] mt-1">{selectedAuditAlert.type}</p>
                <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">{selectedAuditAlert.message}</p>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-2">
                <span className="text-[8px] text-slate-500 block font-bold">تفاصيل مرتكب العملية</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                  <div><span className="text-slate-500">الاسم:</span> {selectedAuditAlert.userName}</div>
                  <div><span className="text-slate-500">البريد الإلكتروني:</span> {selectedAuditAlert.userEmail}</div>
                  <div className="col-span-2 font-mono"><span className="text-slate-500">معرف العضو (UID):</span> {selectedAuditAlert.userId}</div>
                </div>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-[9px] text-slate-400 font-mono max-h-24 overflow-y-auto">
                <span className="text-[8px] text-slate-500 block font-bold mb-1">المعطيات الفنية (Raw Data)</span>
                {JSON.stringify(selectedAuditAlert.details || {}, null, 2)}
              </div>
            </div>

            {/* Persistence Admin Actions */}
            <div className="pt-2 border-t border-white/5 flex gap-2">
              <button 
                onClick={() => {
                  handleToggleBanUser(selectedAuditAlert.userId, false);
                  setSelectedAuditAlert(null);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[10px]"
              >
                حظر الحساب فوراً
              </button>
              <button 
                onClick={() => {
                  handleSendWarning(selectedAuditAlert.userId);
                  setSelectedAuditAlert(null);
                }}
                className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold text-[10px]"
              >
                تنبيه وإنذار أمني
              </button>
              <button 
                onClick={() => {
                  setStats(prev => prev ? { ...prev, auditFlags: prev.auditFlags.filter(af => af.id !== selectedAuditAlert.id) } : null);
                  setSelectedAuditAlert(null);
                  alert("تم حل المشكلة وتوثيق الأمان.");
                }}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-[10px]"
              >
                تحديد كتم حلها
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
