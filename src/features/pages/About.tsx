import React from 'react';
import { Target, Users, Zap, PlusCircle, Compass, UserCog } from 'lucide-react';
import Logo from './Logo';

interface AboutProps {
  onStartProject?: () => void;
}

interface FeatureItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const AUDIENCE_ITEMS: FeatureItem[] = [
  {
    icon: Compass,
    title: "معاك فلوس ومش معاك فكرة؟",
    description: "هنحدد لك الاتجاه الصح. مشروعك بيكون مدروس ومختبر، ومعاه خطة تنفيذ واضحة، من أول اسم المشروع، لحد ما تبدأ تبيع وتحقق أول دخل فعلي.",
  },
  {
    icon: UserCog,
    title: "لا معاك فلوس ولا فكرة؟",
    description: "إحنا بنبدأ معاك من عندك أنت. بناخد بياناتك، نفهم ظروفك، التحديات اللي بتواجهك، ووضعك المادي، وبناءً على ده بنصمملك مشروع مناسب ليك—حتى لو هتبدأ برأس مال صفر.",
  },
];

const MISSION_ITEMS: FeatureItem[] = [
  {
    icon: Target,
    title: "هدفنا",
    description: "إننا نمكّن مليون شخص يبدأ مشروعه وينجح فيه، من خلال نظام واضح، عملي، وقابل للتطبيق.",
  },
  {
    icon: Zap,
    title: "مشروع حقيقي",
    description: "المنصة بتعتمد على تحليل مشاكل حقيقية موجودة في السوق، وبتحوّلها لفرص فعلية قابلة للتنفيذ على أرض الواقع.",
  },
  {
    icon: Users,
    title: "على مقاسك",
    description: "بناءً على وضعك الحالي، وظروفك وتحدياتك وقدراتك المالية، نصمم لك المشروع الذي يناسبك أنت فقط.",
  },
];

const FeatureRow: React.FC<FeatureItem> = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-3 sm:gap-4">
    <div className="mt-1 flex items-center justify-center shrink-0 text-orange-600">
      <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
    </div>
    <div>
      <h3 className="text-base sm:text-lg md:text-xl font-black text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-600 leading-relaxed text-xs sm:text-sm md:text-base">{description}</p>
    </div>
  </div>
);

const About: React.FC<AboutProps> = ({ onStartProject }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 w-full relative pb-20 pt-10">
      {/* Full-Screen Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-orange-50/80 via-transparent to-amber-50/80 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20vh] -right-[10vw] w-[70vw] h-[70vw] min-w-[500px] min-h-[500px] bg-orange-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[20vh] -left-[10vw] w-[70vw] h-[70vw] min-w-[500px] min-h-[500px] bg-amber-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center justify-center">
        <Logo className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4" />
        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight tracking-tight mb-4 text-center">
          عن منصة <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">Business Creator</span>
        </h1>
        
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 font-medium mb-6 max-w-2xl mx-auto leading-relaxed text-center mt-1 px-1">
          منصة متخصصه في بناء المشاريع بتساعدك تبدأ مشروع حقيقي قابل للتنفيذ على أرض الواقع و اونلاين مش مجرد فكرة. نعتمد على تحليل مشاكل حقيقية في السوق لتحويلها إلى فرص ومشاريع متكاملة.
        </p>

        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-gray-900 mb-8 text-center border-b border-gray-200/50 pb-6 w-full">
          دعنا نصنع منك <span className="text-orange-600">رائد اعمال</span>
        </h2>

        <div className="flex flex-col gap-6 sm:gap-8 text-right w-full mb-10 max-w-3xl mx-auto">
          {AUDIENCE_ITEMS.map((item, index) => (
            <FeatureRow key={index} {...item} />
          ))}
        </div>

        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 font-medium mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed text-center px-1">
          مش بنقدم حلول عامة… إحنا بنصمم مشروع <span className="font-bold text-gray-900">"على مقاسك"</span>، لأن أغلب المشاريع الناجحة كانت مبنية على أصحابها، مش نسخة مكررة من حد تاني.
        </p>

        {onStartProject && (
          <div className="flex justify-center w-full mb-12 sm:mb-16">
            <button 
              onClick={onStartProject}
              className="w-full sm:w-auto px-6 py-2.5 sm:px-8 sm:py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-xl font-bold text-sm sm:text-base md:text-lg hover:from-orange-700 hover:to-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:-translate-y-0.5"
            >
              <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" /> ابدأ مشروعك الآن
            </button>
          </div>
        )}

        <div className="flex flex-col gap-6 sm:gap-8 text-right w-full mb-8 sm:mb-12 max-w-3xl mx-auto">
          {MISSION_ITEMS.map((item, index) => (
            <FeatureRow key={index} {...item} />
          ))}
        </div>

      </div>
    </div>
  );
};

export default About;
