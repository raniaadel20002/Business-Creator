import React from 'react';
import { Compass, FileText, Target, ShieldCheck, LineChart, Briefcase } from 'lucide-react';
import { BusinessPlan } from '../../types';
import { FormattedText } from '../FormattedText';
import { AdvisorCTA } from '../AdvisorCTA';

interface BusinessStrategyTabProps {
  plan: BusinessPlan;
  renderTabNavigation: () => React.ReactNode;
  onConsultAdvisor?: () => void;
  isFreeUser?: boolean;
}

const BusinessStrategyTab: React.FC<BusinessStrategyTabProps> = ({
  plan,
  renderTabNavigation,
  onConsultAdvisor,
  isFreeUser,
}) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-900">
      <div className="space-y-8">
        {/* Premium Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Compass size={24} className="text-orange-600 shrink-0" />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-950">الاستراتيجية وخطة العمل (Business Strategy)</h3>
              <p className="text-gray-600 text-xs mt-1">الاتجاه الاستراتيجي الشامل ومقومات التميز لمشروعك</p>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
          <h4 className="flex items-center gap-2.5 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
            <FileText size={20} className="text-orange-600 shrink-0" />
            <span>الملخص التنفيذي للمشروع</span>
          </h4>
          <FormattedText className="text-gray-600 leading-relaxed font-normal text-sm md:text-base">
            {plan.businessStrategy?.executiveSummary || 'جار التحضير...'}
          </FormattedText>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Vision & Mission */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
            <h4 className="flex items-center gap-2.5 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
              <Target size={20} className="text-orange-600 shrink-0" />
              <span>الرؤية والرسالة</span>
            </h4>
            <FormattedText className="text-gray-600 text-sm leading-relaxed font-normal">
              {plan.businessStrategy?.visionAndMission || 'جار التحضير...'}
            </FormattedText>
          </div>

          {/* Core Competencies */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
            <h4 className="flex items-center gap-2.5 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
              <ShieldCheck size={20} className="text-orange-600 shrink-0" />
              <span>الميزة التنافسية والكفاءات الجوهرية</span>
            </h4>
            <FormattedText className="text-gray-600 text-sm leading-relaxed font-normal">
              {plan.businessStrategy?.coreCompetencies || 'جار التحضير...'}
            </FormattedText>
          </div>
        </div>

        {/* Branded Advisor Call-to-action Button */}
        {onConsultAdvisor && (
          <AdvisorCTA 
            icon={Compass}
            question="اسأل المرشد كيف تضع خارطة طريق ومؤشرات أداء لمشروعك؟"
            onConsult={onConsultAdvisor}
            isFreeUser={isFreeUser}
          />
        )}

        {/* Strategic Objectives */}
        <div className="pt-6 border-t border-gray-100 space-y-4">
          <h4 className="font-bold text-gray-950 text-base flex items-center gap-2">
            <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span> الأهداف الاستراتيجية بعيدة المدى
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {plan.businessStrategy?.strategicObjectives?.map((obj, idx) => (
              <div key={idx} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-soft hover:-translate-y-0.5 transition-all duration-300 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">{idx + 1}</span>
                  <span className="text-gray-900 text-xs font-bold">هدف رئيسي رقم {idx + 1}</span>
                </div>
                <div className="text-xs text-gray-600 font-normal leading-relaxed">
                  <FormattedText>{obj}</FormattedText>
                </div>
              </div>
            )) || <p className="text-gray-500">جار التحضير...</p>}
          </div>
        </div>

        {/* KPIs & Expansion */}
        <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
            <h4 className="flex items-center gap-2.5 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
              <LineChart size={20} className="text-orange-600 shrink-0" />
              <span>مؤشرات الأداء الرئيسية ومقاييس النجاح (KPIs)</span>
            </h4>
            <ul className="space-y-2 text-gray-600 text-sm font-normal list-disc list-inside">
              {plan.businessStrategy?.keyPerformanceIndicators?.map((kpi, idx) => (
                <li key={idx} className="leading-relaxed">
                  <FormattedText className="inline-block" children={kpi} />
                </li>
              )) || <p className="text-gray-550">جار التحضير...</p>}
            </ul>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
            <h4 className="flex items-center gap-2.5 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
              <Briefcase size={20} className="text-orange-600 shrink-0" />
              <span>خطة التوسع والنمو المستقبلي</span>
            </h4>
            <FormattedText className="text-gray-600 text-sm leading-relaxed font-normal">
              {plan.businessStrategy?.expansionPlan || 'جار التحضير...'}
            </FormattedText>
          </div>
        </div>

      </div>
      {renderTabNavigation()}
    </div>
  );
};

export default BusinessStrategyTab;
