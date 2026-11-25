import { create } from 'zustand';
import { BusinessPlan, SavedProject, SubscriptionTier, UserData } from '../types/types';

export type ViewType =
  | 'home'
  | 'form'
  | 'loading'
  | 'dashboard'
  | 'saved-plans'
  | 'about'
  | 'login'
  | 'partners'
  | 'privacy'
  | 'profile'
  | 'questions'
  | 'admin'
  | 'pricing'
  | 'reveal'
  | 'feedback'
  | 'notifications';

export type DashboardTab =
  | 'overview'
  | 'branding'
  | 'marketAnalysis'
  | 'validation'
  | 'targetAudience'
  | 'competitors'
  | 'swot'
  | 'businessStrategy'
  | 'businessModel'
  | 'execution'
  | 'financials'
  | 'marketing'
  | 'investment'
  | 'resources'
  | 'advisor';

interface AppStore {
  // Navigation
  view: ViewType;
  initialFormStep: number | undefined;
  // Projects
  plan: BusinessPlan | null;
  activeProject: BusinessPlan | null;
  upgradeIntentProject: BusinessPlan | null;
  loadingProject: boolean;
  projectsList: SavedProject[];
  loadingProjects: boolean;
  selectedSavedPlan: BusinessPlan | null;
  // Task / generation state
  isGenerating: boolean;
  loadingStage: number;
  pendingFormData: UserData | null;
  isCompletingPro: boolean;
  isLoadingPlanTarget: SubscriptionTier | null;
  // UI toggles
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  isFocusMode: boolean;
  isLeftSidebarOpen: boolean;
  isLeftSidebarCollapsed: boolean;
  activeDashboardTab: DashboardTab;
  isSaving: boolean;
  saveSuccess: boolean;
  isCopied: boolean;
  showShareModal: boolean;
  showTempPaymentModal: boolean;
  // User feedback
  error: string | null;
  successMsg: string | null;

  // Actions
  setView: (view: ViewType) => void;
  setInitialFormStep: (step: number | undefined) => void;
  setPlan: (plan: BusinessPlan | null) => void;
  setActiveProject: (project: BusinessPlan | null | ((prev: BusinessPlan | null) => BusinessPlan | null)) => void;
  setUpgradeIntentProject: (project: BusinessPlan | null) => void;
  setLoadingProject: (loading: boolean) => void;
  setProjectsList: (projects: SavedProject[]) => void;
  setLoadingProjects: (loading: boolean) => void;
  setSelectedSavedPlan: (plan: BusinessPlan | null) => void;
  setIsGenerating: (generating: boolean) => void;
  setLoadingStage: (stage: number | ((prev: number) => number)) => void;
  setPendingFormData: (data: UserData | null) => void;
  setIsCompletingPro: (completing: boolean) => void;
  setIsLoadingPlanTarget: (target: SubscriptionTier | null) => void;
  setIsSidebarOpen: (open: boolean) => void;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  setIsFocusMode: (focus: boolean) => void;
  setIsLeftSidebarOpen: (open: boolean) => void;
  setIsLeftSidebarCollapsed: (collapsed: boolean) => void;
  setActiveDashboardTab: (tab: DashboardTab) => void;
  setIsSaving: (saving: boolean) => void;
  setSaveSuccess: (success: boolean) => void;
  setIsCopied: (copied: boolean) => void;
  setShowShareModal: (show: boolean) => void;
  setShowTempPaymentModal: (show: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Navigation
  view: 'home',
  initialFormStep: undefined,
  // Projects
  plan: null,
  activeProject: null,
  upgradeIntentProject: null,
  loadingProject: true,
  projectsList: [],
  loadingProjects: false,
  selectedSavedPlan: null,
  // Task / generation state
  isGenerating: false,
  loadingStage: 0,
  pendingFormData: null,
  isCompletingPro: false,
  isLoadingPlanTarget: null,
  // UI toggles
  isSidebarOpen: false,
  isSidebarCollapsed: true,
  isFocusMode: true,
  isLeftSidebarOpen: false,
  isLeftSidebarCollapsed: true,
  activeDashboardTab: 'overview',
  isSaving: false,
  saveSuccess: false,
  isCopied: false,
  showShareModal: false,
  showTempPaymentModal: false,
  // User feedback
  error: null,
  successMsg: null,

  // Actions — simple setters
  setView: (view) => set({ view }),
  setInitialFormStep: (step) => set({ initialFormStep: step }),
  setPlan: (plan) => set({ plan }),
  setActiveProject: (project) =>
    set((state) =>
      typeof project === 'function'
        ? { activeProject: project(state.activeProject) }
        : { activeProject: project }
    ),
  setUpgradeIntentProject: (project) => set({ upgradeIntentProject: project }),
  setLoadingProject: (loading) => set({ loadingProject: loading }),
  setProjectsList: (projects) => set({ projectsList: projects }),
  setLoadingProjects: (loading) => set({ loadingProjects: loading }),
  setSelectedSavedPlan: (plan) => set({ selectedSavedPlan: plan }),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  setLoadingStage: (stage) =>
    set((state) =>
      typeof stage === 'function'
        ? { loadingStage: stage(state.loadingStage) }
        : { loadingStage: stage }
    ),
  setPendingFormData: (data) => set({ pendingFormData: data }),
  setIsCompletingPro: (completing) => set({ isCompletingPro: completing }),
  setIsLoadingPlanTarget: (target) => set({ isLoadingPlanTarget: target }),
  setIsSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setIsSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  setIsFocusMode: (focus) => set({ isFocusMode: focus }),
  setIsLeftSidebarOpen: (open) => set({ isLeftSidebarOpen: open }),
  setIsLeftSidebarCollapsed: (collapsed) => set({ isLeftSidebarCollapsed: collapsed }),
  setActiveDashboardTab: (tab) => set({ activeDashboardTab: tab }),
  setIsSaving: (saving) => set({ isSaving: saving }),
  setSaveSuccess: (success) => set({ saveSuccess: success }),
  setIsCopied: (copied) => set({ isCopied: copied }),
  setShowShareModal: (show) => set({ showShareModal: show }),
  setShowTempPaymentModal: (show) => set({ showTempPaymentModal: show }),
  setError: (error) => set({ error }),
  setSuccessMsg: (msg) => set({ successMsg: msg }),
}));
