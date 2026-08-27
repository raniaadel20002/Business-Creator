
import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { BusinessPlan, TOKEN_COSTS } from '../../../types/types';

const svgToDataUri = (svg?: string): string => {
  if (!svg) return '';
  const clean = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
  return `data:image/svg+xml;utf8,${encodeURIComponent(clean)}`;
};
import { useAuth } from './AuthContext';
import { supabase, runAiTask } from '../supabase';
import { sendExecutionDecisionEmail } from '../../../../server/services/email/emailService';
import { createNotification } from '../services/notificationService';
import AdvisorChat from '../../../../components/AdvisorChat';
import { AdvisorCTA } from '../../../../components/AdvisorCTA';
import { getChallengeAdvice } from '../services/challengeAdviceService';
import SwotAnalysisTab from '../../../../components/dashboard-tabs/SwotAnalysisTab';
import InvestmentTab from '../../../../components/dashboard-tabs/InvestmentTab';
import ResourcesTab from '../../../../components/dashboard-tabs/ResourcesTab';
import MarketAnalysisTab from '../../../../components/dashboard-tabs/MarketAnalysisTab';
import ValidationTab from '../../../../components/dashboard-tabs/ValidationTab';
import TargetAudienceTab from '../../../../components/dashboard-tabs/TargetAudienceTab';
import BusinessStrategyTab from '../../../../components/dashboard-tabs/BusinessStrategyTab';
import ExecutionGuideTab from '../../../../components/dashboard-tabs/ExecutionGuideTab';
import FinancialsTab from '../../../../components/dashboard-tabs/FinancialsTab';
import { 
  Briefcase, 
  Palette, 
  Rocket, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2,
  ShieldAlert,
  Lightbulb,
  ExternalLink,
  Target,
  Zap,
  MessageCircle,
  Check,
  Info,
  Search,
  ListChecks,
  Wrench,
  DollarSign,
  ArrowRightCircle,
  ArrowLeftCircle,
  X,
  Lock,
  HelpCircle,
  Save,
  RefreshCw,
  Trash2,
  Sparkles,
  Bot,
  ChevronRight,
  ChevronLeft,
  Download,
  Printer,
  Users,
  CheckSquare,
  Database,
  Gift,
  Heart,
  Truck,
  Tags,
  Coins,
  LineChart,
  PieChart,
  FileText,
  Compass,
  GraduationCap,
  Landmark,
  MapPin,
  Globe,
  Phone,
  Building
} from 'lucide-react';
import { MarketingStrategyTab } from '../../../../components/dashboard-tabs/MarketingStrategyTab';
import { CompetitorsAnalysisTab } from '../../../../components/dashboard-tabs/CompetitorsAnalysisTab';
import { BusinessModelCanvasTab } from '../../../../components/dashboard-tabs/BusinessModelCanvasTab';
import { FormattedText, cleanText } from './FormattedText';
import { InsufficientTokensCard } from '../../../../components/InsufficientTokensCard';

interface BusinessDashboardProps {
  plan: BusinessPlan;
  activeTab: 'overview' | 'branding' | 'marketAnalysis' | 'validation' | 'targetAudience' | 'competitors' | 'swot' | 'businessStrategy' | 'execution' | 'financials' | 'marketing' | 'investment' | 'resources' | 'businessModel' | 'advisor';
  onTabChange: (tab: any) => void;
  onSavePlan?: (plan: BusinessPlan, isSilent?: boolean) => void;
  onCreateNewPlan?: () => void;
  onDeletePlan?: () => void;
  onExecutePlan?: () => void;
  onUpgrade?: () => void;
  onCompleteProPlan?: () => void;
  isExecuting?: boolean;
  isSaving?: boolean;
  isCompletingPro?: boolean;
  error?: string | null;
  onLogActivity?: (action: string, module: string, details?: any) => void;
  userData?: any;
}

const parseBrandingColor = (colorStr: string) => {
  if (!colorStr) return { hex: '#cccccc', name: '' };
  const hexMatch = colorStr.match(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/);
  if (hexMatch) {
    const hex = hexMatch[0];
    let name = colorStr.replace(hex, '').replace(/[()#]/g, '').trim();
    if (!name) name = hex;
    return { hex, name };
  }
  return { hex: colorStr, name: colorStr };
};

interface ColorPaletteGroupProps {
  title: string;
  badgeClass: string;
  colors?: string[];
  prefix: string;
}

const ColorPaletteGroup: React.FC<ColorPaletteGroupProps> = ({ title, badgeClass, colors, prefix }) => {
  if (!colors || colors.length === 0) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badgeClass}`}>{title}</span>
      <div className="flex flex-col gap-3">
        {colors.map((color, idx) => {
          const { hex, name } = parseBrandingColor(color);
          return (
            <div key={`${prefix}-${idx}`} className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <div className="w-12 h-12 rounded-xl shadow-inner border border-gray-200 shrink-0" style={{ backgroundColor: hex }} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-gray-900 truncate">{name}</div>
                <div className="text-xs font-mono text-gray-550 mt-0.5">{hex}</div>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(hex);
                  alert(`تم نسخ كود اللون: ${hex}`);
                }}
                className="p-1.5 bg-white text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg border border-gray-105 shrink-0 transition-all"
                title="نسخ كود اللون"
              >
                <Check size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ plan, activeTab, onTabChange, onSavePlan, onCreateNewPlan, onDeletePlan, onExecutePlan, onUpgrade, onCompleteProPlan, isExecuting, isSaving, isCompletingPro, error, onLogActivity, userData: externalUserData }) => {
  const [decision, setDecision] = useState<'pending' | 'execute'>(plan.isExecuted ? 'execute' : 'pending');
  const [isDecisionDismissed, setIsDecisionDismissed] = useState<boolean>(Boolean(isExecuting || plan.isExecuted));
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [logoResult, setLogoResult] = useState<any>(plan.identity?.logoSystem || null);
  const [selectedStyle, setSelectedStyle] = useState('minimalist vector logomark, clean, modern, flat design, white background');
  const [showLogoTokensCard, setShowLogoTokensCard] = useState(false);
  const { user, profile, updateProfile } = useAuth();
  
  const activeUserData = externalUserData || profile?.userData;
  const isFemale = activeUserData?.gender === 'أنثى' || activeUserData?.gender === 'انثى' || activeUserData?.gender === 'female';
  const isAdmin = profile?.email === 'ashrafmena999@gmail.com';
  const isFreeUser = !isAdmin && (profile?.subscriptionPlan === 'FREE' || !profile?.subscriptionPlan) && (profile?.tokens || 0) < TOKEN_COSTS.IDEA_GENERATION;

  const handleAdvisorClick = () => {
    if (isFreeUser) {
      if (onUpgrade) {
        onUpgrade();
      } else {
        onTabChange('pricing');
      }
    } else {
      onTabChange('advisor');
    }
  };

  useEffect(() => {
    if (plan.identity?.logoSystem) {
      setLogoResult(plan.identity.logoSystem);
    }
  }, [plan.identity?.logoSystem]);

  useEffect(() => {
    if (activeTab) {
      onLogActivity?.('view_tab', activeTab, { projectName: plan.projectName });
    }
  }, [activeTab, plan.projectName, onLogActivity]);

  const challengesAdvice = (plan.challengesAdvice && plan.challengesAdvice.length > 0)
    ? plan.challengesAdvice
    : (activeUserData?.expectedChallenges ? getChallengeAdvice(activeUserData.expectedChallenges, plan.projectName) : []);

  const handleExecuteDecision = async () => {
    setIsDecisionDismissed(true);
    setDecision('execute');
    const updatedPlan = { ...plan, isExecuted: true };
    onExecutePlan?.();
    onSavePlan?.(updatedPlan);
    onLogActivity?.('execute_plan', 'execution', { projectName: plan.projectName });

    if (user && user.id) {
      try {
        await createNotification(
          user.id,
          'اعتماد خطة المشروع للتنفيذ',
          `تم اعتماد خطة مشروع "${plan.projectName}" للتنفيذ بنجاح! 🚀`,
          'project_created'
        );
      } catch (err) {
        console.error("Failed to create execution notification:", err);
      }
    }
    
    if (user && user.email) {
      await sendExecutionDecisionEmail(user.email, plan.projectName, activeUserData?.gender);
    }
  };

  const renderTabNavigation = () => {
    const allTabs = ['overview', 'branding', 'marketAnalysis', 'validation', 'targetAudience', 'competitors', 'swot', 'businessStrategy', 'businessModel', 'execution', 'financials', 'marketing', 'investment', 'resources', 'advisor'];
    const tabOrder = allTabs;

    const currentIndex = tabOrder.indexOf(activeTab as any);
    const nextTab = tabOrder[currentIndex + 1];
    const prevTab = tabOrder[currentIndex - 1];

    let sectionName = '';
    switch(activeTab) {
      case 'overview': sectionName = 'نظرة عامة'; break;
      case 'branding': sectionName = 'الهوية التجارية'; break;
      case 'marketAnalysis': sectionName = 'تحليل السوق'; break;
      case 'validation': sectionName = 'السوق'; break;
      case 'targetAudience': sectionName = 'العملاء'; break;
      case 'competitors': sectionName = 'المنافسين'; break;
      case 'swot': sectionName = 'تحليل SWOT'; break;
      case 'businessStrategy': sectionName = 'الاستراتيجية'; break;
      case 'businessModel': sectionName = 'نموذج العمل'; break;
      case 'execution': sectionName = 'خطة التنفيذ'; break;
      case 'financials': sectionName = 'الأرقام والمالية'; break;
      case 'marketing': sectionName = 'التسويق'; break;
      case 'investment': sectionName = 'الاستثمار'; break;
      case 'resources': sectionName = 'الأدوات والتعلم'; break;
      case 'advisor': sectionName = 'المرشد'; break;
    }

    return (
      <div className="space-y-6 mt-12 pt-6 border-t border-gray-100 print:hidden">
        {/* Tab Navigation Next / Prev */}
        <div className="flex justify-between items-center pt-2">
          <button 
            onClick={() => prevTab && onTabChange(prevTab)}
            disabled={!prevTab}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              prevTab ? 'bg-background hover:bg-gray-100 text-text-secondary border border-border cursor-pointer' : 'opacity-0 cursor-default pointer-events-none'
            }`}
          >
            <ChevronRight size={20} /> السابق
          </button>
          
          <div className="text-sm font-bold text-text-muted">
            {sectionName}
          </div>

          <button 
            onClick={() => nextTab && onTabChange(nextTab)}
            disabled={!nextTab}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              nextTab ? 'bg-primary text-white hover:bg-orange-600 shadow-soft cursor-pointer' : 'opacity-0 cursor-default pointer-events-none'
            }`}
          >
            التالي <ChevronLeft size={20} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div id="business-dashboard-content" className={`${activeTab === 'advisor' ? 'flex-1 flex flex-col h-full min-h-0 overflow-hidden' : 'w-full space-y-8'} w-full animate-in fade-in duration-700`}>
      {error && (
        <div className="bg-red-50 border-r-4 border-red-600 p-4 text-red-800 font-bold rounded-lg shadow-sm">
          ⚠️ {error}
        </div>
      )}

      {plan.isPro === false && activeTab !== 'advisor' && activeTab !== 'overview' && !['branding', 'marketAnalysis', 'targetAudience', 'marketing', 'investment', 'businessModel'].includes(activeTab) && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 p-6 rounded-xl shadow-sm text-center">
          <h3 className="text-xl font-bold text-orange-900 mb-2">
            {activeUserData?.fullName ? (
              isFemale ? (
                <>أهلاً بكِ يا رائدة الأعمال <span className="text-orange-600">{activeUserData.fullName.split(' ')[0]}</span> 🚀</>
              ) : (
                <>أهلاً بك يا رائد الأعمال <span className="text-orange-600">{activeUserData.fullName.split(' ')[0]}</span> 🚀</>
              )
            ) : 'هذا المشروع مبدئي بخطة البداية 🚀'}
          </h3>
          <p className="text-orange-800 font-bold mb-2">
            {activeUserData?.ultimateDream ? (
              isFemale ? (
                <>نحن نؤمن بحلمكِ في إنشاء <span className="text-orange-600">{activeUserData.ultimateDream}</span></>
              ) : (
                <>نحن نؤمن بحلمك في إنشاء <span className="text-orange-600">{activeUserData.ultimateDream}</span></>
              )
            ) : 'ابدأ رحلة النجاح بخطوات مدروسة'}
          </p>
          <p className="text-orange-700 mb-4 text-sm leading-relaxed max-w-3xl mx-auto">
            {isFemale ? (
              <>يعرض هذا المشروع الأساسيات فقط لتجربة الفكرة. كـرائدة أعمال، أنتِ تحتاجين للرؤية الكاملة. أكملي بناء مشروع رائدة الأعمال واستعرضي كافة التحليلات العميقة (نموذج العمل، التسويق، الاستثمار وغيرها) لتكوني مستعدة للنجاح.</>
            ) : (
              <>يعرض هذا المشروع الأساسيات فقط لتجربة الفكرة. كـرائد أعمال، أنت تحتاج للرؤية الكاملة. أكمل بناء مشروع رائد الأعمال واستعرض كافة التحليلات العميقة (نموذج العمل، التسويق، الاستثمار وغيرها) لتكون مستعداً للنجاح.</>
            )}
          </p>
          {profile?.subscriptionPlan === 'PRO' ? (
            <button 
              onClick={() => onCompleteProPlan && onCompleteProPlan()}
              disabled={isCompletingPro}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 transition disabled:opacity-50"
            >
              {isCompletingPro 
                ? (isFemale ? 'جاري استكمال المشروع...' : 'جاري استكمال المشروع...') 
                : (isFemale ? 'أكملي بناء مشروع رائدة الأعمال (خصم 25,000 نقطة)' : 'أكمل بناء مشروع رائد الأعمال (خصم 25,000 نقطة)')}
            </button>
          ) : (
            <button 
              onClick={() => onUpgrade && onUpgrade()}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 transition shadow-md shadow-orange-600/20"
            >
              عرض خطط الأسعار للمواصلة
            </button>
          )}
        </div>
      )}

      {/* Header & Project ID */}
      {activeTab === 'overview' && (
        <div className="bg-surface rounded-3xl p-6 md:p-8 shadow-soft border border-border">
          <div className="space-y-4 text-right">
            <h1 className="text-4xl md:text-5xl font-black text-text-primary">{plan.projectName}</h1>
            <p className="text-xl text-text-secondary leading-relaxed">{plan.concept}</p>
            <div className="flex flex-wrap justify-start gap-4 mt-4">
               <span className="flex items-center gap-2 text-sm font-medium bg-background px-3 py-1 rounded-lg">
                  <Briefcase size={16} className="text-orange-600" /> {plan.type}
               </span>
            </div>
          </div>
        </div>
      )}

      {/* Complete Pro Plan CTA for PRO users whose plan is still on Starter / Free mode */}
      {profile?.subscriptionPlan === 'PRO' && !plan.isPro && activeTab === 'overview' && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/5 rounded-2xl p-4 sm:p-5 border border-green-200/80 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-right" dir="rtl">
            <div className="flex-1 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-green-600 text-white rounded-full text-[11px] font-bold">
                <Sparkles size={12} /> حسابك مفعل بالخطة الاحترافية (PRO)
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                {activeUserData?.fullName 
                  ? <>أهلاً بك يا <span className="text-green-700 font-extrabold">{activeUserData.fullName.split(' ')[0]}</span>، حان وقت إكمال خطة مشروعك الشاملة!</>
                  : 'هل أنت جاهز لإكمال جميع مخرجات مشروعك بأرقام واقعية واستراتيجيات متقدمة؟'}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">
                تمت ترقية حسابك بنجاح! اضغط على زر إكمال الخطة ليقوم المرشد الذكي باستخراج خطة العمل التفصيلية ودراسة الجدوى الشاملة لك فوراً.
              </p>
            </div>
            <div className="flex flex-col items-center sm:items-end lg:items-center gap-1.5 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-green-200/50">
              <button 
                onClick={() => onCompleteProPlan?.()}
                disabled={isCompletingPro}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:scale-95 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-green-600/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={15} />
                <span>{isCompletingPro ? 'جاري إكمال الخطة...' : 'إكمال الخطة'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade CTA for FREE users */}
      {profile?.subscriptionPlan === 'FREE' && activeTab === 'overview' && (
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 rounded-2xl p-4 sm:p-5 border border-orange-200/80 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-right" dir="rtl">
            <div className="flex-1 space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-orange-600 text-white rounded-full text-[11px] font-bold">
                <Zap size={12} /> ترقية مسار التنفيذ
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                {activeUserData?.fullName && activeUserData?.ultimateDream 
                  ? <>هل أنت جاهز لتنفيذ حلمك بـ <span className="text-orange-600 font-extrabold">{activeUserData.ultimateDream}</span> يا <span className="text-orange-600 font-extrabold">{activeUserData.fullName.split(' ')[0]}</span>؟</>
                  : 'هل تريد فتح مسار التنفيذ الكامل؟'}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">
                أنت حالياً تستخدم باقة الاستخراج الأولية. لفتح الأرقام المالية الحقيقية، واستراتيجيات اختراق المنافسين، وخطة التشغيل الفعالة، ستحتاج للانتقال لباقة التنفيذ.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                  <div className="w-4 h-4 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <span>أرقام وأرباح وتكاليف واقعية</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                  <div className="w-4 h-4 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <span>نموذج أعمال (كيف يربح المشروع؟)</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                  <div className="w-4 h-4 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <span>تحليل عميق للمنافسين والرد عليهم</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                  <div className="w-4 h-4 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <span>استراتيجية تسويق كاملة</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center sm:items-end lg:items-center gap-1.5 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-orange-200/50">
              <button 
                onClick={() => onUpgrade?.()}
                className="w-full sm:w-auto px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <span>استعرض تفاصيل الباقات</span>
                <ArrowLeftCircle size={15} />
              </button>
              <p className="text-[11px] text-gray-500 font-medium text-center">خطوتك القادمة أصبحت حاسمة للحصول على التنفيذ الجاد.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`w-full ${activeTab === 'advisor' ? 'flex-1 flex flex-col min-h-0' : 'min-h-[500px]'}`}>
        {activeTab === 'overview' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-900">
            <div className="grid md:grid-cols-2 gap-8 pt-2">
              <div className="bg-gradient-to-br from-white to-orange-50/10 border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
                <div className="flex items-center gap-3">
                  <Lightbulb size={24} className="text-orange-600 shrink-0" />
                  <h3 className="text-xl font-black text-gray-950">لماذا هذا المشروع؟</h3>
                </div>
                <p className="text-gray-700 leading-relaxed font-medium text-sm">{plan.rationale || 'لم يتم توفير سبب محدد لهذه الخطة.'}</p>
              </div>
              
              <div className="bg-gradient-to-br from-white to-amber-50/10 border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
                <div className="flex items-center gap-3">
                  <TrendingUp size={24} className="text-orange-600 shrink-0" />
                  <h3 className="text-xl font-black text-gray-950">الفرصة المختارة</h3>
                </div>
                <p className="text-gray-700 leading-relaxed font-medium text-sm">{plan.marketAnalysis?.selectedOpportunityReasoning || 'غير متوفر'}</p>
              </div>
            </div>

            {/* Branded Advisor Call-to-action Button */}
            <AdvisorCTA 
              question="اسأل المرشد هل فكرتك قابلة للتوسع أو التغيير؟"
              onConsult={handleAdvisorClick}
              isFreeUser={isFreeUser}
            />

            <div className="space-y-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <Search size={24} className="text-orange-600 shrink-0" />
                <h3 className="text-xl font-black text-gray-950">تحليل مشاكل السوق التي يحلها المشروع</h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {plan.marketAnalysis?.identifiedProblems?.map((prob, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-soft hover:-translate-y-0.5 transition-all duration-300 space-y-3">
                    <h4 className="font-black text-gray-900 text-base flex items-center gap-2.5">
                      <span className="text-xs bg-orange-100 text-orange-600 w-7 h-7 flex items-center justify-center rounded-full font-bold shrink-0">{idx + 1}</span>
                      <span className="line-clamp-2">{prob.problem}</span>
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">{prob.reasoning}</p>
                  </div>
                )) || <p className="text-gray-500 text-sm">تحليل المشاكل غير متوفر.</p>}
              </div>
            </div>

            {/* 3 Project Decision Buttons - Rendered EXCLUSIVELY in Overview tab until executed/dismissed */}
            {!isDecisionDismissed && !isExecuting && !plan.isExecuted && (
              <div className="bg-gradient-to-r from-orange-50/70 via-white to-amber-50/70 border border-orange-200/80 rounded-3xl p-6 md:p-8 shadow-soft text-right animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center lg:text-right w-full lg:w-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-black">
                      <Sparkles size={14} className="text-orange-600" /> قرارات المشروع
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-gray-950">
                      ما هو قرارك بخصوص مشروع <span className="text-orange-600">"{plan.projectName}"</span>؟
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 font-medium max-w-2xl">
                      يمكنك اعتماد المشروع وبدء تنفيذه، أو إعادة إنشاء فكرة مختلفة تماماً، أو حذف هذه الفكرة نهائياً.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 w-full lg:w-auto">
                    {/* 1. سأنفذ هذه الفكرة */}
                    <button
                      onClick={handleExecuteDecision}
                      className="px-6 py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-700 hover:to-amber-700 rounded-2xl font-black text-sm md:text-base flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                    >
                      <Rocket size={20} className="shrink-0" />
                      <span>سأنفذ هذه الفكرة</span>
                    </button>

                    {/* 2. إعادة إنشاء الفكرة */}
                    <button
                      onClick={() => onCreateNewPlan?.()}
                      className="px-6 py-3.5 bg-white border-2 border-orange-200 hover:border-orange-500 text-orange-700 hover:text-orange-900 hover:bg-orange-50/50 rounded-2xl font-black text-sm md:text-base flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-soft cursor-pointer"
                    >
                      <RefreshCw size={18} className="shrink-0 text-orange-600" />
                      <span>إعادة إنشاء الفكرة</span>
                    </button>

                    {/* 3. حذف الفكرة */}
                    <button
                      onClick={() => setShowDeleteConfirmModal(true)}
                      className="px-5 py-3.5 bg-white border-2 border-red-200 hover:border-red-500 text-red-600 hover:text-red-800 hover:bg-red-50/60 rounded-2xl font-black text-sm md:text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-soft cursor-pointer"
                    >
                      <Trash2 size={18} className="shrink-0 text-red-500" />
                      <span>حذف الفكرة</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {renderTabNavigation()}
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500 text-gray-900">
            {/* Redesigned Premium Header */}
            <div className="bg-gradient-to-r from-orange-50/60 to-amber-50/30 border border-amber-100 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-gray-950">
                  دليل الهوية البصرية والبراندنج الاستراتيجي
                </h3>
                <p className="text-gray-600 text-xs mt-1">
                  هوية تجارية متكاملة مصممة خصيصاً لمشروعك لتعكس التموضع والتميز في السوق المصري.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white/80 p-3 rounded-2xl border border-orange-100 shrink-0">
                <Palette size={22} className="text-orange-600" />
                <div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase">اسم المشروع المعتمد</div>
                  <div className="text-base font-black text-gray-900">{plan.projectName}</div>
                </div>
              </div>
            </div>

            {/* Branded Advisor Call-to-action Button */}
            <AdvisorCTA 
              icon={Palette}
              question="اسأل المرشد كيف تختار طابع علامتك التجارية وتصميم الشعار؟"
              onConsult={handleAdvisorClick}
              isFreeUser={isFreeUser}
            />

            {/* Section A: Brand Naming Strategy */}
            {plan.identity?.brandNamingStrategy && (
              <div className="space-y-8 py-2">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <Sparkles size={20} className="text-orange-600 shrink-0" />
                  <div>
                    <h4 className="text-lg font-black text-gray-950">استراتيجية تسمية العلامة التجارية</h4>
                    <p className="text-gray-555 text-xs font-medium">تحليل منهجي لاختيار الاسم التجاري الأكثر ملاءمة وتأثيراً</p>
                  </div>
                </div>

                {/* Winning Name Reveal */}
                {plan.identity.brandNamingStrategy.finalRecommendation && (
                  <div className="bg-gradient-to-br from-white to-orange-50/20 border border-gray-100 rounded-3xl p-6 md:p-8 space-y-4 shadow-soft">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full uppercase">
                        الاسم الموصى به والاسم الفائز
                      </span>
                      <div className="text-4xl md:text-5xl font-black text-gray-950 tracking-wide pt-3">
                        {plan.identity.brandNamingStrategy.finalRecommendation.winnerName}
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <div className="text-xs text-gray-500 font-bold mb-1">الرؤية والتحليل الاستراتيجي للاختيار:</div>
                      <p className="text-gray-700 leading-relaxed font-semibold text-sm md:text-base">
                        {plan.identity.brandNamingStrategy.finalRecommendation.reasoning}
                      </p>
                    </div>
                  </div>
                )}

                {/* Top 3 Finalists */}
                <div className="space-y-4 pt-4">
                  <h5 className="font-black text-gray-950 text-base flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-orange-500"></span> المرشحون النهائيون والتقييم التفصيلي
                  </h5>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {(plan.identity.brandNamingStrategy.top3Names || []).map((item, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft space-y-4 hover:-translate-y-0.5 transition-all duration-300"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-center gap-2 pb-3 border-b border-gray-105">
                            <h6 className="text-xl font-black text-gray-950">{item?.name}</h6>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                              التقييم: {item?.evaluationScore || 10}/10
                            </span>
                          </div>

                          <div className="space-y-3 text-xs leading-relaxed text-gray-700">
                            <div className="space-y-1">
                              <span className="block font-black text-xs text-gray-900">1. السبب الاستراتيجي:</span>
                              <p className="text-gray-600 font-medium leading-relaxed">{item?.deepExplanation || ''}</p>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="block font-black text-xs text-gray-900">2. التموضع التجاري:</span>
                              <p className="text-gray-600 font-medium leading-relaxed">{item?.brandPositioning || ''}</p>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="block font-black text-xs text-gray-900">3. الهوية البصرية واللوجو:</span>
                              <p className="text-gray-600 font-medium leading-relaxed">{item?.logoDirection || ''}</p>
                            </div>

                            <div className="flex justify-between items-center py-2 border-t border-b border-gray-50">
                              <span className="text-xs text-gray-550 font-bold">توفر النطاق (Domain):</span>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                item?.domainSuggestion === 'High' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                  : item?.domainSuggestion === 'Medium' 
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                {item?.domainSuggestion === 'High' ? 'سهل ومتاح' : item?.domainSuggestion === 'Medium' ? 'متوسط الصعوبة' : 'صعب ومحجوز'}
                              </span>
                            </div>

                            {item?.riskCheck && (
                              <div className="text-[11px] text-orange-950 bg-orange-50/20 p-3 rounded-xl border border-orange-100/50">
                                <strong>تحليل المخاطر القانونية:</strong> {item.riskCheck}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generated 15 Names Grid */}
                {plan.identity?.brandNamingStrategy?.generatedNames && plan.identity.brandNamingStrategy.generatedNames.length > 0 && (
                  <div className="space-y-3 pt-6 border-t border-gray-100">
                    <h5 className="font-black text-gray-950 text-xs flex items-center gap-2">
                      <ListChecks size={16} className="text-gray-400" /> القائمة الطويلة للاقتراحات المبدئية (15 خياراً استرشادياً)
                    </h5>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(plan.identity.brandNamingStrategy.generatedNames || []).map((name, idx) => (
                        <span 
                          key={idx} 
                          className="px-3 py-1 bg-white border border-gray-100 hover:border-orange-200 text-gray-600 hover:text-orange-600 text-xs font-semibold rounded-lg transition-all duration-200 cursor-default"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Section B: Brand Identity System */}
            {plan.identity?.brandIdentitySystem && (
              <div className="space-y-8 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <Compass size={20} className="text-orange-600 shrink-0" />
                  <div>
                    <h4 className="text-lg font-black text-gray-950">نظام الهوية الاستراتيجية للبراند (Strategic Brand Blueprint)</h4>
                    <p className="text-gray-555 text-xs font-medium">الميثاق التأسيسي والقيم والرحلة العاطفية التي تصنع رابطاً وثيقاً مع العميل</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Card 1: Brand Foundation */}
                  {plan.identity?.brandIdentitySystem?.brandFoundation && (
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-6">
                      <h5 className="text-lg font-black text-gray-950 flex items-center gap-2.5 pb-3 border-b border-gray-50">
                        <Compass size={18} className="text-orange-600 shrink-0" />
                        <span>رؤية ورسالة العلامة</span>
                      </h5>
                      
                      <div className="space-y-6">
                        {plan.identity.brandIdentitySystem.brandFoundation.mission && (
                          <div className="space-y-1">
                            <strong className="block text-gray-900 font-bold text-xs uppercase tracking-wide">المهمة والغاية (Mission):</strong>
                            <span className="text-gray-600 text-sm leading-relaxed block font-medium">{plan.identity.brandIdentitySystem.brandFoundation.mission}</span>
                          </div>
                        )}
                        {plan.identity.brandIdentitySystem.brandFoundation.vision && (
                          <div className="space-y-1">
                            <strong className="block text-gray-900 font-bold text-xs uppercase tracking-wide">الرؤية المستقبلية (Vision):</strong>
                            <span className="text-gray-600 text-sm leading-relaxed block font-medium">{plan.identity.brandIdentitySystem.brandFoundation.vision}</span>
                          </div>
                        )}
                        {plan.identity.brandIdentitySystem.brandFoundation.coreValues && (
                          <div className="space-y-2">
                            <strong className="block text-gray-900 font-bold text-xs uppercase tracking-wide">القيم الحاكمة (Core Values):</strong>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {(plan.identity.brandIdentitySystem.brandFoundation.coreValues || []).map((v, i) => (
                                <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-full text-xs font-bold transition-all">
                                  {v}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Card 2: Brand Positioning */}
                  {plan.identity.brandIdentitySystem.brandPositioning && (
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-6">
                      <h5 className="text-lg font-black text-gray-950 flex items-center gap-2.5 pb-3 border-b border-gray-50">
                        <Target size={18} className="text-orange-600 shrink-0" />
                        <span>التموضع والحلول الاستراتيجية</span>
                      </h5>
                      
                      <div className="space-y-6">
                        {plan.identity.brandIdentitySystem.brandPositioning.differentiation && (
                          <div className="space-y-1">
                            <strong className="block text-gray-900 font-bold text-xs uppercase tracking-wide">التمايز الاستثنائي والمنافسة (Differentiation):</strong>
                            <span className="text-gray-600 text-sm leading-relaxed block font-medium">{plan.identity.brandIdentitySystem.brandPositioning.differentiation}</span>
                          </div>
                        )}
                        {plan.identity.brandIdentitySystem.brandPositioning.targetAudience && (
                          <div className="space-y-1">
                            <strong className="block text-gray-900 font-bold text-xs uppercase tracking-wide">الجمهور المستهدف والدقيق:</strong>
                            <span className="text-gray-600 text-sm leading-relaxed block font-medium">{plan.identity.brandIdentitySystem.brandPositioning.targetAudience}</span>
                          </div>
                        )}
                        {plan.identity.brandIdentitySystem.brandPositioning.problemSolved && (
                          <div className="space-y-1">
                            <strong className="block text-gray-900 font-bold text-xs uppercase tracking-wide">الفجوة والمشكلة الأساسية التي نحلها:</strong>
                            <span className="text-gray-600 text-sm leading-relaxed block font-medium">{plan.identity.brandIdentitySystem.brandPositioning.problemSolved}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}



                  {/* Card 4: Brand Experience & Quality */}
                  {plan.identity.brandIdentitySystem.brandExperience && (
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-6">
                      <h5 className="text-lg font-black text-gray-950 flex items-center gap-2.5 pb-3 border-b border-gray-50">
                        <ShieldCheck size={18} className="text-orange-600 shrink-0" />
                        <span>تجربة البراند ومراقبة الجودة</span>
                      </h5>
                      
                      <div className="space-y-6">
                        {plan.identity.brandIdentitySystem.brandExperience.emotionalJourney && (
                          <div className="space-y-1 bg-gradient-to-r from-orange-50/20 to-transparent p-4 rounded-2xl border border-orange-100/40">
                            <strong className="block text-orange-950 font-bold text-xs uppercase tracking-wide">الرحلة العاطفية للعميل (Emotional Arc):</strong>
                            <span className="text-orange-900 text-sm leading-relaxed block font-semibold">{plan.identity.brandIdentitySystem.brandExperience.emotionalJourney}</span>
                          </div>
                        )}

                        <div className="space-y-3">
                          <strong className="block text-gray-900 font-bold text-xs uppercase tracking-wide">نقاط الاتصال والانطباع المستهدف:</strong>
                          
                          {plan.identity.brandIdentitySystem.brandExperience.websiteFeeling && (
                            <div className="text-xs text-gray-600 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <span className="font-bold text-gray-900 block mb-0.5">🌐 الهوية الرقمية والمنصات:</span> {plan.identity.brandIdentitySystem.brandExperience.websiteFeeling}
                            </div>
                          )}
                          {plan.identity.brandIdentitySystem.brandExperience.productExperience && (
                            <div className="text-xs text-gray-600 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <span className="font-bold text-gray-900 block mb-0.5">📦 تجربة استخدام المنتج/الخدمة:</span> {plan.identity.brandIdentitySystem.brandExperience.productExperience}
                            </div>
                          )}
                          {plan.identity.brandIdentitySystem.brandExperience.customerInteraction && (
                            <div className="text-xs text-gray-600 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <span className="font-bold text-gray-900 block mb-0.5">💬 تفاعل خدمة العملاء والدعم:</span> {plan.identity.brandIdentitySystem.brandExperience.customerInteraction}
                            </div>
                          )}
                        </div>

                        {plan.identity.brandIdentitySystem.qualityControl && (
                          <div className="space-y-3 pt-4 border-t border-gray-100">
                            <strong className="block text-gray-950 font-black text-sm">معايير ومراقبة الجودة (Quality Metrics):</strong>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-50/50 border border-gray-100/80 p-3 rounded-xl flex items-center gap-2.5">
                                <Check size={16} className="text-orange-600 shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-[9px] text-gray-500 block font-bold leading-none mb-0.5">القابلية للنمو</span>
                                  <span className="text-xs font-black text-gray-900 truncate block">{plan.identity.brandIdentitySystem.qualityControl.scalable || 'نعم'}</span>
                                </div>
                              </div>
                              <div className="bg-gray-50/50 border border-gray-100/80 p-3 rounded-xl flex items-center gap-2.5">
                                <Check size={16} className="text-orange-600 shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-[9px] text-gray-500 block font-bold leading-none mb-0.5">التميز والتفرد</span>
                                  <span className="text-xs font-black text-gray-900 truncate block">{plan.identity.brandIdentitySystem.qualityControl.distinctive || 'نعم'}</span>
                                </div>
                              </div>
                              <div className="bg-gray-50/50 border border-gray-100/80 p-3 rounded-xl flex items-center gap-2.5">
                                <Check size={16} className="text-orange-600 shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-[9px] text-gray-500 block font-bold leading-none mb-0.5">سهولة التذكر</span>
                                  <span className="text-xs font-black text-gray-900 truncate block">{plan.identity.brandIdentitySystem.qualityControl.memorable || 'نعم'}</span>
                                </div>
                              </div>
                              <div className="bg-gray-50/50 border border-gray-100/80 p-3 rounded-xl flex items-center gap-2.5">
                                <Check size={16} className="text-orange-600 shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-[9px] text-gray-500 block font-bold leading-none mb-0.5">التطابق والتناسق</span>
                                  <span className="text-xs font-black text-gray-900 truncate block">{plan.identity.brandIdentitySystem.qualityControl.consistent || 'نعم'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section C: Visual Identity System */}
            {plan.identity?.brandIdentitySystem?.visualIdentitySystem && (
              <div className="bg-surface rounded-2xl border border-border shadow-soft overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50">
                  <h4 className="text-xl font-bold text-gray-900">نظام الهوية البصرية المتكامل (Brand Style Guide)</h4>
                  <p className="text-gray-500 text-xs mt-1">تحديد دقيق للألوان، الخطوط، والنمط البصري الذي سيحكم تصميم منصاتك وتغليفك</p>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                  {/* Colors Specification Section */}
                  {plan.identity?.brandIdentitySystem?.visualIdentitySystem?.colorPalette && (
                    <div className="space-y-6">
                      <h5 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        لوحة الألوان المعتمدة ومواصفاتها الهندسية (Hex Colors)
                      </h5>
                      
                      <div className="grid md:grid-cols-3 gap-6">
                        <ColorPaletteGroup
                          title="الألوان الأساسية (Primary)"
                          badgeClass="text-amber-700 bg-amber-50 border-amber-100"
                          colors={plan.identity?.brandIdentitySystem?.visualIdentitySystem?.colorPalette?.primary}
                          prefix="pri"
                        />
                        <ColorPaletteGroup
                          title="الألوان الثانوية (Secondary)"
                          badgeClass="text-purple-700 bg-purple-50 border-purple-100"
                          colors={plan.identity?.brandIdentitySystem?.visualIdentitySystem?.colorPalette?.secondary}
                          prefix="sec"
                        />
                        <ColorPaletteGroup
                          title="ألوان الخلفيات (Neutral/Backs)"
                          badgeClass="text-slate-700 bg-slate-100 border-slate-200"
                          colors={plan.identity?.brandIdentitySystem?.visualIdentitySystem?.colorPalette?.background}
                          prefix="bg"
                        />
                      </div>

                      {plan.identity.brandIdentitySystem.logoConcept?.colorLogic && (
                        <div className="bg-amber-50/50 p-5 rounded-2xl text-sm text-amber-950 border border-amber-100/60 leading-relaxed">
                          <strong className="block text-amber-900 font-bold mb-1">الفلسفة والمنطق اللوني (Color Logic):</strong>
                          {plan.identity.brandIdentitySystem.logoConcept.colorLogic}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Typography & Specimen board */}
                  {plan.identity.brandIdentitySystem.visualIdentitySystem.typography && (
                    <div className="space-y-6 border-t border-gray-100 pt-8">
                      <h5 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        نظام التايبوجرافي وتجربة الخطوط (Typography Setup)
                      </h5>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="text-xs text-orange-600 font-bold uppercase tracking-wider">خط العناوين الرئيسي (Headings Font)</span>
                            <span className="text-xs font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">{plan.identity.brandIdentitySystem.visualIdentitySystem.typography.headingStyle}</span>
                          </div>
                          
                          {/* Typographical specimen */}
                          <div className="py-4 font-sans">
                            <div style={{ fontFamily: 'Tajawal, sans-serif' }} className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
                              رائد الأعمال وصناعة المستقبل
                            </div>
                            <div style={{ fontFamily: 'Tajawal, sans-serif' }} className="text-xl font-bold text-amber-600 mt-1">
                              BUSINESS CREATOR PLATFORM
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="text-xs text-orange-600 font-bold uppercase tracking-wider">خط النصوص والقراءة (Body Font)</span>
                            <span className="text-xs font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">{plan.identity.brandIdentitySystem.visualIdentitySystem.typography.bodyStyle}</span>
                          </div>
                          
                          {/* Typographical specimen */}
                          <div className="py-2 text-sm text-gray-600 leading-relaxed font-sans">
                            هذه عينة نصية توضح سهولة قراءة خط النصوص المعتمد. صُمم هذا الخط ليوفر للعين تجربة قراءة مريحة وعالية الوضوح على جميع الهواتف المحمولة والمنصات الذكية، مما يضمن اتساق البراند ورسالتك.
                          </div>
                        </div>
                      </div>

                      {plan.identity.brandIdentitySystem.visualIdentitySystem.typography.reasoning && (
                        <div className="text-xs text-orange-950 bg-orange-50/40 border border-orange-100/50 p-4 rounded-xl italic">
                          <strong>السبب الاستراتيجي للاختيار:</strong> {plan.identity.brandIdentitySystem.visualIdentitySystem.typography.reasoning}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Visual Direction & Imagery */}
                  {plan.identity.brandIdentitySystem.visualIdentitySystem.visualStyle && (
                    <div className="space-y-6 border-t border-gray-100 pt-8">
                      <h5 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        التوجه الفني والأسلوب الإبداعي (Creative Direction)
                      </h5>

                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-2">
                          <span className="text-xs text-gray-400 font-bold block">📸 اتجاه وتصنيف الصور</span>
                          <p className="text-sm font-bold text-gray-800 leading-relaxed">{plan.identity.brandIdentitySystem.visualIdentitySystem.visualStyle.imageDirection}</p>
                        </div>
                        
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-2">
                          <span className="text-xs text-gray-400 font-bold block">🎨 نمط الأيقونات والرسوم</span>
                          <p className="text-sm font-bold text-gray-800 leading-relaxed">{plan.identity.brandIdentitySystem.visualIdentitySystem.visualStyle.iconStyle}</p>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-2">
                          <span className="text-xs text-gray-400 font-bold block">📄 أسلوب التخطيط والتصميم (Layout)</span>
                          <p className="text-sm font-bold text-gray-800 leading-relaxed">{plan.identity.brandIdentitySystem.visualIdentitySystem.visualStyle.layoutStyle}</p>
                        </div>
                      </div>

                      {plan.identity.brandIdentitySystem.visualIdentitySystem.consistencySystem && (
                        <div className="bg-orange-50/30 border border-orange-100/50 p-5 rounded-2xl text-xs text-orange-950 leading-relaxed">
                          <strong className="block text-orange-900 mb-1">نظام التنسيق وتطابق القنوات (Consistency System):</strong>
                          {plan.identity.brandIdentitySystem.visualIdentitySystem.consistencySystem}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Strategic Logo Blueprint */}
                  {plan.identity.brandIdentitySystem.logoConcept && (
                    <div className="bg-[#1A1A1A] text-white rounded-2xl overflow-hidden border border-neutral-800 shadow-lg mt-6">
                      <div className="p-6 md:p-8 border-b border-neutral-800 bg-neutral-900/50">
                        <h5 className="font-bold text-amber-400 text-lg flex items-center gap-2">
                          <Palette size={18} className="text-orange-600 shrink-0" />
                          <span>المخطط الإنشائي للشعار (Strategic Logo Concept)</span>
                        </h5>
                        <p className="text-neutral-400 text-xs mt-1">الدراسة السيميائية والهندسية لتكوين الرمز التجاري</p>
                      </div>
                      
                      <div className="p-6 md:p-8 grid md:grid-cols-4 gap-6 text-sm">
                        <div className="space-y-1">
                          <span className="text-xs text-neutral-500 font-bold block">نوع الشعار (Type)</span>
                          <span className="font-bold text-white text-base block">{plan.identity.brandIdentitySystem.logoConcept.logoType}</span>
                        </div>
                        
                        <div className="md:col-span-2 space-y-1">
                          <span className="text-xs text-neutral-500 font-bold block">الفكرة المركزية والرمزية</span>
                          <span className="text-neutral-300 leading-relaxed block">{plan.identity.brandIdentitySystem.logoConcept.conceptIdea}</span>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-xs text-neutral-500 font-bold block">سيكولوجية الأشكال</span>
                          <span className="text-neutral-300 block">{plan.identity.brandIdentitySystem.logoConcept.shapePsychology}</span>
                        </div>
                      </div>
                      
                      <div className="px-6 md:px-8 py-4 bg-neutral-900 border-t border-neutral-800 text-xs flex justify-between items-center text-neutral-400">
                        <span><strong>قابلية التوسع والـ Responsive:</strong> {plan.identity.brandIdentitySystem.logoConcept.scalability}</span>
                        <span className="text-amber-500 font-bold">BUSINESS CREATOR BLUEPRINT</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Visual Identity Fallbacks (if full system not yet generated) */}
            {!plan.identity?.brandIdentitySystem && (
              <div className="bg-surface rounded-2xl p-6 md:p-8 border border-border shadow-soft space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Colors Fallback */}
                  <div className="space-y-5">
                    <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                      ألوان العلامة التجارية
                    </h4>
                    <div className="flex gap-4 flex-wrap">
                      {(plan.identity?.brandColors || []).map((color, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2">
                          <div 
                            className="w-16 h-16 rounded-2xl shadow-inner border border-gray-200 transition-transform duration-300 hover:scale-105"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">{color}</span>
                        </div>
                      ))}
                    </div>
                    {plan.identity?.colorPsychology && (
                      <div className="bg-amber-50/40 p-4 rounded-xl text-xs text-amber-950 border border-amber-100/50 leading-relaxed">
                        <strong className="block text-amber-900 font-bold mb-1">سيكولوجية الألوان:</strong>
                        {plan.identity?.colorPsychology}
                      </div>
                    )}
                  </div>

                  {/* Typography Fallback */}
                  <div className="space-y-5">
                    <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                      خطوط البراند ونبرة الصوت
                    </h4>
                    
                    {plan.identity?.typography ? (
                      <div className="bg-purple-50/40 p-4 rounded-xl border border-purple-100 space-y-2">
                        <div className="text-lg font-black text-purple-900">{plan.identity?.typography.fontFamily}</div>
                        <p className="text-xs text-purple-800 leading-relaxed">{plan.identity?.typography.description}</p>
                      </div>
                    ) : (
                      <div className="text-gray-450 text-xs">تحديد الخطوط قيد التقييم الفني...</div>
                    )}
                    
                    {plan.identity?.brandVoice && (
                      <div className="bg-orange-50 p-4 rounded-xl text-xs text-orange-950 border border-orange-100 leading-relaxed">
                        <strong className="block text-orange-900 font-bold mb-1">نبرة صوت العلامة (Brand Voice):</strong>
                        {plan.identity?.brandVoice}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Redesigned AI Logo Studio */}
            <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-[#1A1A1A] text-white shadow-xl mt-6 relative">
              <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
              
              <div className="p-6 md:p-8 border-b border-neutral-800 bg-neutral-900/40 flex flex-col md:flex-row md:items-start lg:items-center justify-between gap-4">
                <div>
                  <h4 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 flex items-center gap-2">
                    <Sparkles size={24} className="text-amber-500 animate-pulse" />
                    <span>استوديو تصميم الشعارات الذكي</span>
                  </h4>
                  <p className="text-neutral-400 text-xs mt-1">مولد شعارات BUSINESS CREATOR مدعوم بالذكاء الاصطناعي لإنشاء شعارات بصيغة SVG وصور عالية الدقة</p>
                </div>
                
                <div className="flex items-center gap-3 bg-neutral-800 border border-neutral-700 px-4 py-2 rounded-xl text-xs shrink-0 self-start md:self-auto">
                  <span className="text-amber-400 font-bold">الرصيد: {profile?.tokens || 0} نقطة</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-600"></span>
                  <span className="text-neutral-400">التكلفة: <strong className="text-white">10,000 نقطة</strong></span>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                {/* Prompt Description block */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-neutral-200">وصف فكرة الشعار المقترح للشغل الإبداعي</label>
                  <textarea 
                    id="logo-prompt"
                    className="w-full h-28 p-4 rounded-xl bg-neutral-900 border border-neutral-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm text-white resize-none leading-relaxed transition-all"
                    placeholder="أدخل تفاصيل ومفردات الشعار بالإنجليزية أو العربية (سيقوم BUSINESS CREATOR بتحسينها تلقائياً باللغة الإنجليزية لتطوير أفضل شعار متجه)"
                    defaultValue={plan.identity?.logoConcept}
                  />
                  <p className="text-[10px] text-neutral-500">
                    تنويه: يفضل الوصف بالإنجليزية للحصول على أفضل دقة في التفاصيل والنسب الجمالية للشعار.
                  </p>
                </div>

                {/* Style Selection Grid - Restricted to Minimalist only */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-neutral-200">نمط الشعار المستهدف</label>
                  
                  <div className="flex items-center gap-3 bg-neutral-900 border border-amber-500/30 p-4 rounded-xl max-w-sm">
                    <span className="text-2xl text-amber-500">✨</span>
                    <div>
                      <div className="font-bold text-sm text-neutral-100">بسيط (Minimalist)</div>
                      <div className="text-[10px] text-neutral-500">تصميم متجه نظيف، عصري، ومسطح مع خلفية بيضاء</div>
                    </div>
                  </div>

                  {/* Hidden select to satisfy the legacy JS DOM reading of logo-style */}
                  <select id="logo-style" className="hidden" value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)}>
                    <option value="minimalist vector logomark, clean, modern, flat design, white background" />
                  </select>
                </div>

                {/* Low Tokens Notice for Logo Generation */}
                {showLogoTokensCard && (
                  <InsufficientTokensCard
                    title="Business Creator | استوديو الهوية"
                    badgeText="تنبيه رصيد تصميم الشعار"
                    message="عفواً، لقد نفد رصيدك من النقاط. يرجى شراء باقة جديدة لتتمكن من إنشاء الشعار."
                    description="باقة رواد الأعمال (PRO) تمنحك 100,000 نقطة لتصميم شعار متقن وعالي الجودة لمشروعك، مع ملفات جاهزة للطباعة والاستخدام الرقمي."
                    onUpgrade={onUpgrade}
                    className="mb-4"
                  />
                )}

                {/* Generate Trigger Button */}
                <div className="pt-4 border-t border-neutral-800/65 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <span className="text-xs text-neutral-450 self-start md:self-auto">يقوم محركنا الإبداعي بمعالجة وتشكيل الشعار في غضون 10 ثوانٍ فقط.</span>
                  
                  <button 
                    onClick={async () => {
                      if (isGeneratingLogo) return;
                      const userTokens = profile?.tokens || 0;
                      if (!isAdmin && userTokens < TOKEN_COSTS.LOGO_GENERATION) {
                        setShowLogoTokensCard(true);
                        return;
                      }
                      setShowLogoTokensCard(false);
                      const promptInput = (document.getElementById('logo-prompt') as HTMLTextAreaElement)?.value || plan.identity?.logoConcept || '';
                      const styleDesc = selectedStyle;
                      setIsGeneratingLogo(true);
                      try {
                        if (!isAdmin && userTokens >= TOKEN_COSTS.LOGO_GENERATION) {
                          await updateProfile({ tokens: userTokens - TOKEN_COSTS.LOGO_GENERATION });
                        }
                        const result = await runAiTask('generate_logo', {
                          prompt: promptInput,
                          projectName: plan.projectName,
                          idea: plan.concept,
                          styleDesc
                        }, profile?.uid || '');
                        if (result) {
                          setLogoResult(result);
                          try {
                            await supabase.from('logs').insert({
                              user_id: user?.id || profile?.uid || 'anonymous',
                              user_name: profile?.displayName || user?.email || 'مستخدم',
                              user_email: user?.email || profile?.email || '',
                              action: 'توليد وتصميم شعار بالذكاء الاصطناعي (Generate Logo)',
                              details: { projectName: plan.projectName, module: 'Branding' },
                              timestamp: new Date().toISOString()
                            });
                          } catch (lErr) {
                            console.warn("Failed to log logo generation:", lErr);
                          }
                        }
                      } catch (err: any) {
                        console.error('Failed to generate logo:', err);
                        if (!isAdmin && userTokens >= TOKEN_COSTS.LOGO_GENERATION) {
                          try { await updateProfile({ tokens: userTokens }); } catch (e) {}
                        }
                      } finally {
                        setIsGeneratingLogo(false);
                      }
                    }}
                    disabled={isGeneratingLogo}
                    className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingLogo ? (
                      <>
                        <RefreshCw size={16} className="animate-spin text-white" />
                        <span>جاري معالجة وتوليد الشعار...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className="text-amber-200" />
                        <span>{logoResult ? 'إعادة تشكيل الشعار بالذكاء الاصطناعي' : 'توليد الشعار المتجه المتكامل الآن ✨'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Logo Showcase Section */}
                {logoResult && (
                  <div className="space-y-6 pt-6 border-t border-neutral-800">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="font-bold text-base text-white">نتائج استوديو الهوية والشعار المولد</h5>
                        <p className="text-xs text-neutral-400 mt-0.5">{logoResult.logoConceptExplanation || 'تم توليد الشعار بنجاح متوافقاً مع هوية المشروع.'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-4">
                      {/* Primary SVG Vector Showcase */}
                      <div className="space-y-4">
                         <div className="flex justify-between items-center">
                           <h6 className="font-bold text-sm text-neutral-200">الشعار المتجه الرئيسي (Vector SVG)</h6>
                           <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">مثالي للطباعة والمواقع</span>
                         </div>
                         <div className="bg-white border border-neutral-800 rounded-2xl p-8 flex items-center justify-center min-h-[280px] shadow-inner relative group">
                            <img src={svgToDataUri(logoResult.primarySvg)} alt="الشعار المتجه الرئيسي" className="w-44 h-44 object-contain" />
                         </div>
                         <button 
                           onClick={() => {
                             const blob = new Blob([logoResult.primarySvg], {type: 'image/svg+xml'});
                             const url = URL.createObjectURL(blob);
                             const a = document.createElement('a');
                             a.href = url;
                             a.download = `${plan.projectName}-primary.svg`;
                             a.click();
                           }}
                           className="w-full px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-neutral-700 transition-colors"
                         >
                           <Download size={14} /> تحميل ملف SVG المتجه
                         </button>
                      </div>

                      {/* High-Res Image Showcase */}
                      <div className="space-y-4">
                         <div className="flex justify-between items-center">
                           <h6 className="font-bold text-sm text-neutral-200">النسخة ثلاثية الأبعاد (High-Res Realistic)</h6>
                           <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold">للدعاية وشبكات التواصل</span>
                         </div>
                         <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 flex items-center justify-center min-h-[280px] shadow-inner relative overflow-hidden">
                            <img 
                              src={logoResult.primaryPngBase64 || `https://image.pollinations.ai/prompt/${encodeURIComponent(logoResult.primaryPromptForImageAI)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random()*10000)}`}
                              alt="High Resolution Logo"
                              className="w-full h-auto max-w-[200px] rounded-2xl shadow-2xl transition-transform duration-500 hover:scale-105"
                              referrerPolicy="no-referrer"
                              id="gemini-logo"
                            />
                         </div>
                         <button 
                           onClick={() => {
                             const img = document.getElementById('gemini-logo') as HTMLImageElement;
                             if(img && img.src) {
                               if (img.src.startsWith('data:')) {
                                 const a = document.createElement('a');
                                 a.href = img.src;
                                 a.download = `${plan.projectName}-highres.png`;
                                 a.click();
                               } else {
                                 fetch(img.src).then(res => res.blob()).then(blob => {
                                   const url = window.URL.createObjectURL(blob);
                                   const a = document.createElement('a');
                                   a.href = url;
                                   a.download = `${plan.projectName}-highres.png`;
                                   a.click();
                                 });
                               }
                             }
                           }}
                           className="w-full px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-neutral-700 transition-colors"
                         >
                           <Download size={14} /> تحميل نسخة PNG عالية الدقة
                         </button>
                      </div>
                    </div>

                    {/* Monochrome Variations section */}
                    <div className="pt-8 border-t border-neutral-800 space-y-4">
                      <h6 className="font-bold text-sm text-neutral-200">النسخ التكميلية وأيقونة الموقع (Brand Variations)</h6>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 text-center space-y-3">
                           <span className="text-xs text-neutral-400 font-bold block">نسخة سوداء (Mono Dark)</span>
                           <div className="bg-white rounded-xl p-4 flex items-center justify-center w-28 h-28 mx-auto shadow-inner">
                              <img src={svgToDataUri(logoResult.blackSvg)} alt="النسخة السوداء" className="w-16 h-16 object-contain" />
                           </div>
                        </div>
                        
                        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 text-center space-y-3">
                           <span className="text-xs text-neutral-400 font-bold block">نسخة بيضاء (Mono Light)</span>
                           <div className="bg-neutral-900 rounded-xl p-4 flex items-center justify-center w-28 h-28 mx-auto border border-neutral-800">
                              <img src={svgToDataUri(logoResult.whiteSvg)} alt="النسخة البيضاء" className="w-16 h-16 object-contain" />
                           </div>
                        </div>

                        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 text-center space-y-3">
                           <span className="text-xs text-neutral-400 font-bold block">أيقونة الموقع (Favicon)</span>
                           <div className="bg-neutral-900 rounded-xl p-4 flex items-center justify-center w-28 h-28 mx-auto border border-neutral-800">
                              <img src={svgToDataUri(logoResult.faviconSvg)} alt="أيقونة الموقع" className="w-12 h-12 object-contain" />
                           </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            </div>

            {renderTabNavigation()}
          </div>
        )}

          {activeTab === 'marketAnalysis' && (
            <MarketAnalysisTab plan={plan} renderTabNavigation={renderTabNavigation} onConsultAdvisor={handleAdvisorClick} isFreeUser={isFreeUser} />
          )}

          {activeTab === 'validation' && (
            <ValidationTab plan={plan} renderTabNavigation={renderTabNavigation} onConsultAdvisor={handleAdvisorClick} isFreeUser={isFreeUser} />
          )}

          {activeTab === 'targetAudience' && (
            <TargetAudienceTab plan={plan} renderTabNavigation={renderTabNavigation} onConsultAdvisor={handleAdvisorClick} isFreeUser={isFreeUser} />
          )}

          {activeTab === 'competitors' && (
            <CompetitorsAnalysisTab plan={plan} renderTabNavigation={renderTabNavigation} onConsultAdvisor={handleAdvisorClick} isFreeUser={isFreeUser} />
          )}

          {activeTab === 'businessStrategy' && (
            <BusinessStrategyTab plan={plan} renderTabNavigation={renderTabNavigation} onConsultAdvisor={handleAdvisorClick} isFreeUser={isFreeUser} />
          )}

          {activeTab === 'businessModel' && (
            <BusinessModelCanvasTab plan={plan} renderTabNavigation={renderTabNavigation} onConsultAdvisor={handleAdvisorClick} isFreeUser={isFreeUser} />
          )}

          {activeTab === 'execution' && (
            <ExecutionGuideTab plan={plan} renderTabNavigation={renderTabNavigation} onConsultAdvisor={handleAdvisorClick} isFreeUser={isFreeUser} />
          )}

          {activeTab === 'financials' && (
             <FinancialsTab plan={plan} renderTabNavigation={renderTabNavigation} onConsultAdvisor={handleAdvisorClick} isFreeUser={isFreeUser} />
          )}

          {activeTab === 'marketing' && (
            <MarketingStrategyTab plan={plan} renderTabNavigation={renderTabNavigation} onConsultAdvisor={handleAdvisorClick} isFreeUser={isFreeUser} />
          )}

          {activeTab === 'swot' && (
            <SwotAnalysisTab plan={plan} renderTabNavigation={renderTabNavigation} onConsultAdvisor={handleAdvisorClick} isFreeUser={isFreeUser} />
          )}

          {activeTab === 'investment' && (
            <InvestmentTab plan={plan} renderTabNavigation={renderTabNavigation} onConsultAdvisor={handleAdvisorClick} isFreeUser={isFreeUser} />
          )}

          {activeTab === 'resources' && (
            <ResourcesTab
              plan={plan}
              profile={profile}
              activeUserData={activeUserData}
              challengesAdvice={challengesAdvice}
              renderTabNavigation={renderTabNavigation}
              onConsultAdvisor={handleAdvisorClick}
              isFreeUser={isFreeUser}
            />
          )}

          {activeTab === 'advisor' && profile && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden min-h-0">
              <AdvisorChat profile={profile} plan={plan} onClose={() => onTabChange('overview')} onUpgrade={onUpgrade} />
            </div>
          )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border-2 border-black p-8 max-w-md w-full space-y-6 text-center animate-in zoom-in-95 text-black">
            <div className="w-16 h-16 border border-black text-black flex items-center justify-center mx-auto mb-4">
              <HelpCircle size={32} />
            </div>
            <h3 className="text-2xl font-bold text-black">ماذا تريد أن تفعل بهذه الخطة؟</h3>
            <p className="text-neutral-700 text-sm font-normal leading-relaxed">بما أنك قررت عدم تنفيذ هذا المشروع حالياً، يمكنك الاختيار من الإجراءات التالية لحفظ مجهودك:</p>
            <div className="space-y-3">
              <button 
                onClick={() => { setShowRejectModal(false); onSavePlan?.(plan); }} 
                className="w-full py-3 px-4 border border-black text-black font-bold hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
                disabled={isSaving}
              >
                {isSaving ? 'جاري الحفظ...' : <><Save size={18} /> حفظها لوقت لاحق</>}
              </button>
              <button 
                onClick={() => { setShowRejectModal(false); onCreateNewPlan?.(); }} 
                className="w-full py-3 px-4 border border-black text-black font-bold hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} /> عمل مشروع غيره
              </button>
              <button 
                onClick={() => { 
                  setShowRejectModal(false);
                  setShowDeleteConfirmModal(true);
                }} 
                className="w-full py-3 px-4 border border-neutral-300 hover:border-black text-neutral-600 hover:text-black font-bold transition-all flex items-center justify-center gap-2"
                disabled={isSaving}
              >
                <Trash2 size={18} /> حذف الخطة نهائياً
              </button>
            </div>
            <button 
              onClick={() => setShowRejectModal(false)} 
              className="mt-4 text-xs text-neutral-600 hover:text-black font-black underline"
            >
              إلغاء التراجع
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border-2 border-black p-8 max-w-md w-full space-y-6 text-center animate-in zoom-in-95 text-black">
            <div className="w-16 h-16 border border-black text-black flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-black text-black">هل أنت متأكد تماماً؟</h3>
            <p className="text-neutral-700 text-sm font-semibold leading-relaxed">سيتم حذف هذا المشروع نهائياً من حسابك ومن قاعدة البيانات. لا يمكن التراجع عن هذا الإجراء بعد الحذف.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteConfirmModal(false)} 
                className="flex-1 py-3 px-4 border border-neutral-300 hover:border-black text-neutral-700 hover:text-black font-black transition-all"
              >
                إلغاء
              </button>
              <button 
                onClick={() => { 
                  onDeletePlan?.();
                  setShowDeleteConfirmModal(false);
                }} 
                className="flex-1 py-3 px-4 bg-black text-white hover:bg-neutral-800 font-black transition-all"
              >
                نعم، احذف المشروع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

export default BusinessDashboard;
