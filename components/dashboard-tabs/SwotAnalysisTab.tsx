import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { BusinessPlan } from '../../types';
import { cleanText } from '../FormattedText';
import { AdvisorCTA } from '../AdvisorCTA';

interface SwotAnalysisTabProps {
  plan: BusinessPlan;
  renderTabNavigation: () => React.ReactNode;
  onConsultAdvisor?: () => void;
  isFreeUser?: boolean;
}

const SwotAnalysisTab: React.FC<SwotAnalysisTabProps> = ({
  plan,
  renderTabNavigation,
  onConsultAdvisor,
  isFreeUser,
}) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-900">
      <div className="space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <ShieldCheck size={24} className="text-orange-600 shrink-0" />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-950">تحليل SWOT الرباعي للمشروع</h3>
              <p className="text-gray-655 text-xs mt-1 font-normal">دراسة تحليلية لعوامل القوة والضعف الداخلية، والفرص والتهديدات الخارجية</p>
            </div>
          </div>
        </div>

        {/* 2x2 SWOT Matrix Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-orange-50/25 border border-orange-100/60 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 min-h-[220px] space-y-4">
            <h4 className="font-bold text-orange-950 flex items-center gap-2.5 text-base">
              <span className="text-orange-600 font-bold text-xl shrink-0">S</span>
              نقاط القوة الداعمة (Strengths)
            </h4>
            <ul className="space-y-2.5 text-gray-700 break-words font-normal text-xs leading-relaxed">
              {(plan.swot?.strengths || []).map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                  <span>{cleanText(s)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-gray-50/70 border border-gray-200/60 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 min-h-[220px] space-y-4">
            <h4 className="font-bold text-gray-900 flex items-center gap-2.5 text-base">
              <span className="text-orange-500 font-bold text-xl shrink-0">W</span>
              نقاط الضعف المحتملة (Weaknesses)
            </h4>
            <ul className="space-y-2.5 text-gray-700 break-words font-normal text-xs leading-relaxed">
              {(plan.swot?.weaknesses || []).map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0 mt-1.5" />
                  <span>{cleanText(s)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Opportunities */}
          <div className="bg-amber-50/20 border border-amber-100/50 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 min-h-[220px] space-y-4">
            <h4 className="font-bold text-amber-950 flex items-center gap-2.5 text-base">
              <span className="text-orange-600 font-bold text-xl shrink-0">O</span>
              الفرص المتاحة في السوق (Opportunities)
            </h4>
            <ul className="space-y-2.5 text-gray-700 break-words font-normal text-xs leading-relaxed">
              {(plan.swot?.opportunities || []).map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  <span>{cleanText(s)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Threats */}
          <div className="bg-orange-50/5 border border-orange-100/30 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 min-h-[220px] space-y-4">
            <h4 className="font-bold text-orange-950 flex items-center gap-2.5 text-base">
              <span className="text-orange-600 font-bold text-xl shrink-0">T</span>
              المخاطر والتهديدات الخارجية (Threats)
            </h4>
            <ul className="space-y-2.5 text-gray-700 break-words font-normal text-xs leading-relaxed">
              {(plan.swot?.threats || []).map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-1.5" />
                  <span>{cleanText(s)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Branded Advisor Call-to-action Button */}
        {onConsultAdvisor && (
          <AdvisorCTA 
            icon={ShieldAlert}
            question="اسأل المستشار كيف تحول نقاط ضعفك ومخاطرك إلى مكاسب؟"
            onConsult={onConsultAdvisor}
            isFreeUser={isFreeUser}
          />
        )}
      </div>
      
      {renderTabNavigation()}
    </div>
  );
};

export default SwotAnalysisTab;
