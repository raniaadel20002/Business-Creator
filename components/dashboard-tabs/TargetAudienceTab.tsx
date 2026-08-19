import React from 'react';
import { Target, Users, Database, Heart, CheckSquare, Coins, Truck } from 'lucide-react';
import { BusinessPlan } from '../../types';
import { FormattedText } from '../FormattedText';
import { AdvisorCTA } from '../AdvisorCTA';

interface TargetAudienceTabProps {
  plan: BusinessPlan;
  renderTabNavigation: () => React.ReactNode;
  onConsultAdvisor?: () => void;
  isFreeUser?: boolean;
}

const TargetAudienceTab: React.FC<TargetAudienceTabProps> = ({
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
            <Target size={24} className="text-orange-600 shrink-0" />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-950">دراسة وتحليل الجمهور المستهدف</h3>
              <p className="text-gray-600 text-xs mt-1">دراسة شاملة لوضع العملاء وبناء الفئات التسويقية المخصصة</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
              <h4 className="flex items-center gap-2.5 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
                <Users size={20} className="text-orange-600 shrink-0" />
                <span>ملف العميل المثالي (ICP)</span>
              </h4>
              <FormattedText className="text-gray-600 text-sm leading-relaxed font-normal">{plan.targetAudience?.idealCustomerProfile || 'سيتم إعداد التحليل بناءً على معطيات مشروعك.'}</FormattedText>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
              <h4 className="flex items-center gap-2.5 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
                <Database size={20} className="text-orange-600 shrink-0" />
                <span>التركيبة السكانية والتموضع الجغرافي</span>
              </h4>
              <FormattedText className="text-gray-600 text-sm leading-relaxed font-normal">{plan.targetAudience?.demographicsAndGeography || 'سيتم إعداد التحليل بناءً على معطيات مشروعك.'}</FormattedText>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
              <h4 className="flex items-center gap-2.5 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
                <Heart size={20} className="text-orange-600 shrink-0" />
                <span>الاهتمامات وأنماط السلوك</span>
              </h4>
              <FormattedText className="text-gray-600 text-sm leading-relaxed font-normal">{plan.targetAudience?.interestsAndBehavior || 'سيتم إعداد التحليل بناءً على معطيات مشروعك.'}</FormattedText>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
              <h4 className="flex items-center gap-2.5 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
                <CheckSquare size={20} className="text-orange-600 shrink-0" />
                <span>التواجد الرقمي ومنصات التواصل الاجتماعي</span>
              </h4>
              <FormattedText className="text-gray-600 text-sm leading-relaxed font-normal">{plan.targetAudience?.socialMediaPresence || 'سيتم إعداد التحليل بناءً على معطيات مشروعك.'}</FormattedText>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
              <h4 className="flex items-center gap-2.5 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
                <Target size={20} className="text-orange-600 shrink-0" />
                <span>الشريحة التسويقية الرئيسية للتركيز (Primary Segment)</span>
              </h4>
              <FormattedText className="text-gray-600 text-sm leading-relaxed font-normal">{plan.targetAudience?.primarySegment || 'سيتم إعداد التحليل بناءً على معطيات مشروعك.'}</FormattedText>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
              <h4 className="flex items-center gap-2.5 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
                <Coins size={20} className="text-orange-600 shrink-0" />
                <span>السيكولوجية وعقلية الشراء واتخاذ القرار</span>
              </h4>
              <FormattedText className="text-gray-600 text-sm leading-relaxed font-normal">{plan.targetAudience?.behaviorAndMindset || 'سيتم إعداد التحليل بناءً على معطيات مشروعك.'}</FormattedText>
            </div>
          </div>
        </div>

        {/* Branded Advisor Call-to-action Button */}
        {onConsultAdvisor && (
          <AdvisorCTA 
            icon={Target}
            question="اسأل المستشار كيف تجعل جمهورك المستهدف يعشق علامتك؟"
            onConsult={onConsultAdvisor}
            isFreeUser={isFreeUser}
          />
        )}

        {/* Full Width Channel Card */}
        <div className="pt-6 border-t border-gray-100">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
            <h4 className="flex items-center gap-2.5 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
              <Truck size={20} className="text-orange-600 shrink-0" />
              <span>قنوات الاستحواذ الرئيسية (كيفية الوصول وجذب المستهدفين)</span>
            </h4>
            <FormattedText className="text-gray-600 text-sm leading-relaxed font-normal">{plan.targetAudience?.acquisitionChannels || 'سيتم إعداد التحليل بناءً على معطيات مشروعك.'}</FormattedText>
          </div>
        </div>
      </div>
      {renderTabNavigation()}
    </div>
  );
};

export default TargetAudienceTab;
