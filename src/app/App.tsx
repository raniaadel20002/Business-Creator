
import React, { useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import WizardForm from '../features/wizard/components/WizardForm';
import Loader from '../components/ui/Loader';
import Login from '../features/auth/components/Login';
import ClarifyingQuestions from '../features/projects/components/ClarifyingQuestions';
import ProjectReveal from '../features/projects/components/ProjectReveal';
import Logo from '../components/shared/Logo';
import ToastMessage from '../components/ui/ToastMessage';
import FloatingNav from '../components/ui/FloatingNav';
import TempPaymentModal from '../features/payments/components/TempPaymentModal';
import { InsufficientTokensCard } from '../features/payments/components/InsufficientTokensCard';

// Route-level lazy chunks — loaded only when the user navigates to that view
const BusinessDashboard = lazy(() => import('../features/dashboard/components/BusinessDashboard'));
const AdminDashboard = lazy(() => import('../features/admin/components/AdminDashboard'));
const SavedPlans = lazy(() => import('../features/projects/components/SavedPlans'));
const Profile = lazy(() => import('../features/auth/components/Profile'));
const Notifications = lazy(() => import('../features/notifications/components/Notifications'));
const PricingSection = lazy(() => import('../features/payments/components/PricingSection'));
const About = lazy(() => import('../features/pages/About'));
const Partners = lazy(() => import('../features/pages/Partners'));
const PrivacyPolicy = lazy(() => import('../features/pages/PrivacyPolicy'));
const Feedback = lazy(() => import('../features/pages/Feedback'));
import { TEMP_PAYMENT_CONFIG } from '../api/paymentClient';
import { createNotification, subscribeToNotifications } from '../services/notificationService';
import { useAuth } from '../features/auth/context/AuthContext';
import { UserData, BusinessPlan, SubscriptionTier, SavedProject, TOKEN_COSTS } from '../types/types';
import { getDailyGenerationStatus } from '../hooks/useGenerationStatus';
import { sendPlanConfirmationEmail, sendProjectReadyEmail, sendBalanceDepletedEmail } from '../api/emailClient';
import { supabase, runAiTask, processedTaskIds, subscribeToTaskCompletions, handleSupabaseError } from '../services/supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  LayoutDashboard,
  History,
  Home,
  Building2,
  Info,
  LogIn,
  Handshake,
  Shield,
  Menu,
  X,
  User,
  ChevronRight,
  ChevronLeft,
  Save,
  Share2,
  Check,
  Search,
  ListChecks,
  DollarSign,
  Rocket,
  Wrench,
  PlusCircle,
  Download,
  RefreshCw,
  Target,
  Palette,
  Briefcase,
  Users,
  ShieldCheck,
  LineChart,
  BarChart,
  PieChart,
  MessageCircle,
  Facebook,
  Twitter,
  Linkedin,
  Link,
  Compass,
  Landmark,
  Lock,
  Route,
  UserCog,
  Instagram,
  Bell
} from 'lucide-react';

// Store imports
import { useAppStore, ViewType } from '../store/appStore';
import { useNotificationStore } from '../store/notificationStore';

// Legacy alias for compatibility with components not yet updated
const handleFirestoreError = handleSupabaseError;

function cleanUndefined<T>(obj: T): T {
  if (obj === undefined) return null as any;
  if (obj === null) return null as any;
  if (Array.isArray(obj)) return obj.map(cleanUndefined) as any;
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj as object)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val);
      }
    }
    return cleaned;
  }
  return obj;
}

// Maps a Supabase projects row to the SavedProject shape
function mapDbToSavedProject(row: any): SavedProject {
  let planData: any = {};
  try {
    planData = typeof row.plan_data === 'string' ? JSON.parse(row.plan_data) : (row.plan_data || {});
  } catch (e) {
    console.warn('Failed to parse plan_data for project', row.id);
  }
  return {
    ...planData,
    id: row.id,
    userId: row.user_id,
    projectName: row.project_name || planData?.projectName || '',
    concept: row.concept || planData?.concept || '',
    type: row.type || planData?.type || 'business',
    status: row.status,
    createdAt: row.created_at,
    planData: row.plan_data,
  } as SavedProject;
}

const insertActiveProject = async (userId: string, planToSave: BusinessPlan): Promise<BusinessPlan> => {
  await supabase
    .from('projects')
    .update({ status: 'inactive' })
    .eq('user_id', userId)
    .eq('status', 'active');

  const projectId = crypto.randomUUID();
  const planWithId = cleanUndefined({ ...planToSave, id: projectId });

  const { error } = await supabase.from('projects').insert({
    id: projectId,
    user_id: userId,
    project_name: planWithId.projectName || '',
    concept: planWithId.concept || '',
    type: planWithId.type || 'business',
    plan_data: JSON.stringify(planWithId),
    status: 'active',
    created_at: new Date().toISOString()
  });

  if (error) throw error;
  return planWithId;
};

const updateStoredProjectPlan = async (updatedPlan: BusinessPlan) => {
  if (updatedPlan.id) {
    await supabase.from('projects').update({
      plan_data: JSON.stringify(cleanUndefined(updatedPlan)),
      project_name: updatedPlan.projectName || '',
      concept: updatedPlan.concept || '',
      type: updatedPlan.type || 'business'
    }).eq('id', updatedPlan.id);
  }
};

const validViews: ViewType[] = ['home', 'form', 'loading', 'dashboard', 'saved-plans', 'about', 'login', 'partners', 'privacy', 'profile', 'questions', 'admin', 'pricing', 'reveal', 'feedback', 'notifications'];

const getInitialView = (): ViewType => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as ViewType;
    if (viewParam && validViews.includes(viewParam)) {
      return viewParam;
    }
    const hash = window.location.hash.replace('#', '') as ViewType;
    return validViews.includes(hash) ? hash : 'home';
  }
  return 'home';
};

const App: React.FC = () => {
  // ---- Store state ----
  const {
    view, setView,
    initialFormStep, setInitialFormStep,
    loadingStage, setLoadingStage,
    plan, setPlan,
    activeProject, setActiveProject,
    upgradeIntentProject, setUpgradeIntentProject,
    loadingProject, setLoadingProject,
    projectsList, setProjectsList,
    loadingProjects, setLoadingProjects,
    selectedSavedPlan, setSelectedSavedPlan,
    error, setError,
    successMsg, setSuccessMsg,
    isSidebarOpen, setIsSidebarOpen,
    isSidebarCollapsed, setIsSidebarCollapsed,
    isFocusMode, setIsFocusMode,
    isLeftSidebarOpen, setIsLeftSidebarOpen,
    isLeftSidebarCollapsed, setIsLeftSidebarCollapsed,
    activeDashboardTab, setActiveDashboardTab,
    isSaving, setIsSaving,
    saveSuccess, setSaveSuccess,
    isCopied, setIsCopied,
    showShareModal, setShowShareModal,
    isGenerating, setIsGenerating,
    pendingFormData, setPendingFormData,
    isCompletingPro, setIsCompletingPro,
    isLoadingPlanTarget, setIsLoadingPlanTarget,
    showTempPaymentModal, setShowTempPaymentModal,
  } = useAppStore();

  const { addGlobalNotification, notifications, unreadNotificationsCount, setUnreadNotificationsCount } = useNotificationStore();

  const { user, profile, updateProfile, loading: authLoading } = useAuth();

  // Initialize view from URL on first mount
  useEffect(() => {
    setView(getInitialView());
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    if (stepParam) {
      const stepNum = parseInt(stepParam, 10);
      if (!isNaN(stepNum)) setInitialFormStep(stepNum);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    if (view === 'form') {
      setIsFocusMode(true);
    }
  }, [view, setIsFocusMode]);

  const activeUserData = profile?.userData || pendingFormData;

  // Stable refs used inside callbacks to avoid stale closures
  const viewRef = useRef(view);
  const activeProjectRef = useRef(activeProject);
  const planRef = useRef(plan);
  const activeDashboardTabRef = useRef(activeDashboardTab);

  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { activeProjectRef.current = activeProject; }, [activeProject]);
  useEffect(() => { planRef.current = plan; }, [plan]);
  useEffect(() => { activeDashboardTabRef.current = activeDashboardTab; }, [activeDashboardTab]);

  const isProcessingFormRef = useRef(false);
  const isCompletingProRef = useRef(false);
  const processedPendingFormDataRef = useRef<UserData | null>(null);
  const taskStatusBaselineRef = useRef<{[id: string]: string}>({});

  const handleBackgroundChatCompletion = useCallback(async (taskId: string, taskData: any) => {
    const sessionId = taskData.payload?.sessionId;
    const responseText = taskData.result?.text;

    if (!sessionId || !responseText) return;

    try {
      const { data: sessionData, error } = await supabase
        .from('chat_sessions')
        .select('messages')
        .eq('id', sessionId)
        .single();

      if (!error && sessionData) {
        const messages = sessionData.messages || [];
        const hasResponse = messages.some((m: any) => m.role === 'model' && m.content === responseText);

        if (!hasResponse) {
          const aiMessage = {
            role: 'model',
            content: responseText,
            timestamp: new Date().toISOString()
          };
          await supabase
            .from('chat_sessions')
            .update({
              messages: [...messages, aiMessage],
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);

          console.log(`Saved background chat message for session ${sessionId}`);
        }
      }
    } catch (err) {
      console.error("Error saving background chat response:", err);
    }
  }, []);

  const handleBackgroundLogoCompletion = useCallback(async (taskId: string, taskData: any) => {
    const logoResult = taskData.result;
    if (!logoResult) return;

    try {
      const projectToUpdate = activeProjectRef.current || planRef.current;
      if (projectToUpdate && projectToUpdate.id) {
        const currentLogoExplanation = projectToUpdate.identity?.logoSystem?.logoConceptExplanation;
        const newLogoExplanation = logoResult.logoConceptExplanation;

        if (currentLogoExplanation !== newLogoExplanation) {
          const updatedPlan = {
            ...projectToUpdate,
            identity: {
              ...projectToUpdate.identity,
              logoSystem: logoResult
            }
          };

          await supabase.from('projects').update({
            plan_data: JSON.stringify(updatedPlan),
            project_name: updatedPlan.projectName || '',
            concept: updatedPlan.concept || '',
            type: updatedPlan.type || 'business'
          }).eq('id', projectToUpdate.id);

          if (activeProjectRef.current && activeProjectRef.current.id === projectToUpdate.id) {
            setActiveProject(updatedPlan);
          }
          if (planRef.current && planRef.current.id === projectToUpdate.id) {
            setPlan(updatedPlan);
          }
          console.log(`Saved background logo system for project ${projectToUpdate.id}`);
        }
      }
    } catch (err) {
      console.error("Error saving background logo completion:", err);
    }
  }, [setActiveProject, setPlan]);

  const handleBackgroundPlanSave = useCallback(async (planToSave: BusinessPlan) => {
    if (!user) return;
    try {
      const planWithId = await insertActiveProject(user.id, planToSave);
      setActiveProject(planWithId);
      setPlan(planWithId);
      console.log(`Saved background plan as active project: ${planWithId.id}`);
    } catch (err) {
      console.error("Error saving background plan:", err);
    }
  }, [user?.id, setActiveProject, setPlan]);

  // Unified background task resolution handler
  const handleTaskResolution = useCallback(async (taskId: string, taskData: any) => {
    if (processedTaskIds.has(taskId)) {
      return;
    }
    processedTaskIds.add(taskId);

    // If it is a synchronous HTTP task, it is already handled inline by the direct caller.
    if (taskId && taskId.startsWith('http-task-')) {
      return;
    }

    if (taskData.status === 'completed') {
      if (taskData.type === 'chat_message') {
        await handleBackgroundChatCompletion(taskId, taskData);

        const isAdvisorChatOpen = (viewRef.current === 'dashboard' || (viewRef.current === 'home' && activeProjectRef.current)) && activeDashboardTabRef.current === 'advisor';

        if (!isAdvisorChatOpen) {
          addGlobalNotification({
            id: taskId,
            title: 'الرد من المرشد جاهز',
            message: 'مرشدك الاستراتيجي الذكي قام بالرد على سؤالك. تفضل بقراءة الرد ومتابعة النقاش.',
            type: 'chat_message',
            actionLabel: 'ذهاب للشات',
            onAction: () => {
              if (activeProjectRef.current) setPlan(activeProjectRef.current);
              setView('dashboard');
              setActiveDashboardTab('advisor');
            }
          });
        }
      } else if (taskData.type === 'generate_logo') {
        await handleBackgroundLogoCompletion(taskId, taskData);

        if (user) {
          createNotification(
            user.id,
            'اكتمال إنشاء الشعار والهوية البصرية',
            `تم تصميم شعار رائع ومقترحات هوية بصرية مخصصة لمشروعك "${taskData.payload?.projectName || ''}" بنجاح.`,
            'logo_created'
          );
        }

        addGlobalNotification({
          id: taskId,
          title: 'شعار مشروعك الجديد جاهز',
          message: `لقد صممنا شعاراً رائعاً ومقترحات هوية بصرية مميزة لمشروعك "${taskData.payload?.projectName || 'الحالي'}".`,
          type: 'generate_logo',
          actionLabel: 'عرض الهوية والشعار',
          onAction: () => {
            if (activeProjectRef.current) setPlan(activeProjectRef.current);
            setView('dashboard');
            setActiveDashboardTab('branding');
          }
        });
      } else if (taskData.type === 'generate_plan') {
        const generatedPlan = taskData.result;
        if (generatedPlan) {
          if (generatedPlan.clarifyingQuestions && generatedPlan.clarifyingQuestions.length > 0) {
            setPlan(generatedPlan);
            addGlobalNotification({
              id: taskId,
              title: 'تحتاج الخطة إلى بعض التوضيحات',
              message: 'النظام يحتاج لإجابة على بضعة أسئلة لتخصيص خطة العمل بدقة كاملة.',
              type: 'generate_plan',
              actionLabel: 'إجابة الأسئلة',
              onAction: () => {
                setPlan(generatedPlan);
                setView('questions');
              }
            });
          } else {
            await handleBackgroundPlanSave(generatedPlan);
            if (user && user.email) {
              try {
                await sendProjectReadyEmail(user.email, generatedPlan.projectName, generatedPlan.concept, profile?.userData?.gender);
              } catch (e) {
                console.warn('Failed to send project ready email in background task listener:', e);
              }
            }
            addGlobalNotification({
              id: taskId,
              title: 'خارطة طريق مشروعك جاهزة',
              message: `انتهى نظام الذكاء الاصطناعي من بناء خطة العمل المتكاملة لمشروعك "${generatedPlan.projectName}".`,
              type: 'generate_plan',
              actionLabel: 'استكشاف الخطة',
              onAction: () => {
                setPlan(generatedPlan);
                setActiveProject(() => generatedPlan);
                setView('dashboard');
                setActiveDashboardTab('overview');
              }
            });
          }
        }
      } else if (taskData.type === 'complete_pro') {
        const currentPlan = activeProjectRef.current || planRef.current;
        if (currentPlan && taskData.result) {
          const updatedPlan = { ...currentPlan, ...taskData.result, isPro: true };
          await updateStoredProjectPlan(updatedPlan);
          if (activeProjectRef.current && activeProjectRef.current.id === updatedPlan.id) {
            setActiveProject(updatedPlan);
          }
          if (planRef.current && planRef.current.id === updatedPlan.id) {
            setPlan(updatedPlan);
          }

          addGlobalNotification({
            id: taskId,
            title: 'ترقية رائد الأعمال مكتملة',
            message: `تم تفعيل وتفصيل خطة الـ PRO لمشروعك "${updatedPlan.projectName}" بالكامل.`,
            type: 'complete_pro',
            actionLabel: 'عرض الخطة التفصيلية',
            onAction: () => {
              setPlan(updatedPlan);
              setView('dashboard');
              setActiveDashboardTab('overview');
            }
          });
        }
      }
    } else if (taskData.status === 'failed') {
      addGlobalNotification({
        id: taskId,
        title: 'فشلت العملية بالخلفية',
        message: `عذراً، حدث خطأ أثناء معالجة طلبك: ${taskData.errorMessage || 'خطأ غير معروف'}`,
        type: 'error',
        actionLabel: 'إغلاق',
        onAction: () => {}
      });
    }
  }, [handleBackgroundChatCompletion, handleBackgroundLogoCompletion, handleBackgroundPlanSave, addGlobalNotification, setPlan, setView, setActiveDashboardTab, setActiveProject, user, profile]);

  const handleTaskResolutionRef = useRef(handleTaskResolution);
  useEffect(() => {
    handleTaskResolutionRef.current = handleTaskResolution;
  }, [handleTaskResolution]);

  // Real-time background task listener
  useEffect(() => {
    if (!user?.id) {
      useNotificationStore.getState().clearAll();
      taskStatusBaselineRef.current = {};
      return;
    }

    let isCancelled = false;

    const unsubscribeSession = subscribeToTaskCompletions((taskId, taskData) => {
      if (!isCancelled) {
        handleTaskResolutionRef.current(taskId, taskData);
      }
    });

    return () => {
      isCancelled = true;
      unsubscribeSession();
    };
  }, [user?.id]);

  const prevNotifIdsRef = useRef<Set<string>>(new Set());
  const isInitialNotifLoadRef = useRef(true);

  // Real-time persistent notifications listener
  useEffect(() => {
    if (!user?.id) {
      setUnreadNotificationsCount(0);
      prevNotifIdsRef.current.clear();
      isInitialNotifLoadRef.current = true;
      return;
    }

    const unsubscribe = subscribeToNotifications(user.id, (data) => {
      const unread = data.filter(n => !n.read).length;
      setUnreadNotificationsCount(unread);

      if (!isInitialNotifLoadRef.current && Array.isArray(data)) {
        const newlyArrived = data.filter(n => n.id && !prevNotifIdsRef.current.has(n.id) && !n.read);
        newlyArrived.forEach(n => {
          addGlobalNotification({
            id: n.id || `notif-${Date.now()}`,
            type: 'info',
            title: n.title,
            message: n.message,
            actionLabel: 'فتح الإشعار',
            onAction: () => setView('notifications')
          });
        });
      }

      if (Array.isArray(data)) {
        data.forEach(n => {
          if (n.id) prevNotifIdsRef.current.add(n.id);
        });
      }
      isInitialNotifLoadRef.current = false;
    });

    return unsubscribe;
  }, [user?.id, setUnreadNotificationsCount, addGlobalNotification, setView]);

  // Persistent real-time listener for user projects (subscribes only when viewing saved plans)
  useEffect(() => {
    if (!user?.id || view !== 'saved-plans') {
      setProjectsList([]);
      setLoadingProjects(false);
      return;
    }

    setLoadingProjects(true);

    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setProjectsList(data.map(mapDbToSavedProject));
      }
      setLoadingProjects(false);
    };

    fetchProjects();

    const channel = supabase
      .channel(`projects:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${user.id}` }, () => {
        fetchProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, view, setProjectsList, setLoadingProjects]);

  useEffect(() => {
    const handleHashChange = () => {
      setIsSidebarOpen(false);
      setIsLeftSidebarOpen(false);
      const hash = window.location.hash.replace('#', '') as ViewType;
      if (validViews.includes(hash)) {
        setView(hash);
      } else if (!hash) {
        setView('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setIsSidebarOpen, setIsLeftSidebarOpen, setView]);

  useEffect(() => {
    const currentHash = window.location.hash.replace('#', '');
    if (currentHash !== view) {
      if (view === 'home' && currentHash === '') {
        // do nothing
      } else if (view === 'home') {
        window.history.pushState(null, '', window.location.pathname + window.location.search);
      } else {
        window.location.hash = view;
      }
    }
  }, [view]);

  useEffect(() => {
    const hasProjectVisible = (view === 'home' && !!activeProject && !isGenerating) || (view === 'dashboard' && !!plan);
    if (hasProjectVisible) {
      setIsLeftSidebarCollapsed(false);
      if (window.innerWidth >= 1024) {
        setIsLeftSidebarOpen(true);
      } else {
        setIsLeftSidebarOpen(false);
      }
    } else {
      setIsLeftSidebarOpen(false);
    }
  }, [view, activeProject, plan, isGenerating, setIsLeftSidebarCollapsed, setIsLeftSidebarOpen]);

  // Keep track of the last active view to return to after payment
  useEffect(() => {
    if (view && view !== 'pricing' && view !== 'loading' && view !== 'login') {
      localStorage.setItem('lastActiveView', view);
    }
  }, [view]);

  // Synchronize plan with activeProject if on dashboard and plan is null
  useEffect(() => {
    if (view === 'dashboard' && !plan && activeProject) {
      setPlan(activeProject);
    }
  }, [view, plan, activeProject, setPlan]);

  // Redirect to home if on dashboard with no plan and no activeProject
  useEffect(() => {
    if (view === 'dashboard' && !plan && !activeProject && !loadingProject) {
      setView('home');
    }
  }, [view, plan, activeProject, loadingProject, setView]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const paymentStatus = params.get('payment_status');
    const isSuccess = success === 'true' || paymentStatus === 'mock_passed';

    const handleSuccess = async () => {
      if (paymentStatus === 'mock_passed' && profile?.subscriptionPlan !== 'PRO') {
        try {
          await updateProfile({ subscriptionPlan: 'PRO', tokens: (profile?.tokens || 0) + 100000 });
        } catch (e) {
          console.error(e);
        }
      }

      if (user && user.email) {
        sendPlanConfirmationEmail(user.email, 'PRO', '499', profile?.userData?.gender);
      }

      setSuccessMsg('شكرا علي ثقتك في business creator');

      const storedIntent = localStorage.getItem('upgradeIntentProjectId');
      if (storedIntent) {
        localStorage.removeItem('upgradeIntentProjectId');
        handleAutoCompletePro(storedIntent);
      } else {
        setView('profile');
      }

      params.delete('success');
      params.delete('id');
      params.delete('pending');
      params.delete('payment_status');
      params.delete('planId');
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    };

    if (isSuccess && user && profile) {
      handleSuccess();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const handleAutoCompletePro = async (projectId: string) => {
    setView('home');
    setIsGenerating(true);
    setLoadingStage(4);
    setIsCompletingPro(true);
    try {
      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (!error && projectData) {
        const currentPlan = { id: projectData.id, ...JSON.parse(projectData.plan_data) } as BusinessPlan;

        const partialProPlan = await runAiTask('complete_pro', { currentPlan }, user!.id);

        await supabase.from('users').update({
          tokens: (profile?.tokens || 0) - 25000
        }).eq('id', user!.id);

        const updatedPlan = { ...currentPlan, ...partialProPlan, isPro: true };
        await supabase.from('projects').update({
          plan_data: JSON.stringify(cleanUndefined(updatedPlan)),
          project_name: updatedPlan.projectName || '',
          concept: updatedPlan.concept || '',
          type: updatedPlan.type || 'business'
        }).eq('id', projectId);

        if (plan && plan.id === projectId) setPlan(updatedPlan);
        if (activeProject && activeProject.id === updatedPlan.id) setActiveProject(updatedPlan);

        setSuccessMsg('شكرا علي ثقتك في business creator');
        const lastActiveView = localStorage.getItem('lastActiveView') as ViewType;
        if (lastActiveView && validViews.includes(lastActiveView)) {
          setView(lastActiveView);
        } else {
          setView('dashboard');
        }
      } else {
        setView('saved-plans');
      }
    } catch (autoErr: any) {
      setError(autoErr.message || 'حدث خطأ أثناء الاستكمال التلقائي للمشروع.');
      setView('dashboard');
    } finally {
      setIsCompletingPro(false);
      setIsGenerating(false);
      setUpgradeIntentProject(null);
    }
  };

  const logActivity = useCallback(async (action: string, module: string, details?: any) => {
    if (!user || !user.id) return;
    try {
      const { error } = await supabase.from('logs').insert({
        user_id: user.id,
        user_name: profileRef.current?.displayName || user.user_metadata?.full_name || user.email || 'Unknown',
        user_email: user.email || '',
        action,
        details: details ? { module, ...details } : { module },
        timestamp: new Date().toISOString()
      });
      if (error) {
        // Non-blocking telemetry warning
      }
    } catch (err) {
      // Non-blocking telemetry
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      const nowIso = new Date().toISOString();
      logActivity('تسجيل دخول وتواجد بالمنصة (User Session Start)', 'Auth', { entryTime: nowIso });

      const handleBeforeUnload = () => {
        const exitIso = new Date().toISOString();
        try {
          supabase.from('logs').insert({
            user_id: user.id,
            user_name: profileRef.current?.displayName || user.user_metadata?.full_name || user.email || 'Unknown',
            user_email: user.email,
            action: 'مغادرة المنصة / إغلاق الجلسة (User Session End)',
            details: { exitTime: exitIso, module: 'Auth' },
            timestamp: exitIso
          });
        } catch (e) {}
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;
    const fetchActiveProject = async () => {
      if (!user?.id) {
        if (isMounted) {
          setActiveProject(null);
          setPlan(null);
          setLoadingProject(false);
        }
        return;
      }
      if (isMounted) setLoadingProject(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1)
          .single();

        if (isMounted) {
          if (!error && data) {
            setActiveProject({ ...JSON.parse(data.plan_data), id: data.id });
          } else {
            setActiveProject(null);
          }
        }
      } catch (err) {
        console.error("Error fetching active project:", err);
        if (isMounted) setError("حدث خطأ أثناء تحميل مشروعك.");
      } finally {
        if (isMounted) setLoadingProject(false);
      }
    };
    fetchActiveProject();
    return () => {
      isMounted = false;
    };
  }, [user?.id, setActiveProject, setPlan, setLoadingProject, setError]);

  const handleSaveToAccount = async (planToSave: BusinessPlan & { id?: string }, isSilent: boolean = false) => {
    if (!user) return;

    if (planToSave.id) {
      if (!isSilent) setIsSaving(true);
      try {
        const cleanedPlan = cleanUndefined(planToSave);
        await updateStoredProjectPlan(cleanedPlan);

        setActiveProject(cleanedPlan);
        setPlan(cleanedPlan);

        if (!isSilent) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      } catch (error) {
        console.error("Error updating project:", error);
        const errorMessage = error instanceof Error ? error.message : "حدث خطأ أثناء الحفظ.";
        if (!isSilent) setError(errorMessage);
      } finally {
        if (!isSilent) setIsSaving(false);
      }
      return;
    }

    if (!isSilent) setIsSaving(true);
    try {
      const planWithId = await insertActiveProject(user.id, planToSave);

      await logActivity('Save Project', 'Dashboard', { projectName: planToSave.projectName });

      setActiveProject(planWithId);
      setPlan(planWithId);

      if (!isSilent) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error saving project:", error);
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ أثناء الحفظ.";
      if (!isSilent) setError(errorMessage);
    } finally {
      if (!isSilent) setIsSaving(false);
    }
  };

  const handleShare = async () => {
    const currentPlan = plan || activeProject;
    if (!currentPlan) return;
    const shareText = `أعمل حالياً على بناء مشروع "${currentPlan.projectName}" بناءً على خارطة طريق ذكية لخطوات التنفيذ، اطلع عليها من خلال منصة Business Creator.`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: currentPlan.projectName,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Error sharing:", err);
          setShowShareModal(true);
        }
      }
    } else {
      setShowShareModal(true);
    }
  };

  const handleNavClick = (newView: any) => {
    if (newView === 'menu') {
      setIsSidebarOpen(true);
      setIsLeftSidebarOpen(false);
      return;
    }
    setView(newView);
    setIsSidebarOpen(false);
    setIsLeftSidebarOpen(false);
    setUpgradeIntentProject(null);
    if (newView !== 'dashboard' && newView !== 'home') {
      setPlan(null);
    }
    if (newView === 'form') {
      setInitialFormStep(undefined);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      if (isSidebarOpen || (isLeftSidebarOpen && isMobile)) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = 'auto';
    };
  }, [isSidebarOpen, isLeftSidebarOpen]);

  const handleViewPlan = (savedPlan: BusinessPlan) => {
    setPlan(savedPlan);
    setView('dashboard');
  };

  const handleExecutePlan = () => {
    if (plan) {
      logActivity('Execute Plan', 'Dashboard', { projectName: plan.projectName });
      setActiveProject(plan);
      setView('home');
    }
  };

  const handleCompleteProPlan = async () => {
    if (isCompletingProRef.current) return;
    isCompletingProRef.current = true;

    const currentPlan = activeProject || plan;
    if (!currentPlan || currentPlan.isPro) {
      isCompletingProRef.current = false;
      return;
    }

    if (!profile) {
      setError("يرجى تسجيل الدخول أو إنشاء حساب للحصول على النقاط وترقية مشروعك.");
      isCompletingProRef.current = false;
      return;
    }

    const userTokens = profile.tokens || 0;
    if (userTokens < TOKEN_COSTS.COMPLETE_PRO_PLAN) {
      setError(`عفواً، لقد نفد رصيدك من النقاط. يرجى شراء باقة جديدة لاستكمال مميزات مشروع رائد الأعمال.`);
      if (user && user.email) {
        sendBalanceDepletedEmail(user.email, userTokens, profile?.userData?.gender);
      }
      setUpgradeIntentProject(currentPlan);
      isCompletingProRef.current = false;
      return;
    }

    setIsCompletingPro(true);
    setView('home');
    setIsGenerating(true);
    setLoadingStage(4);
    setError(null);
    try {
      await updateProfile({ tokens: userTokens - TOKEN_COSTS.COMPLETE_PRO_PLAN });

      const partialProPlan = await runAiTask('complete_pro', { currentPlan }, user!.id);

      const updatedPlan = { ...currentPlan, ...partialProPlan, isPro: true };
      await updateStoredProjectPlan(updatedPlan);

      if (activeProject && activeProject.id === updatedPlan.id) {
        setActiveProject(updatedPlan);
      }
      if (plan && plan.id === updatedPlan.id) {
        setPlan(updatedPlan);
      } else if (!activeProject) {
        setPlan(updatedPlan);
      }

      setView('dashboard');
      setSuccessMsg('تم استكمال مشروعك بنجاح! جميع مميزات خطة رائد الأعمال متاحة الآن.');

      if (user?.id) {
        await createNotification(
          user.id,
          'تم استكمال خطة العمل الاحترافية بنجاح!',
          `تم تفعيل وتحليل كافة المحاور والدراسات الاحترافية لمشروعك "${currentPlan.projectName}" بالكامل.`,
          'project_created',
          false,
          true
        );
      }

      await logActivity('Complete Pro Plan', 'Dashboard', { projectName: currentPlan.projectName });
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء ترقية المشروع. يرجى المحاولة لاحقاً.');
      setView('dashboard');
      if (userTokens >= 25000) {
        try { await updateProfile({ tokens: userTokens }); } catch (e) {}
      }
    } finally {
      setIsGenerating(false);
      setIsCompletingPro(false);
      isCompletingProRef.current = false;
    }
  };

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (!user) {
      setView('login');
      return;
    }

    setIsLoadingPlanTarget(tier);
    setError(null);
    try {
      const wasFree = profile?.subscriptionPlan !== 'PRO';

      if (tier === 'PRO') {
        if (TEMP_PAYMENT_CONFIG.IS_TEMP_PAYMENT_ENABLED) {
          if (upgradeIntentProject) {
            localStorage.setItem('upgradeIntentProjectId', upgradeIntentProject.id || '');
          }
          setShowTempPaymentModal(true);
          setIsLoadingPlanTarget(null);
          return;
        }

        try {
          if (upgradeIntentProject) {
            localStorage.setItem('upgradeIntentProjectId', upgradeIntentProject.id || '');
          }
          const res = await fetch('/api/paymob-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
              amount: 499,
              planId: 'PRO'
            })
          });

          const data = await res.json();
          if (res.ok && data.isMock) {
            try {
              await updateProfile({ subscriptionPlan: 'PRO', tokens: (profile?.tokens || 0) + 100000 });
              if (user && user.email) {
                try {
                  await sendPlanConfirmationEmail(user.email, 'PRO', '499', profile?.userData?.gender);
                } catch (e) {
                  console.warn('Failed to send confirmation email', e);
                }
              }
              setSuccessMsg('شكرا علي ثقتك في business creator');
              const storedIntent = localStorage.getItem('upgradeIntentProjectId');
              if (storedIntent) {
                localStorage.removeItem('upgradeIntentProjectId');
                handleAutoCompletePro(storedIntent);
              } else {
                setView('profile');
              }
            } catch (e) {
              console.error(e);
              setError('فشل في إتمام عملية الترقية التجريبية.');
            }
            setIsLoadingPlanTarget(null);
            return;
          } else if (res.ok && data.iframeUrl) {
            window.location.href = data.iframeUrl;
            return;
          } else {
            console.error('Paymob error:', data);
            setError(data.error || 'فشل في بدء عملية الدفع');
            setIsLoadingPlanTarget(null);
            return;
          }
        } catch (checkoutErr: any) {
          console.error(checkoutErr);
          setError('حدث خطأ أثناء الاتصال ببوابة الدفع.');
          setIsLoadingPlanTarget(null);
          return;
        }
      } else {
        await updateProfile({ subscriptionPlan: tier });
        await logActivity('Select Pricing Plan', 'Pricing', { plan: tier });
        if (user.email) {
          try {
            await sendPlanConfirmationEmail(user.email, tier, '0', profile?.userData?.gender);
          } catch(e) { }
        }
        setSuccessMsg(`تم اختيار خطة البداية بنجاح! يمكنك الآن البدء في إنشاء مشروعك.`);
        setView('form');
        setIsLoadingPlanTarget(null);
      }
    } catch (err) {
      console.error("Failed to update plan:", err);
      setError("حدث خطأ أثناء تحديث الخطة. يرجى المحاولة مرة أخرى.");
      setIsLoadingPlanTarget(null);
    }
  };

  const navItems = [
    { id: 'home', label: 'لوحة التحكم', icon: Building2 },
    { id: 'form', label: 'بناء مشروع جديد', icon: PlusCircle },
    { id: 'saved-plans', label: 'مشاريعي', icon: History },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'pricing', label: 'الباقات والترقية', icon: DollarSign },
    { id: 'partners', label: 'شركاء التنفيذ', icon: Handshake },
    { id: 'about', label: 'كيف تعمل المنصة؟', icon: Info },
    { id: 'privacy', label: 'سياسة الخصوصية', icon: Shield },
    { id: 'feedback', label: 'شاركنا رأيك', icon: MessageCircle },
  ] as const;

  const isAdmin = user?.email === 'ashrafmena999@gmail.com';

  const filteredNavItems = [
    ...navItems,
    ...(isAdmin ? [{ id: 'admin', label: 'لوحة التحكم (Admin)', icon: LayoutDashboard }] : [])
  ];

  const allDashboardTabs = [
    { id: 'overview', label: 'نظرة عامة', icon: Info },
    { id: 'branding', label: 'الهوية التجارية', icon: Palette, isProFeature: true },
    { id: 'marketAnalysis', label: 'تحليل السوق', icon: LineChart, isProFeature: true },
    { id: 'validation', label: 'السوق', icon: Search },
    { id: 'targetAudience', label: 'العملاء', icon: Users, isProFeature: true },
    { id: 'competitors', label: 'المنافسين', icon: Target, isProFeature: true },
    { id: 'swot', label: 'تحليل SWOT', icon: ShieldCheck },
    { id: 'businessStrategy', label: 'الاستراتيجية', icon: Compass },
    { id: 'businessModel', label: 'نموذج العمل', icon: Briefcase, isProFeature: true },
    { id: 'execution', label: 'خطة التنفيذ', icon: ListChecks },
    { id: 'financials', label: 'الأرقام والمالية', icon: DollarSign },
    { id: 'marketing', label: 'التسويق', icon: Rocket, isProFeature: true },
    { id: 'investment', label: 'الاستثمار', icon: Landmark, isProFeature: true },
    { id: 'resources', label: 'الأدوات والتعلم', icon: Wrench },
    { id: 'advisor', label: 'المرشد', icon: Compass, isProFeature: true },
  ] as const;

  const isProjectPro = plan?.isPro || activeProject?.isPro || profile?.subscriptionPlan === 'PRO';
  const dashboardTabs = allDashboardTabs;

  const handleFormComplete = useCallback(async (userData: UserData) => {
    if (isProcessingFormRef.current) return;
    isProcessingFormRef.current = true;

    if (!user || !profile) {
      setPendingFormData(userData);
      setView('login');
      isProcessingFormRef.current = false;
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    const isFreePlan = !profile.subscriptionPlan || profile.subscriptionPlan === 'FREE';
    const userTokens = profile.tokens || 0;

    const existingExcluded = userData.excludedIdeas || profile.userData?.excludedIdeas || profile.userData?.previousProjects || [];
    const collectedPriorIdeas: string[] = [...existingExcluded];

    if (activeProject?.projectName) {
      collectedPriorIdeas.push(`${activeProject.projectName}: ${activeProject.concept || ''}`);
    }
    if (plan?.projectName && plan.projectName !== activeProject?.projectName) {
      collectedPriorIdeas.push(`${plan.projectName}: ${plan.concept || ''}`);
    }
    projectsList.forEach(p => {
      const pName = p.projectName;
      const pConcept = p.concept || '';
      if (pName) {
        collectedPriorIdeas.push(`${pName}: ${pConcept}`);
      }
    });

    const uniqueExcludedIdeas = Array.from(new Set(collectedPriorIdeas.filter(Boolean)));
    const enrichedUserData: UserData = {
      ...userData,
      excludedIdeas: uniqueExcludedIdeas,
      previousProjects: uniqueExcludedIdeas
    };

    if (userTokens >= TOKEN_COSTS.IDEA_GENERATION) {
      try {
        await updateProfile({
          tokens: userTokens - TOKEN_COSTS.IDEA_GENERATION,
          userData: enrichedUserData
        });
      } catch (err) {
        console.error("Failed to deduct tokens", err);
      }
    } else if (isFreePlan && !isAdmin) {
      const { hasReachedLimit, formattedTimeLeft } = getDailyGenerationStatus(profile);

      if (hasReachedLimit) {
        setError(`لقد وصلت للحد الأقصى لإنشاء المشاريع اليوم (مشروع واحد كل 24 ساعة). يمكنك التوليد مجاناً بعد ${formattedTimeLeft || '24 ساعة'} أو الترقية الآن!`);
        isProcessingFormRef.current = false;
        return;
      }

      try {
        await updateProfile({
          dailyGenerations: 1,
          lastGenerationDate: new Date().toISOString(),
          userData: enrichedUserData
        });
      } catch (err) {
        console.error("Failed to update limit", err);
      }
    } else if (!isAdmin) {
      setError(`عفواً، لقد نفد رصيدك من النقاط. يرجى شراء باقة جديدة لتتمكن من إنشاء مشروع متكامل.`);
      if (user && user.email) {
        sendBalanceDepletedEmail(user.email, userTokens, profile?.userData?.gender);
      }
      isProcessingFormRef.current = false;
      return;
    } else {
      try {
        await updateProfile({
          userData: enrichedUserData
        });
      } catch (err) {
        console.error("Failed to update admin profile", err);
      }
    }

    setView('home');
    setIsGenerating(true);
    setLoadingStage(0);
    setError(null);

    const interval = setInterval(() => {
      setLoadingStage(prev => (prev < 3 ? prev + 1 : prev));
    }, 4000);

    try {
      const isProPlan = profile.subscriptionPlan === 'PRO' || isAdmin;
      const generatedPlan = await runAiTask('generate_plan', { userData: enrichedUserData, isPro: isProPlan }, user?.id || 'anonymous');

      try {
        localStorage.removeItem('wizard_pending_form_data');
      } catch (e) {}

      await logActivity('Generate Plan', 'Wizard', { projectName: generatedPlan.projectName });

      if (generatedPlan.clarifyingQuestions && generatedPlan.clarifyingQuestions.length > 0) {
        setPlan(generatedPlan);
        setView('questions');
      } else {
        setPlan(generatedPlan);
        handleSaveToAccount(generatedPlan, true);
        setView('reveal');

        if (user?.id) {
          createNotification(
            user.id,
            'اكتملت دراسة مشروعك بنجاح!',
            `تم بناء وإعداد دراسة الجدوى وخطة العمل لمشروعك "${generatedPlan.projectName}". يمكنك الآن استعراضها والبدء في التنفيذ.`,
            'project_created'
          );
        }

        if (user && user.email) {
          await sendProjectReadyEmail(user.email, generatedPlan.projectName, generatedPlan.concept, profile?.userData?.gender);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ غير متوقع.");
      setView('form');
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
      isProcessingFormRef.current = false;
    }
  }, [user, profile, updateProfile, activeProject, plan, projectsList, isAdmin, setPendingFormData, setView, setError, setIsGenerating, setLoadingStage, setPlan, logActivity]);

  useEffect(() => {
    if (user && profile && pendingFormData && processedPendingFormDataRef.current !== pendingFormData) {
      processedPendingFormDataRef.current = pendingFormData;
      handleFormComplete(pendingFormData);
      setPendingFormData(null);
    }
  }, [user, profile, pendingFormData, handleFormComplete, setPendingFormData]);

  const handleRegenerateIdea = useCallback(async () => {
    const currentPlan = plan || activeProject;
    const currentFormData = activeUserData || profile?.userData || (pendingFormData as UserData | undefined);

    if (currentFormData) {
      const existingExcluded = currentFormData.excludedIdeas || currentFormData.previousProjects || [];
      const updatedExcluded = [...existingExcluded];
      if (currentPlan?.projectName) {
        updatedExcluded.push(`${currentPlan.projectName}: ${currentPlan.concept || ''}`);
      }
      const updatedUserData: UserData = {
        ...currentFormData,
        excludedIdeas: Array.from(new Set(updatedExcluded.filter(Boolean))),
        previousProjects: Array.from(new Set(updatedExcluded.filter(Boolean)))
      };
      await handleFormComplete(updatedUserData);
    } else {
      setPlan(null);
      setView('form');
    }
  }, [plan, activeProject, activeUserData, profile?.userData, pendingFormData, handleFormComplete, setPlan, setView]);

  const isAdvisorActive = (view === 'dashboard' || (view === 'home' && activeProject)) && activeDashboardTab === 'advisor';

  if (isGenerating) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center overflow-y-auto bg-grid-canvas" dir="rtl">
        <Loader stage={loadingStage} />
      </div>
    );
  }

  return (
    <div className={`${isAdvisorActive ? 'h-dvh overflow-hidden' : 'min-h-dvh'} flex bg-grid-canvas`}>
        {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      {isLeftSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsLeftSidebarOpen(false)}
        />
      )}

      {/* Sliding Navigation Menu */}
      {(view !== 'form' || !isFocusMode) && (
        <aside
          className={`fixed lg:sticky top-4 right-4 lg:right-[unset] lg:mr-4 lg:ml-2 z-50 lg:z-40 h-[calc(100dvh-32px)] bg-white border border-gray-100 rounded-3xl flex flex-col transition-all duration-300 print:hidden shadow-xl lg:shadow-md ${
            isSidebarOpen ? 'translate-x-0 w-60 shadow-2xl' : 'translate-x-[calc(100%+20px)] lg:translate-x-0'
          } ${!isSidebarOpen && (isSidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-60')} overflow-hidden`}
        >
          <div className={`flex items-center ${isSidebarCollapsed && !isSidebarOpen ? 'justify-center p-3.5' : 'justify-between py-4 px-5'} border-b border-gray-100 bg-gray-50/50 rounded-t-3xl`}>
            {(!isSidebarCollapsed || isSidebarOpen) && (
              <h2 className="text-base font-black text-gray-900 tracking-tight whitespace-nowrap">القائمة الرئيسية</h2>
            )}
            <button
              className="lg:hidden p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={18} />
            </button>
            {!isSidebarOpen && (
              <button
                className="hidden lg:flex p-1.5 text-gray-500 hover:text-orange-600 transition-colors"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                {isSidebarCollapsed ? <Menu size={20} /> : <ChevronRight size={18} />}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 custom-scrollbar">
            <div className="space-y-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = view === item.id;
                const isExternal = item.id === 'partners' || item.id === 'about' || item.id === 'privacy';

                if (isExternal) {
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        setIsSidebarOpen(false);
                      }}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-[11px] sm:text-xs transition-all group text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${isSidebarCollapsed && !isSidebarOpen ? 'justify-center px-0' : ''}`}
                    >
                      <div className="relative">
                        <Icon size={18} className="text-gray-400 group-hover:text-primary" />
                      </div>
                      {(!isSidebarCollapsed || isSidebarOpen) && (
                        <span className="flex items-center justify-between w-full">
                          <span>{item.label}</span>
                        </span>
                      )}
                    </a>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-[11px] sm:text-xs transition-all group ${
                      isActive
                        ? 'bg-orange-50 text-orange-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } ${isSidebarCollapsed && !isSidebarOpen ? 'justify-center px-0' : ''}`}
                  >
                    <div className="relative">
                      <Icon size={18} className={isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-primary'} />
                      {item.id === 'notifications' && unreadNotificationsCount > 0 && isSidebarCollapsed && !isSidebarOpen && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-600 border-2 border-white rounded-full" />
                      )}
                    </div>
                    {(!isSidebarCollapsed || isSidebarOpen) && (
                      <span className="flex items-center justify-between w-full">
                        <span>{item.label}</span>
                        {item.id === 'notifications' && unreadNotificationsCount > 0 && (
                          <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[18px] text-center">
                            {unreadNotificationsCount}
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Support Section */}
          {(!isSidebarCollapsed || isSidebarOpen) && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl">
               <div className="text-center">
                 <p className="text-[10px] font-black text-gray-400 mb-1 uppercase tracking-wider">Business Creator AI</p>
                 <p className="text-xs text-gray-500">تمكين رواد الأعمال</p>
               </div>
            </div>
          )}
        </aside>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${isAdvisorActive ? 'h-dvh overflow-hidden' : 'min-h-dvh'}`}>
        {(view !== 'form' || !isFocusMode) && (
          <FloatingNav
            currentView={view}
            onNavigate={handleNavClick}
            onToggleSections={() => {
              if (window.innerWidth >= 1024) {
                setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed);
              } else {
                setIsLeftSidebarOpen(!isLeftSidebarOpen);
                setIsSidebarOpen(false);
              }
            }}
            showSectionsToggle={Boolean((view === 'dashboard' && plan) || (view === 'home' && activeProject))}
          />
        )}

        <main className={`flex-1 flex flex-col w-full max-w-5xl mx-auto ${isAdvisorActive ? 'p-0 overflow-hidden' : 'px-3 sm:px-4 md:px-6 py-6'}`}>
          <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh] text-gray-400 text-sm">جاري التحميل...</div>}>
          {error && (error.includes('نفد رصيدك من النقاط') || error.includes('الحد الأقصى')) ? (
            <div className="mb-6">
              <InsufficientTokensCard
                title={
                  view === 'form' ? 'Business Creator | بناء المشاريع' :
                  view === 'dashboard' ? 'Business Creator | استكمال المشروع' :
                  'Business Creator'
                }
                badgeText={
                  error.includes('الحد الأقصى') ? 'تنبيه الحد اليومي للمشاريع' :
                  view === 'form' ? 'تنبيه رصيد إنشاء المشاريع' :
                  view === 'dashboard' ? 'تنبيه استكمال خطة PRO' :
                  'تنبيه رصيد النقاط'
                }
                message={error}
                description={
                  error.includes('الحد الأقصى') ? 'باقة رواد الأعمال (PRO) تمنحك 100,000 نقطة لتوليد مشاريع غير محدودة فوراً دون انتظار 24 ساعة.' :
                  view === 'form' ? 'باقة رواد الأعمال (PRO) تمنحك 100,000 نقطة لتوليد مشاريع متعددة مع دراسات جدوى مالية وتسويقية متقدمة.' :
                  view === 'dashboard' ? 'قم بترقية حسابك لشحن 100,000 نقطة وفتح كافة محاور دراسة الجدوى والتحليل الاستراتيجي لمشروعك.' :
                  'باقة رواد الأعمال (PRO) تمنحك 100,000 نقطة لإطلاق وتنفيذ مشاريعك بالكامل مع استشارات ومميزات غير محدودة.'
                }
                onUpgrade={() => {
                  setError(null);
                  setView('pricing');
                }}
              />
            </div>
          ) : (
            <ToastMessage message={error} onClose={() => setError(null)} type="error" />
          )}
          <ToastMessage message={successMsg} onClose={() => setSuccessMsg(null)} type="success" />

          {/* Global in-app toast notifications from background tasks */}
          <AnimatePresence>
            {notifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-3"
              >
                <ToastMessage
                  message={notif.message}
                  type={notif.type === 'error' ? 'error' : 'success'}
                  onClose={() => useNotificationStore.getState().dismissNotification(notif.id)}
                  actionLabel={notif.actionLabel}
                  onAction={() => {
                    notif.onAction();
                    useNotificationStore.getState().dismissNotification(notif.id);
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {view === 'home' && (
            isGenerating ? (
              <Loader stage={loadingStage} />
            ) : loadingProject ? (
              <div className="text-center mt-20">جاري تحميل مشروعك...</div>
            ) : activeProject ? (
              <BusinessDashboard
                plan={activeProject}
                activeTab={activeDashboardTab}
                onTabChange={setActiveDashboardTab}
                onSavePlan={(p, isSilent) => handleSaveToAccount(p, isSilent)}
                isSaving={isSaving}
                error={error}
                onLogActivity={logActivity}
                onCreateNewPlan={handleRegenerateIdea}
                onUpgrade={() => {
                  setUpgradeIntentProject(plan || activeProject);
                  setView('pricing');
                }}
                onCompleteProPlan={handleCompleteProPlan}
                isCompletingPro={isCompletingPro}
                userData={activeUserData}
                onDeletePlan={async () => {
                  try {
                    if (activeProject?.id) {
                      await supabase.from('projects').delete().eq('id', activeProject.id);
                      await logActivity('Delete Project', 'Dashboard', { projectName: activeProject.projectName });
                    }
                    setPlan(null);
                    setActiveProject(null);
                    setView('home');
                  } catch (error) {
                    console.error("Failed to delete project:", error);
                  }
                }}
                isExecuting={true}
              />
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 w-full relative">
                {/* Full-Screen Gradient Background */}
                <div className="fixed inset-0 bg-gradient-to-br from-orange-50/80 via-transparent to-amber-50/80 -z-10 pointer-events-none overflow-hidden">
                  <div className="absolute -top-[20vh] -right-[10vw] w-[70vw] h-[70vw] min-w-[500px] min-h-[500px] bg-orange-500/10 rounded-full blur-[120px]"></div>
                  <div className="absolute -bottom-[20vh] -left-[10vw] w-[70vw] h-[70vw] min-w-[500px] min-h-[500px] bg-amber-500/10 rounded-full blur-[120px]"></div>
                </div>

                <div className="relative z-10 w-full flex flex-col items-center justify-center">
                  <Logo className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4" />
                  <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight tracking-tight mb-2 sm:mb-3 text-center">
                  {activeUserData?.fullName ? <>مرحباً بك، <span className="text-orange-600 font-bold">{activeUserData.fullName.split(' ')[0]}</span></> : 'النظام مستعد للبدء'}
                  </h1>

                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-gray-700 mb-4 sm:mb-6 text-center">
                    دعنا نصنع منك <span className="text-orange-600">رائد اعمال</span>
                  </h2>

                  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 font-medium mb-6 sm:mb-10 max-w-2xl mx-auto leading-relaxed border-b border-gray-200/50 pb-4 sm:pb-6 text-center px-2">
                    {activeUserData?.ultimateDream
                      ? <>لا توجد مسارات تنفيذية مفتوحة الآن. هل نبدأ ببناء خارطة طريق واضحة وقابلة للقياس لتحقيق هدفك بـ "<span className="font-bold text-orange-600">{activeUserData.ultimateDream}</span>"؟</>
                      : <>النظام مستعد لبناء مشروع يتلاءم حرفياً مع وضعك الفعلي وقدراتك المادية الحالية.</>
                    }
                  </p>

                  <div className="flex flex-col gap-5 sm:gap-8 text-right w-full mb-8 sm:mb-12 px-2">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="mt-1 flex items-center justify-center shrink-0 text-orange-600">
                        <Compass className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg md:text-xl font-black text-gray-900 mb-1">أمتلك المعطيات ولا أملك فكرة؟</h3>
                        <p className="text-gray-600 leading-relaxed text-xs sm:text-sm md:text-base">نحلل احتياج السوق ونستخرج فكرة مشروع منطقية وعالية الاحتمالية بناءً على محددات الأمان المناسبة لك.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="mt-1 flex items-center justify-center shrink-0 text-orange-600">
                        <Route className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg md:text-xl font-black text-gray-900 mb-1">توجد الفكرة و ينقصني مسار التنفيذ؟</h3>
                        <p className="text-gray-600 leading-relaxed text-xs sm:text-sm md:text-base">نحول الفكرة المجردة لجدول عمليات متسلسل يحسب تكاليفك خطوة بخطوة للوصول إلى العميل الحقيقي.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="mt-1 flex items-center justify-center shrink-0 text-orange-600">
                        <UserCog className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg md:text-xl font-black text-gray-900 mb-1">ليس لدي القدرة المالية الكافية الآن؟</h3>
                        <p className="text-gray-600 leading-relaxed text-xs sm:text-sm md:text-base">يعمل نظامنا وفق خوارزميات الاستخلاص الذكي لابتكار مسار بدء بأقل عبء مالي، مصمم حصرياً لإمكانياتك الفعلية.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                    <button
                      onClick={() => setView('form')}
                      className="w-full sm:w-auto px-6 py-2.5 sm:px-8 sm:py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-xl font-bold text-sm sm:text-base md:text-lg hover:from-orange-700 hover:to-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:-translate-y-0.5"
                    >
                      <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" /> ابدأ مشروعك الآن
                    </button>

                    <a
                      href="#about"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-6 py-2.5 sm:px-8 sm:py-3.5 bg-white/80 backdrop-blur-sm text-gray-800 border border-gray-200 rounded-xl font-bold text-sm sm:text-base md:text-lg hover:bg-white transition-all flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5"
                    >
                      <Info className="text-gray-400 w-5 h-5 sm:w-6 sm:h-6" /> كيف تعمل المنصة؟
                    </a>

                    {!user && (
                      <button
                        onClick={() => setView('login')}
                        className="w-full sm:w-auto px-6 py-2.5 sm:px-8 sm:py-3.5 bg-gray-900/90 backdrop-blur-sm text-white rounded-xl font-bold text-sm sm:text-base md:text-lg hover:bg-gray-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20 hover:-translate-y-0.5"
                      >
                        <LogIn className="text-gray-400 w-5 h-5 sm:w-6 sm:h-6" /> تسجيل الدخول
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {view === 'form' && (
            <WizardForm
              onComplete={handleFormComplete}
              isFocusMode={isFocusMode}
              onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
              initialData={profile?.userData}
              initialStep={initialFormStep as any}
              onUpgrade={() => setView('pricing')}
            />
          )}

          {view === 'questions' && plan?.clarifyingQuestions && (
            <ClarifyingQuestions
              questions={plan.clarifyingQuestions}
              onBack={() => setView('form')}
              onSubmitAnswers={(answers) => {
                if (profile?.userData) {
                  const updatedData = { ...profile.userData, clarifyingAnswers: answers as any };
                  handleFormComplete(updatedData);
                } else if (pendingFormData) {
                  const updatedData = { ...pendingFormData, clarifyingAnswers: answers as any };
                  handleFormComplete(updatedData);
                }
              }}
            />
          )}

          {view === 'reveal' && (
            <ProjectReveal onReveal={() => setView('dashboard')} userName={activeUserData?.fullName} gender={activeUserData?.gender} />
          )}

          {view === 'dashboard' && (plan || activeProject) && (
            <BusinessDashboard
              plan={plan || activeProject}
              activeTab={activeDashboardTab}
              onTabChange={setActiveDashboardTab}
              onSavePlan={handleSaveToAccount}
              isSaving={isSaving}
              error={error}
              onLogActivity={logActivity}
              onCreateNewPlan={handleRegenerateIdea}
              onUpgrade={() => {
                setUpgradeIntentProject(plan || activeProject);
                setView('pricing');
              }}
              onCompleteProPlan={handleCompleteProPlan}
              isCompletingPro={isCompletingPro}
              userData={activeUserData}
              onDeletePlan={async () => {
                try {
                  const targetPlan = plan || activeProject;
                  if (targetPlan?.id) {
                    await supabase.from('projects').delete().eq('id', targetPlan.id);
                    await logActivity('Delete Project', 'Dashboard', { projectName: targetPlan.projectName });
                  }
                  localStorage.removeItem('businessPlan');

                  setPlan(null);
                  setActiveProject(null);
                  setView('home');
                } catch (error) {
                  console.error("Failed to delete project:", error);
                }
              }}
              onExecutePlan={handleExecutePlan}
            />
          )}

          {view === 'saved-plans' && (
            user ? (
              <SavedPlans
                onBack={() => handleNavClick('form')}
                onViewPlan={handleViewPlan}
                activeProjectId={activeProject?.id}
                currentPlanId={plan?.id}
                projects={projectsList}
                loading={loadingProjects}
              />
            ) : (
              <Login
                onLogin={() => setView('saved-plans')}
                message="يرجى تسجيل الدخول للوصول لمعلوماتك ومسارات التنفيذ الخاصة بك."
              />
            )
          )}
          {view === 'about' && <About onStartProject={() => setView('form')} />}
          {view === 'login' && (
            <Login
              onLogin={() => handleNavClick(pendingFormData ? 'home' : 'profile')}
              message={pendingFormData ? "لحفظ وحماية مسارك الجديد، يجب ربط هذه البيانات بحساب آمن." : undefined}
            />
          )}
          {view === 'profile' && (
            <Profile
              onLogout={() => {
                setActiveProject(null);
                setPlan(null);
                setView('home');
                handleNavClick('home');
              }}
              onGenerateIdea={() => {
                if (profile?.userData) {
                  handleFormComplete(profile.userData);
                }
              }}
              onEditIdea={() => {
                setInitialFormStep(1);
                setView('form');
              }}
              onViewPricing={() => {
                setView('pricing');
              }}
            />
          )}
          {view === 'pricing' && (
            <PricingSection
              onSelectPlan={handleSelectPlan}
              currentPlan={profile?.subscriptionPlan}
              isLoadingTarget={isLoadingPlanTarget}
              userData={activeUserData}
            />
          )}
          {view === 'admin' && isAdmin && <AdminDashboard />}
          {view === 'partners' && <Partners />}
          {view === 'privacy' && <PrivacyPolicy />}
          {view === 'feedback' && (
            user ? (
              <Feedback />
            ) : (
              <Login
                onLogin={() => setView('feedback')}
                message="يرجى تسجيل الدخول لمشاركة رأيك وتجربتك معنا."
              />
            )
          )}
          {view === 'notifications' && (
            user ? (
              <Notifications onNavigate={(targetView) => setView(targetView)} />
            ) : (
              <Login
                onLogin={() => setView('notifications')}
                message="يرجى تسجيل الدخول للوصول إلى مركز الإشعارات الخاص بك."
              />
            )
          )}
          </Suspense>
        </main>

        {/* Footer */}
        {['partners', 'about', 'privacy'].includes(view) && (
          <footer className="bg-surface border-t border-border py-12 mt-auto">
            <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-right">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-text-primary">Business Creator</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  منصة متخصصة في بناء المشاريع لمساعدتك في بناء مشروع حقيقي على مقاسك وقابل للتنفيذ على أرض الواقع او اونلاين من الصفر تماماً خطوة بخطوة من الفكرة لأول دخل.
                </p>
              </div>
              <div className="space-y-4">
                 <h4 className="font-bold text-text-primary">روابط سريعة</h4>
                 <ul className="text-sm text-text-muted space-y-2">
                    <li><a href="#partners" target="_blank" rel="noopener noreferrer" className="hover:text-primary block cursor-pointer">شركاء النجاح</a></li>
                    <li><a href="#about" target="_blank" rel="noopener noreferrer" className="hover:text-primary block cursor-pointer">كيف تعمل المنصة؟</a></li>
                    <li><a href="#privacy" target="_blank" rel="noopener noreferrer" className="hover:text-primary block cursor-pointer">سياسة الخصوصية</a></li>
                 </ul>
              </div>
              <div className="space-y-4">
                 <h4 className="font-bold text-text-primary">تواصل معنا</h4>
                 <p className="text-sm text-text-muted">القاهرة، جمهورية مصر العربية</p>
                 <div className="flex justify-center md:justify-start gap-4 text-text-muted">
                   <a href="https://www.facebook.com/share/18Rmxszhy7/" target="_blank" rel="noreferrer" className="w-8 h-8 bg-background rounded-full flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-all cursor-pointer">
                     <Facebook size={16} />
                   </a>
                   <a href="https://www.instagram.com/businesss.creator?igsh=eHNncTF6NDFna2lp" target="_blank" rel="noreferrer" className="w-8 h-8 bg-background rounded-full flex items-center justify-center hover:bg-[#E4405F] hover:text-white transition-all cursor-pointer">
                     <Instagram size={16} />
                   </a>
                   <a href="https://wa.me/201034927416" target="_blank" rel="noreferrer" className="w-8 h-8 bg-background rounded-full flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all cursor-pointer">
                     <MessageCircle size={16} />
                   </a>
                 </div>
              </div>
            </div>
            <div className="mt-12 text-center text-xs text-text-muted border-t border-border pt-8">
               &copy; {new Date().getFullYear()} Business Creator. جميع الحقوق محفوظة.
            </div>
          </footer>
        )}

      </div>

      {/* Left Sidebar (Dashboard Sections & Actions) */}
      {((view === 'dashboard' && plan) || (view === 'home' && activeProject)) && (
        <aside
          className={`fixed lg:sticky top-4 left-4 lg:left-[unset] lg:ml-4 lg:mr-2 z-50 lg:z-40 h-[calc(100dvh-32px)] bg-surface rounded-3xl shadow-xl lg:shadow-md flex flex-col transition-all duration-300 print:hidden border border-gray-100 ${
            isLeftSidebarOpen ? 'translate-x-0 w-56' : '-translate-x-[calc(100%+20px)] lg:translate-x-0'
          } ${isLeftSidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-56'} overflow-hidden`}
        >
          <div className={`flex items-center border-b border-border transition-all duration-300 ${
            isLeftSidebarCollapsed ? 'lg:justify-center lg:p-3.5 justify-between p-4' : 'justify-between py-4 px-5'
          }`}>
            <h2 className={`text-base font-black text-text-primary tracking-tight whitespace-nowrap ${isLeftSidebarCollapsed ? 'lg:hidden' : ''}`}>
              هيكل المشروع
            </h2>
            <button
              className="lg:hidden text-text-muted hover:text-text-primary"
              onClick={() => setIsLeftSidebarOpen(false)}
            >
              <X size={18} />
            </button>
            <button
              className="hidden lg:flex text-text-muted hover:text-text-primary transition-colors shrink-0"
              onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
            >
              {isLeftSidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 custom-scrollbar">
            <div className="space-y-1">
              {dashboardTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeDashboardTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if ('isProFeature' in tab && tab.isProFeature && !isProjectPro) {
                        return;
                      }
                      setActiveDashboardTab(tab.id as any);
                    }}
                    title={isLeftSidebarCollapsed ? tab.label : undefined}
                    className={`w-full flex items-center rounded-lg font-bold text-[11px] sm:text-xs transition-all group ${
                      isActive
                        ? `bg-primary/5 text-gray-900 shadow-sm border border-primary/10`
                        : 'isProFeature' in tab && tab.isProFeature && !isProjectPro
                        ? 'text-gray-400 cursor-not-allowed opacity-70'
                        : 'text-gray-600 hover:bg-primary/5 hover:text-gray-900'
                    } ${isLeftSidebarCollapsed ? 'lg:justify-center lg:px-0 lg:gap-0 px-3 py-2 gap-2.5' : 'px-3 py-2 gap-2.5'}`}
                  >
                    <Icon size={16} className={`transition-colors shrink-0 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
                    <div className={`flex-1 flex items-center justify-between transition-all duration-300 ${isLeftSidebarCollapsed ? 'lg:hidden' : ''}`}>
                      <span>{tab.label}</span>
                      {('isProFeature' in tab && tab.isProFeature && !isProjectPro) && (
                        <Lock size={12} className="opacity-50 shrink-0 mr-1" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-border space-y-1.5">
              <p className={`px-3 text-[9px] font-black text-text-muted uppercase tracking-widest mb-1 ${isLeftSidebarCollapsed ? 'lg:hidden' : ''}`}>
                إجراءات
              </p>
              {!(plan?.isPro || activeProject?.isPro) && (
                <button
                  onClick={profile?.subscriptionPlan === 'PRO' ? handleCompleteProPlan : () => {
                    setUpgradeIntentProject(plan || activeProject);
                    setView('pricing');
                  }}
                  disabled={isCompletingPro}
                  title={isLeftSidebarCollapsed ? (profile?.subscriptionPlan === 'PRO' ? "إكمال الخطة" : "ترقية للميزات المدفوعة") : undefined}
                  className={`w-full flex items-center transition-all bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 border-none rounded-lg font-bold text-xs py-2.5 ${
                    isLeftSidebarCollapsed ? 'lg:justify-center lg:px-0 lg:gap-0 px-3 gap-2.5' : 'px-3 gap-2.5'
                  }`}
                >
                  <Sparkles size={16} className="shrink-0" />
                  <span className={`whitespace-nowrap transition-all duration-300 ${isLeftSidebarCollapsed ? 'lg:hidden' : ''}`}>
                    {isCompletingPro
                      ? 'جاري إكمال الخطة...'
                      : (profile?.subscriptionPlan === 'PRO' ? 'إكمال الخطة' : 'ترقية للميزات المدفوعة')}
                  </span>
                </button>
              )}
              <button
                onClick={handleShare}
                title={isLeftSidebarCollapsed ? "مشاركة" : undefined}
                className={`w-full flex items-center transition-all group rounded-lg font-bold text-xs py-2.5 ${
                  isCopied ? 'bg-primary/5 text-gray-900 shadow-sm border border-primary/10' : 'text-gray-600 hover:bg-primary/5 hover:text-gray-900'
                } ${isLeftSidebarCollapsed ? 'lg:justify-center lg:px-0 lg:gap-0 px-3 gap-2.5' : 'px-3 gap-2.5'}`}
              >
                {isCopied ? (
                  <Check size={16} className="text-primary shrink-0 transition-colors" />
                ) : (
                  <Share2 size={16} className="text-gray-400 shrink-0 group-hover:text-primary transition-colors" />
                )}
                <span className={`whitespace-nowrap transition-all duration-300 ${isLeftSidebarCollapsed ? 'lg:hidden' : ''}`}>
                  {isCopied ? 'تم النسخ!' : 'مشاركة'}
                </span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Share2 size={24} className="text-primary" />
                مشاركة خطة المشروع
              </h3>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600 text-sm mb-4">أرسل رابط هيكل المسار إلى الشركاء المحتملين:</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    const url = window.location.href;
                    const text = `شاهد خطة عمل مشروعي الجديد "${(plan || activeProject)?.projectName}" التي تم إنشاؤها باستخدام Business Creator AI!`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank');
                  }}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-green-50 text-green-700 hover:bg-green-100 transition-all border border-green-200 hover:shadow-md"
                >
                  <MessageCircle size={32} />
                  <span className="font-bold text-sm">واتساب</span>
                </button>

                <button
                  onClick={() => {
                    const url = window.location.href;
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                  }}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all border border-blue-200 hover:shadow-md"
                >
                  <Facebook size={32} />
                  <span className="font-bold text-sm">فيسبوك</span>
                </button>

                <button
                  onClick={() => {
                    const url = window.location.href;
                    const text = `شاهد خطة عمل مشروعي الجديد "${(plan || activeProject)?.projectName}" التي تم إنشاؤها باستخدام Business Creator AI!`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                  }}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-sky-50 text-sky-700 hover:bg-sky-100 transition-all border border-sky-200 hover:shadow-md"
                >
                  <Twitter size={32} />
                  <span className="font-bold text-sm">تويتر (X)</span>
                </button>

                <button
                  onClick={() => {
                    const url = window.location.href;
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
                  }}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all border border-indigo-200 hover:shadow-md"
                >
                  <Linkedin size={32} />
                  <span className="font-bold text-sm">لينكد إن</span>
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={() => {
                    const url = window.location.href;
                    const text = `شاهد خطة عمل مشروعي الجديد "${(plan || activeProject)?.projectName}" التي تم إنشاؤها باستخدام Business Creator AI!`;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(text + '\n' + url)
                        .then(() => {
                          setIsCopied(true);
                          setTimeout(() => { setIsCopied(false); setShowShareModal(false); }, 2000);
                        });
                    }
                  }}
                  className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl font-bold transition-all ${
                    isCopied ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {isCopied ? <Check size={20} /> : <Link size={20} />}
                  <span>{isCopied ? 'تم نسخ الرابط بنجاح!' : 'نسخ رابط المشروع'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Temporary Payment Modal */}
      <TempPaymentModal
        isOpen={showTempPaymentModal}
        onClose={() => setShowTempPaymentModal(false)}
      />
    </div>
  );
};

export default App;
