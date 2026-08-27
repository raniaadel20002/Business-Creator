import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { BusinessPlan } from '../../../../types/types';
import { AdvisorCTA } from '../../../advisor/components/AdvisorCTA';

interface ValidationTabProps {
  plan: BusinessPlan;
  renderTabNavigation: () => React.ReactNode;
  onConsultAdvisor?: () => void;
  isFreeUser?: boolean;
}

const ValidationTab: React.FC<ValidationTabProps> = ({
  plan,
  renderTabNavigation,
  onConsultAdvisor,
  isFreeUser,
}) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-900">
      {/* Main Validation Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <ShieldCheck size={24} className="text-orange-600 shrink-0" />
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-950">التحقق من جدوى الفكرة والتقييم الاستراتيجي</h3>
            <p className="text-gray-600 text-xs mt-1">تقرير التحقق الشامل والدراسة الفنية لمدى ملاءمة فكرة مشروعك وحيويتها الاستثمارية.</p>
          </div>
        </div>
      </div>

      {/* Validation Fields Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-6">
          <h4 className="text-base font-bold text-gray-950 flex items-center gap-2 pb-3 border-b border-gray-50">
            <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span> دراسة الاحتياج والجاذبية
          </h4>
          <div className="space-y-4">
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
              <span className="text-xs text-gray-500 font-bold block mb-1">احتياج السوق والمستهلك:</span>
              <p className="text-xs text-gray-700 leading-relaxed font-normal">{plan.validation?.targetMarketNeed || 'غير متوفر'}</p>
            </div>
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
              <span className="text-xs text-gray-500 font-bold block mb-1">المنافسة والتحليل الأساسي:</span>
              <p className="text-xs text-gray-700 leading-relaxed font-normal">{plan.validation?.competitorAnalysis || 'غير متوفر'}</p>
            </div>
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
              <span className="text-xs text-gray-500 font-bold block mb-1">توقيت إطلاق الفكرة (Why Now؟):</span>
              <p className="text-xs text-gray-700 leading-relaxed font-normal">{plan.validation?.whyNow || 'غير متوفر'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-6">
          <h4 className="text-base font-bold text-gray-950 flex items-center gap-2 pb-3 border-b border-gray-50">
            <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span> مؤشرات النجاح والتنفيذ
          </h4>
          <div className="space-y-4">
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100/50 flex items-center justify-between gap-4">
              <span className="text-xs text-gray-500 font-bold">مستوى قابلية التنفيذ العام:</span>
              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${
                plan.validation?.feasibilityRating === 'High' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : plan.validation?.feasibilityRating === 'Medium' 
                    ? 'bg-amber-50 text-amber-700 border-amber-100' 
                    : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
                {plan.validation?.feasibilityRating === 'High' ? 'مرتفع جداً (HIGH)' : 
                 plan.validation?.feasibilityRating === 'Medium' ? 'متوسط (MEDIUM)' : 'منخفض (LOW)'}
              </span>
            </div>
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
              <span className="text-xs text-gray-500 font-bold block mb-1">تفصيل أسباب التقييم والأدلة:</span>
              <p className="text-xs text-gray-700 leading-relaxed font-normal">{plan.validation?.feasibilityReasoning || 'غير متوفر'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Branded Advisor Call-to-action Button */}
      {onConsultAdvisor && (
        <AdvisorCTA 
          icon={CheckCircle2}
          question="اسأل المرشد كيف تضمن ملاءمة مشروعي للاستثمار والنجاح؟"
          onConsult={onConsultAdvisor}
          isFreeUser={isFreeUser}
        />
      )}

      {/* Rejection/Correction Report Section */}
      {plan.validationResult?.rejectionReport && (
        <div className="pt-6 border-t border-gray-100 space-y-6">
          <h4 className="font-bold text-gray-950 text-base flex items-center gap-2">
            <span className="w-1.5 h-4 bg-rose-500 rounded-full"></span> تقرير تصحيح المسار والبدائل الاستراتيجية
          </h4>
          <div className="bg-rose-50/40 border border-rose-100 p-6 md:p-8 rounded-3xl text-gray-900 space-y-6 shadow-soft">
            {plan.validationResult.rejectionReport.rejectionReasonSummary && (
              <div className="space-y-1">
                <span className="text-xs text-rose-800 font-bold block">ملخص التحديات الكبرى المكتشفة:</span>
                <p className="text-sm text-gray-800 leading-relaxed font-bold">
                  {plan.validationResult.rejectionReport.rejectionReasonSummary}
                </p>
              </div>
            )}
            {plan.validationResult?.rejectionReport?.failureGates && plan.validationResult.rejectionReport.failureGates.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-rose-800 font-bold block">نقاط الاختناق والمخاطرة (Failure Gates):</span>
                <ul className="list-disc pr-5 text-xs text-gray-700 space-y-1 font-normal">
                  {(plan.validationResult.rejectionReport.failureGates || []).map((gate, i) => (
                    <li key={i}>{gate}</li>
                  ))}
                </ul>
              </div>
            )}
            {plan.validationResult?.rejectionReport?.correctionPlan && plan.validationResult.rejectionReport.correctionPlan.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-rose-800 font-bold block">خطة المعالجة وتعديل المسار المقترحة:</span>
                <ul className="list-decimal pr-5 text-xs text-gray-700 space-y-1 font-normal">
                  {(plan.validationResult.rejectionReport.correctionPlan || []).map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {renderTabNavigation()}
    </div>
  );
};

export default ValidationTab;

