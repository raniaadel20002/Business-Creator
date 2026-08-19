import React from 'react';
import { DollarSign, Target, TrendingUp, Coins, Briefcase, Tags, LineChart } from 'lucide-react';
import { BusinessPlan } from '../../types';
import { FormattedText } from '../FormattedText';
import { AdvisorCTA } from '../AdvisorCTA';

interface FinancialsTabProps {
  plan: BusinessPlan;
  renderTabNavigation: () => React.ReactNode;
  onConsultAdvisor?: () => void;
  isFreeUser?: boolean;
}

const FinancialsTab: React.FC<FinancialsTabProps> = ({
  plan,
  renderTabNavigation,
  onConsultAdvisor,
  isFreeUser,
}) => {
  const feasibility = plan?.feasibility || {
    estimatedCost: 'غير محدد',
    costBreakdown: [],
    launchTimeline: 'غير محدد',
    timeToProfit: 'غير محدد',
    expectedRevenue: 'غير محدد',
    revenueModel: 'سيتم تحديد نموذج الإيرادات لاحقاً',
    pricingStrategy: 'سيتم تحديد استراتيجية التسعير لاحقاً',
    breakEvenPoint: 'غير محدد',
    financialProjection3Months: 'غير محدد',
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-900">
      <div className="space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <DollarSign size={24} className="text-orange-600 shrink-0" />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-950">الأرقام والجدوى المالية للمشروع</h3>
              <p className="text-gray-600 text-xs mt-1">توقعات التكاليف ومصادر الإيرادات وخطة بلوغ الربحية</p>
            </div>
          </div>
        </div>

        {/* Top Financial Indicators */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-gray-100">
          <div className="p-4 flex flex-col justify-start items-center text-center">
            <span className="block text-gray-950 text-xs font-bold pb-2 border-b border-gray-100 flex items-center gap-1.5 justify-center w-full mb-3">
              <DollarSign size={16} className="text-orange-600 shrink-0" /> ميزانية البداية المطلوبة
            </span>
            <span className="text-base font-bold text-orange-600 break-words mt-1 leading-relaxed">{feasibility.estimatedCost || 'غير محدد'}</span>
          </div>
          <div className="p-4 flex flex-col justify-start items-center text-center">
            <span className="block text-gray-950 text-xs font-bold pb-2 border-b border-gray-100 flex items-center gap-1.5 justify-center w-full mb-3">
              <Target size={16} className="text-orange-600 shrink-0" /> نقطة التعادل (شهرياً)
            </span>
            <span className="text-xs md:text-sm font-bold text-gray-700 break-words whitespace-pre-wrap mt-1 leading-relaxed">{feasibility.breakEvenPoint || 'غير محدد'}</span>
          </div>
          <div className="p-4 flex flex-col justify-start items-center text-center">
            <span className="block text-gray-950 text-xs font-bold pb-2 border-b border-gray-100 flex items-center gap-1.5 justify-center w-full mb-3">
              <TrendingUp size={16} className="text-orange-600 shrink-0" /> فترة استرداد رأس المال
            </span>
            <span className="text-xs md:text-sm font-bold text-gray-700 break-words whitespace-pre-wrap mt-1 leading-relaxed">{feasibility.timeToProfit || 'غير محدد'}</span>
          </div>
        </div>

        {/* Branded Advisor Call-to-action Button */}
        {onConsultAdvisor && (
          <AdvisorCTA 
            icon={Coins}
            question="اسأل المستشار كيف تدير رأس المال وتحقق أرباحاً سريعة؟"
            onConsult={onConsultAdvisor}
            isFreeUser={isFreeUser}
          />
        )}

        <div className="grid md:grid-cols-2 gap-6 pt-4">
          {/* Cost Details */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-6">
            <h4 className="font-black text-gray-950 text-base flex items-center gap-2 pb-3 border-b border-gray-50">
              <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span> تفاصيل وبنود التكاليف التأسيسية
            </h4>
            <div className="space-y-3">
              {feasibility.costBreakdown && feasibility.costBreakdown.length > 0 ? (
                feasibility.costBreakdown.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50 gap-4 last:border-0">
                    <div className="text-gray-700 font-semibold text-xs leading-relaxed flex-1">
                      <FormattedText>{item?.item || ''}</FormattedText>
                    </div>
                    <span className="font-black text-orange-600 text-xs bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100/50 shrink-0">{item?.cost || ''}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">تفاصيل التكاليف غير متوفرة.</p>
              )}
            </div>
          </div>

          {/* Revenue Model & Projections */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-6">
            <h4 className="font-bold text-gray-950 text-base flex items-center gap-2 pb-3 border-b border-gray-50">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span> نموذج الإيرادات والتوقعات
            </h4>
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase size={14} className="text-orange-600" /> نموذج الربح ومصادر الإيرادات:
                </p>
                <FormattedText className="text-xs text-gray-700 leading-relaxed font-normal">{feasibility.revenueModel || 'غير محدد'}</FormattedText>
              </div>
              <div className="space-y-2 border-t border-gray-50 pt-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tags size={14} className="text-orange-600" /> استراتيجية التسعير المتبعة:
                </p>
                <FormattedText className="text-xs text-gray-700 leading-relaxed font-normal">{feasibility.pricingStrategy || 'غير محدد'}</FormattedText>
              </div>
              <div className="space-y-2 border-t border-gray-50 pt-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <LineChart size={14} className="text-orange-600" /> التوقعات المالية (أول 3 أشهر):
                </p>
                <FormattedText className="text-xs text-gray-700 leading-relaxed font-normal">{feasibility.financialProjection3Months || 'غير محدد'}</FormattedText>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {renderTabNavigation()}
    </div>
  );
};

export default FinancialsTab;
