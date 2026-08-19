import React from 'react';
import { LineChart, PieChart, TrendingUp, Target, ShieldCheck, Briefcase, FileText } from 'lucide-react';
import { BusinessPlan } from '../../types';
import { FormattedText } from '../FormattedText';
import { AdvisorCTA } from '../AdvisorCTA';

interface MarketAnalysisTabProps {
  plan: BusinessPlan;
  renderTabNavigation: () => React.ReactNode;
  onConsultAdvisor?: () => void;
  isFreeUser?: boolean;
}

const MarketAnalysisTab: React.FC<MarketAnalysisTabProps> = ({
  plan,
  renderTabNavigation,
  onConsultAdvisor,
  isFreeUser,
}) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-900">
      <div className="space-y-8">
        {/* Premium Header Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <LineChart size={24} className="text-orange-600 shrink-0" />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-950">تحليل السوق والدراسة القطاعية</h3>
              <p className="text-gray-600 text-xs mt-1">دراسة شاملة لوضع السوق وحجمه واتجاهاته</p>
            </div>
          </div>
        </div>

        {/* Bento-like Grid of Analysis Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
            <h4 className="flex items-center gap-2.5 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
              <PieChart size={20} className="text-orange-600 shrink-0" />
              <span>حجم ونمو السوق المقدر</span>
            </h4>
            <FormattedText className="text-gray-600 text-sm leading-relaxed font-normal">{plan.marketAnalysis?.marketSizeAndGrowth || 'سيتم إعداد التحليل بناءً على معطيات مشروعك.'}</FormattedText>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
            <h4 className="flex items-center gap-2.5 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
              <TrendingUp size={20} className="text-orange-600 shrink-0" />
              <span>اتجاهات السوق (Market Trends)</span>
            </h4>
            <FormattedText className="text-gray-600 text-sm leading-relaxed font-normal">{plan.marketAnalysis?.marketTrends || 'سيتم إعداد التحليل بناءً على معطيات مشروعك.'}</FormattedText>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
            <h4 className="flex items-center gap-2.5 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
              <Target size={20} className="text-orange-600 shrink-0" />
              <span>الفجوات السوقية والفرص المتاحة</span>
            </h4>
            <FormattedText className="text-gray-600 text-sm leading-relaxed font-normal">{plan.marketAnalysis?.marketGaps || 'سيتم إعداد التحليل بناءً على معطيات مشروعك.'}</FormattedText>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
            <h4 className="flex items-center gap-2.5 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
              <ShieldCheck size={20} className="text-orange-600 shrink-0" />
              <span>عوائق دخول السوق والمخاطر</span>
            </h4>
            <FormattedText className="text-gray-600 text-sm leading-relaxed font-normal">{plan.marketAnalysis?.barriersToEntry || 'سيتم إعداد التحليل بناءً على معطيات مشروعك.'}</FormattedText>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
            <h4 className="flex items-center gap-2.5 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
              <Briefcase size={20} className="text-orange-600 shrink-0" />
              <span>تحليل قوى بورتر الخمس المنافسة</span>
            </h4>
            <FormattedText className="text-gray-600 text-sm leading-relaxed font-normal">{plan.marketAnalysis?.porterFiveForces || 'سيتم إعداد التحليل بناءً على معطيات مشروعك.'}</FormattedText>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
            <h4 className="flex items-center gap-2.5 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
              <FileText size={20} className="text-orange-600 shrink-0" />
              <span>البيئة التشريعية والتنظيمية</span>
            </h4>
            <FormattedText className="text-gray-600 text-sm leading-relaxed font-normal">{plan.marketAnalysis?.regulatoryEnvironment || 'سيتم إعداد التحليل بناءً على معطيات مشروعك.'}</FormattedText>
          </div>
        </div>

        {/* Core market problems project solves */}
        <div className="pt-6 border-t border-gray-100 space-y-6">
          <h4 className="font-bold text-gray-950 text-base flex items-center gap-2">
            المشاكل الجوهرية التي يعالجها مشروعك
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {plan.marketAnalysis?.identifiedProblems?.map((prob, idx) => (
              <div key={idx} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-soft hover:-translate-y-0.5 transition-all duration-300 space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs bg-orange-100 text-orange-600 w-7 h-7 flex items-center justify-center rounded-full font-bold shrink-0">{idx + 1}</span>
                  <h5 className="font-bold text-gray-900 text-sm line-clamp-2">{prob.problem}</h5>
                </div>
                <p className="text-gray-600 text-xs font-normal leading-relaxed">{prob.reasoning}</p>
              </div>
            )) || <p className="text-gray-555 text-sm">جاري التحليل...</p>}
          </div>
        </div>

        {/* Branded Advisor Call-to-action Button */}
        {onConsultAdvisor && (
          <AdvisorCTA 
            icon={TrendingUp}
            question="اسأل المستشار كيف تحقق أقصى حصة سوقية لمشروعك؟"
            onConsult={onConsultAdvisor}
            isFreeUser={isFreeUser}
          />
        )}

      </div>
      {renderTabNavigation()}
    </div>
  );
};

export default MarketAnalysisTab;
