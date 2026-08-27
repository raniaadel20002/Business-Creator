import React from 'react';
import { 
  Compass, 
  BarChart3, 
  Map, 
  UserCheck, 
  Users, 
  Calculator, 
  Megaphone, 
  Layers, 
  Brain, 
  Coins,
  MessageCircle,
  Lightbulb,
  Briefcase,
  Sparkles,
  Quote,
  Target,
  Palette,
  TrendingUp
} from 'lucide-react';
import { motion } from 'motion/react';
import { SubscriptionTier } from '../../../types/types';
import { useAuth } from './AuthContext';

interface FeatureItem {
  text: string;
  icon: React.ReactNode;
}

interface PricingCardProps {
  title: string;
  price: string;
  originalPrice?: string;
  discountBadge?: string;
  priceSuffix: string;
  description: string;
  featureHeader?: string;
  features: FeatureItem[];
  buttonText: string;
  isPopular?: boolean;
  tier: SubscriptionTier;
  onSelect: (tier: SubscriptionTier) => void;
  color: string;
  isLoading?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ 
  title, 
  price, 
  originalPrice,
  discountBadge,
  priceSuffix,
  description, 
  featureHeader,
  features, 
  buttonText, 
  isPopular, 
  tier, 
  onSelect,
  isLoading
}) => (
  <motion.div 
    dir="rtl"
    whileHover={{ y: -4 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
    className={`relative p-5 sm:p-8 rounded-2xl border transition-all flex flex-col h-full bg-white ${
      isPopular 
        ? 'border-primary ring-2 ring-primary/20 shadow-xl shadow-primary/10 scale-100 md:scale-102 z-10' 
        : 'border-gray-200 hover:border-gray-300 shadow-sm'
    }`}
  >
    {isPopular && (
      <div className="absolute -top-3 right-4 sm:right-8 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] sm:text-xs font-black px-3.5 py-1 rounded-full shadow-md tracking-wide flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" />
        الخيار الموصى به لرواد الأعمال
      </div>
    )}

    <div className="flex items-center justify-between mb-3 sm:mb-4 pt-1">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h3>
      </div>
      <div className={`flex items-center justify-center p-2 rounded-xl ${isPopular ? 'bg-orange-50 text-primary' : 'bg-gray-50 text-gray-500'}`}>
        {isPopular ? <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" /> : <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />}
      </div>
    </div>

    <p className="text-gray-600 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed text-right min-h-[36px] sm:min-h-[40px] font-normal">{description}</p>
    
    <div className="mb-4 sm:mb-6 border-b border-gray-100 pb-4 sm:pb-6">
      {originalPrice && (
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-gray-400 line-through text-base sm:text-lg font-bold">
            {originalPrice} ج.م
          </span>
          {discountBadge && (
            <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200/80 text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
              <Sparkles className="w-3 h-3 text-red-500" />
              {discountBadge}
            </span>
          )}
        </div>
      )}
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl sm:text-4xl font-black text-gray-900">{price}</span>
        <span className="text-gray-500 font-medium text-xs sm:text-sm">{priceSuffix}</span>
      </div>
    </div>

    {/* Optional Section/Feature Header */}
    {featureHeader && (
      <div className="mb-4 p-3 bg-orange-50/90 border border-orange-200/80 rounded-xl flex items-center gap-2.5 text-orange-950 font-black text-xs sm:text-sm shadow-xs">
        <div className="p-1 bg-orange-500 text-white rounded-lg shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="leading-snug">{featureHeader}</span>
      </div>
    )}

    <div className="space-y-3 sm:space-y-3.5 mb-6 sm:mb-8 flex-1">
      {(features || []).map((feature, idx) => (
        <div key={idx} className="flex items-start gap-2.5 sm:gap-3 group">
          <div className={`mt-0.5 flex items-center justify-center flex-shrink-0 p-1.5 rounded-lg ${
            isPopular ? 'bg-orange-50 text-primary border border-orange-100' : 'bg-gray-100 text-gray-500'
          }`}>
            {feature.icon}
          </div>
          <span className="text-gray-700 text-xs sm:text-sm font-medium text-right leading-relaxed">{feature.text}</span>
        </div>
      ))}
    </div>

    <button
      type="button"
      onClick={() => onSelect(tier)}
      disabled={isLoading}
      className={`w-full py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm md:text-base transition-all duration-200 cursor-pointer ${
        isPopular 
          ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-600 active:scale-98' 
          : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200 active:scale-98'
      } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
    >
      {isLoading ? 'جاري التحميل...' : buttonText}
    </button>
  </motion.div>
);

interface PricingSectionProps {
  onSelectPlan: (tier: SubscriptionTier) => void;
  currentPlan?: SubscriptionTier;
  isLoadingTarget?: SubscriptionTier | null;
  userData?: { fullName?: string, ultimateDream?: string } | null;
}

const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan, currentPlan, isLoadingTarget, userData }) => {
  const { profile } = useAuth();
  
  const activeUserData = userData || profile?.userData;
  const userName = activeUserData?.fullName?.split(' ')[0] || 'شريكنا العزيز';
  const userIdea = activeUserData?.ultimateDream || 'مشروعك المستقبلي';

  const isFemale = activeUserData && ('gender' in activeUserData) && (activeUserData as any).gender 
    ? ((activeUserData as any).gender === 'أنثى' || (activeUserData as any).gender === 'انثى' || (activeUserData as any).gender === 'female') 
    : false;

  const personalMessage = isFemale ? (
    <>نعلم أنكِ لا تبنين مجرد مشروع يا <span className="text-primary font-black underline decoration-orange-300 decoration-2 underline-offset-4">{userName}</span>، بل تسعين لتحقيق حلمكِ بـ <span className="text-primary font-black">{userIdea}</span>. بصفتكِ رائدة أعمال حقيقية، هذا هو الاستثمار الأفضل لضمان نجاحكِ. احصلي على دراسة جدوى دقيقة، استراتيجيات تسويقية قوية، وخطة عمل احترافية متكاملة تضع حلمكِ على أرض الواقع اليوم!</>
  ) : (
    <>نعلم أنك لا تبني مجرد مشروع يا <span className="text-primary font-black underline decoration-orange-300 decoration-2 underline-offset-4">{userName}</span>، بل تسعى لتحقيق حلمك بـ <span className="text-primary font-black">{userIdea}</span>. بصفتك رائد أعمال حقيقي، هذا هو الاستثمار الأفضل لضمان نجاحك. احصل على دراسة جدوى دقيقة، استراتيجيات تسويقية قوية، وخطة عمل احترافية متكاملة تضع حلمك على أرض الواقع اليوم!</>
  );

  const starterFeatures: FeatureItem[] = [
    { text: 'أقسام الخطة: النظرة العامة، الاستراتيجية، والسوق المبدئي', icon: <Compass size={16} /> },
    { text: 'تحليل المخاطر ونقاط القوة والضعف والأرقام والمالية المبدئية', icon: <BarChart3 size={16} /> },
    { text: 'خطة التنفيذ العملية ومسار الأدوات ومصادر التعلم', icon: <Map size={16} /> },
    { text: 'تشخيص القدرات واستخراج محاولة مجانية واحدة يومياً', icon: <UserCheck size={16} /> },
  ];

  const proFeatures: FeatureItem[] = [
    { text: 'تحليل شامل ومتقدم للسوق والفرص والاتجاهات الحديثة وسد الفجوات السوقية', icon: <TrendingUp size={16} /> },
    { text: 'تحديد دقيق لشخصية العميل المستهدف، سلوك الشراء، وأفضل قنوات الوصول', icon: <Users size={16} /> },
    { text: 'تحليل متعمق للمنافسين المباشرين وغير المباشرين مع استراتيجيات التفوق واختراق السوق', icon: <Target size={16} /> },
    { text: 'أرقام حقيقية: دراسة جدوى واضحة للتكاليف، نقطة التعادل، الإيرادات وتوقعات الأرباح', icon: <Calculator size={16} /> },
    { text: 'استراتيجية تسويق كاملة: خطط إعلانية، أفكار صناعة المحتوى، وطرق الوصول لأول 1000 عميل', icon: <Megaphone size={16} /> },
    { text: 'نموذج أعمال يوضح تماماً آلية تدفق الأموال، الأنشطة الرئيسية، وشبكة الشركاء', icon: <Layers size={16} /> },
    { text: 'بناء الهوية التجارية المتكاملة وتصميم شعار احترافي مخصص لمشروعك', icon: <Palette size={16} /> },
    { text: 'خطة تنفيذية تفصيلية بالأيام والأسابيع مع دليل الأدوات الرقمية ومسارات التعلم', icon: <Map size={16} /> },
    { text: 'مرشد استراتيجي مخصص لدعمك لمتابعة تقدمك خطوة بخطوة، مع خطة الاستثمار والتمويل', icon: <Brain size={16} /> },
    { text: 'دفع لمرة واحدة يمنحك 100,000 نقطة رصيد لاستخدام جميع أدوات المنصة وتنفيذ مشاريعك', icon: <Coins size={16} /> },
  ];

  const plans = [
    {
      tier: 'FREE' as SubscriptionTier,
      title: 'خطة البداية',
      price: '٠',
      priceSuffix: 'جنيه مصري / للأبد',
      description: 'لتحليل معطياتك الخاصة واستخراج الخطة المبدئية وتحديد الاتجاه العام للمشروع.',
      features: starterFeatures,
      buttonText: currentPlan === 'FREE' ? 'باقة التشخيص الحالية' : 'احصل على فكرة مشروع مجاناً',
      color: 'gray-500',
    },
    {
      tier: 'PRO' as SubscriptionTier,
      title: 'خطة رواد الأعمال',
      price: '٤٩٩',
      originalPrice: '١,٥٠٠',
      discountBadge: 'خصم 67% لفترة محدودة جداً',
      priceSuffix: 'جنيه مصري / دفع لمرة واحدة',
      description: 'فكرة مشروع مخصصة وقابلة للتنفيذ تناسب إمكانياتك وظروفك بالكامل، مع خطة عمل استراتيجية تقودك خطوة بخطوة حتى تحقيق أول أرباحك وتنمية مشروعك بنجاح.',
      featureHeader: 'فكرة مشروع قابلة للتنفيذ بناءً على ظروفك ورغبتك تشمل الآتي:',
      features: proFeatures,
      isPopular: true,
      buttonText: currentPlan === 'PRO' ? 'تجديد مخزون التنفيذ' : 'احصل على الخطة الكاملة',
      color: 'primary',
    },
  ];

  return (
    <section className="relative py-8 sm:py-12 px-4 w-full min-h-[80vh] overflow-hidden" dir="rtl">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/40 via-transparent to-orange-50/40 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[100px] -translate-y-1/4 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4"></div>
      </div>

      <div className="w-full relative z-10">
        {/* Header Title */}
        <div className="text-center mb-6 sm:mb-10 space-y-1 sm:space-y-3">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">
            استثمر في <span className="text-primary">مستقبلك</span> اليوم
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 max-w-xl mx-auto">
            دعنا نصنع منك رائد أعمال ناجح
          </p>
        </div>

        {/* Personalized Motivation Message (Outside Pricing Cards) */}
        {activeUserData?.fullName && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 sm:mb-10 bg-orange-50/60 backdrop-blur-sm border border-orange-100 p-4 sm:p-6 rounded-2xl relative overflow-hidden"
          >
            <div className="absolute -top-3 -right-3 text-orange-200/30 pointer-events-none">
              <Quote className="w-14 h-14 sm:w-20 sm:h-20" strokeWidth={1} />
            </div>
            <div className="relative flex items-start gap-3 sm:gap-4">
              <p className="text-gray-800 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed text-right font-medium">
                {personalMessage}
              </p>
            </div>
          </motion.div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch pt-2">
          {plans.map((plan) => (
            <PricingCard
              key={plan.tier}
              {...plan}
              onSelect={onSelectPlan}
              isLoading={isLoadingTarget === plan.tier}
            />
          ))}
        </div>

        {/* Support CTA */}
        <div className="mt-8 sm:mt-12 flex flex-col items-center text-center px-2">
          <p className="text-gray-600 font-bold text-xs sm:text-sm mb-2.5 sm:mb-3">هل لديك استفسار بخصوص الخطط المتاحة؟</p>
          <a 
            href="https://wa.me/201034927416" 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-bold transition-all shadow-md shadow-orange-500/20 text-xs sm:text-sm active:scale-95 border border-orange-400/30 group cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors">
              <MessageCircle className="w-4 h-4 text-white fill-white/20" />
            </div>
            <span>تواصل معنا عبر الواتساب</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
