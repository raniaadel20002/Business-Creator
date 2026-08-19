import React from 'react';
import { Briefcase, Users, CheckSquare, Gift, Heart, Database, Truck, Tags, Coins } from 'lucide-react';
import { BusinessPlan } from '../../types';
import { cleanText } from '../FormattedText';
import { AdvisorCTA } from '../AdvisorCTA';

interface BusinessModelCanvasTabProps {
  plan: BusinessPlan;
  renderTabNavigation: () => React.ReactNode;
  onConsultAdvisor?: () => void;
  isFreeUser?: boolean;
}

export const BusinessModelCanvasTab: React.FC<BusinessModelCanvasTabProps> = ({ plan, renderTabNavigation, onConsultAdvisor, isFreeUser }) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-900">
      {plan.businessModelCanvas ? (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Briefcase size={24} className="text-orange-600 shrink-0" />
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">نموذج العمل التجاري Business Model Canvas</h3>
                <p className="text-xs text-gray-505 font-medium">الهيكل العام والتفصيلي لكيفية تشغيل ورباحية مشروعك الريادي</p>
              </div>
            </div>
          </div>

          {/* Branded Advisor Call-to-action Button */}
          {onConsultAdvisor && (
            <AdvisorCTA 
              icon={Briefcase}
              question="اسأل المستشار كيف تنمي مصادر الدخل وتخفض التكاليف؟"
              onConsult={onConsultAdvisor}
              isFreeUser={isFreeUser}
            />
          )}
          
          {/* Visual Canvas Layout Wrapper */}
          <div className="w-full overflow-x-auto pb-4 custom-scrollbar print:overflow-visible touch-pan-x touch-pan-y">
            <div 
              id="business-model-canvas-content"
              className="min-w-[1000px] h-[680px] bg-neutral-50/50 border border-gray-100 rounded-3xl p-4 grid grid-cols-10 grid-rows-3 gap-3 overflow-hidden print:bg-white print:text-black"
            >
              {/* Key Partners (2/10 width, 2/3 height) */}
              <div className="col-span-2 row-span-2 bg-white border border-gray-100 rounded-2xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar shadow-sm hover:shadow-soft transition-all duration-300">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                  <Users size={16} className="text-orange-600 shrink-0" />
                  <h4 className="font-bold text-gray-950 text-base">الشركاء الرئيسيون</h4>
                </div>
                <ul className="text-xs text-gray-700 list-disc pr-4 space-y-2 leading-relaxed font-normal">
                  {(plan.businessModelCanvas?.keyPartners || []).map((item, i) => <li key={i}>{cleanText(item)}</li>)}
                </ul>
              </div>

              {/* Key Activities (2/10 width, 1/3 height) */}
              <div className="col-span-2 row-span-1 bg-white border border-gray-100 rounded-2xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar shadow-sm hover:shadow-soft transition-all duration-300">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                  <CheckSquare size={16} className="text-orange-600 shrink-0" />
                  <h4 className="font-bold text-gray-950 text-base">الأنشطة الرئيسية</h4>
                </div>
                <ul className="text-xs text-gray-700 list-disc pr-4 space-y-2 leading-relaxed font-normal">
                  {(plan.businessModelCanvas?.keyActivities || []).map((item, i) => <li key={i}>{cleanText(item)}</li>)}
                </ul>
              </div>

              {/* Value Propositions (2/10 width, 2/3 height) */}
              <div className="col-span-2 row-span-2 bg-white border border-gray-100 rounded-2xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar shadow-sm hover:shadow-soft transition-all duration-300">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                  <Gift size={16} className="text-orange-600 shrink-0" />
                  <h4 className="font-bold text-gray-950 text-base">القيم المقدمة</h4>
                </div>
                <ul className="text-xs text-gray-700 list-disc pr-4 space-y-2 leading-relaxed font-normal">
                  {(plan.businessModelCanvas?.valuePropositions || []).map((item, i) => <li key={i}>{cleanText(item)}</li>)}
                </ul>
              </div>

              {/* Customer Relationships (2/10 width, 1/3 height) */}
              <div className="col-span-2 row-span-1 bg-white border border-gray-100 rounded-2xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar shadow-sm hover:shadow-soft transition-all duration-300">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                  <Heart size={16} className="text-orange-600 shrink-0" />
                  <h4 className="font-bold text-gray-950 text-base">علاقات العملاء</h4>
                </div>
                <ul className="text-xs text-gray-700 list-disc pr-4 space-y-2 leading-relaxed font-normal">
                  {(plan.businessModelCanvas?.customerRelationships || []).map((item, i) => <li key={i}>{cleanText(item)}</li>)}
                </ul>
              </div>

              {/* Customer Segments (2/10 width, 2/3 height) */}
              <div className="col-span-2 row-span-2 bg-white border border-gray-100 rounded-2xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar shadow-sm hover:shadow-soft transition-all duration-300" dir="rtl">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                  <Users size={16} className="text-orange-600 shrink-0" />
                  <h4 className="font-bold text-gray-950 text-base">شرائح العملاء</h4>
                </div>
                <ul className="text-xs text-gray-700 list-disc pr-4 space-y-2 leading-relaxed font-normal">
                  {(plan.businessModelCanvas?.customerSegments || []).map((item, i) => <li key={i}>{cleanText(item)}</li>)}
                </ul>
              </div>

              {/* Key Resources (2/10 width, 1/3 height) */}
              <div className="col-span-2 row-span-1 bg-white border border-gray-100 rounded-2xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar shadow-sm hover:shadow-soft transition-all duration-300">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                  <Database size={16} className="text-orange-600 shrink-0" />
                  <h4 className="font-bold text-gray-950 text-base">الموارد الرئيسية</h4>
                </div>
                <ul className="text-xs text-gray-700 list-disc pr-4 space-y-2 leading-relaxed font-normal">
                  {(plan.businessModelCanvas?.keyResources || []).map((item, i) => <li key={i}>{cleanText(item)}</li>)}
                </ul>
              </div>

              {/* Channels (2/10 width, 1/3 height) */}
              <div className="col-span-2 row-span-1 bg-white border border-gray-100 rounded-2xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar shadow-sm hover:shadow-soft transition-all duration-300">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                  <Truck size={16} className="text-orange-600 shrink-0" />
                  <h4 className="font-bold text-gray-950 text-base">القنوات القابلة للتشغيل</h4>
                </div>
                <ul className="text-xs text-gray-700 list-disc pr-4 space-y-2 leading-relaxed font-normal">
                  {(plan.businessModelCanvas?.channels || []).map((item, i) => <li key={i}>{cleanText(item)}</li>)}
                </ul>
              </div>

              {/* Cost Structure (5/10 width, 1/3 height) */}
              <div className="col-span-5 row-span-1 bg-white border border-gray-100 rounded-2xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar shadow-sm hover:shadow-soft transition-all duration-300">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                  <Tags size={16} className="text-orange-600 shrink-0" />
                  <h4 className="font-bold text-gray-950 text-base">هيكل التكاليف التقديرية</h4>
                </div>
                <ul className="text-xs text-gray-700 list-disc pr-4 space-y-2 leading-relaxed block md:columns-2 font-normal">
                  {(plan.businessModelCanvas?.costStructure || []).map((item, i) => <li key={i} className="mb-1">{cleanText(item)}</li>)}
                </ul>
              </div>

              {/* Revenue Streams (5/10 width, 1/3 height) */}
              <div className="col-span-5 row-span-1 bg-white border border-gray-100 rounded-2xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar shadow-sm hover:shadow-soft transition-all duration-300">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                  <Coins size={16} className="text-orange-600 shrink-0" />
                  <h4 className="font-bold text-gray-950 text-base">مصادر الإيرادات والنمو</h4>
                </div>
                <ul className="text-xs text-gray-700 list-disc pr-4 space-y-2 leading-relaxed block md:columns-2 font-normal">
                  {(plan.businessModelCanvas?.revenueStreams || []).map((item, i) => <li key={i} className="mb-1">{cleanText(item)}</li>)}
                </ul>
              </div>

            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center bg-white border border-gray-100 rounded-3xl p-8 shadow-soft">
          <Briefcase size={48} className="mx-auto text-orange-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">لا يوجد نموذج عمل تجاري</h3>
          <p className="text-gray-500 font-medium text-sm">الخطة الحالية لا تحتوي على نموذج العمل التجاري، يرجى إنشاء خطة جديدة.</p>
        </div>
      )}
      {renderTabNavigation()}
    </div>
  );
};
