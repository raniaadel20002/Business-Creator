import React from 'react';
import { Landmark, FileText, LineChart, Users, MapPin, Phone, Globe } from 'lucide-react';
import { BusinessPlan } from '../../../../types/types';
import { FormattedText } from '../../../../../components/shared/FormattedText';
import { AdvisorCTA } from '../../../advisor/components/AdvisorCTA';

interface InvestmentTabProps {
  plan: BusinessPlan;
  renderTabNavigation: () => React.ReactNode;
  onConsultAdvisor?: () => void;
  isFreeUser?: boolean;
}

const InvestmentTab: React.FC<InvestmentTabProps> = ({
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
            <Landmark size={24} className="text-orange-600 shrink-0" />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-950">الاستثمار والاحتضان والدعم</h3>
              <p className="text-gray-600 text-xs mt-1">تجهيز البيزنس للمستثمرين وقائمة بالجهات الداعمة وحاضنات الأعمال</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Investment Readiness */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
            <h4 className="flex items-center gap-2 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
              <FileText size={20} className="text-orange-600 shrink-0" /> الاستعداد للاستثمار (Readiness)
            </h4>
            <FormattedText className="text-gray-700 text-xs leading-relaxed font-normal">
              {plan.investmentAndIncubation?.investmentReadiness || 'جار التحضير...'}
            </FormattedText>
          </div>

          {/* Pitch Deck Tips */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-4">
            <h4 className="flex items-center gap-2 font-bold text-gray-950 text-base pb-3 border-b border-gray-50">
              <LineChart size={20} className="text-orange-600 shrink-0" /> نصائح العرض التقديمي (Pitch Deck)
            </h4>
            <FormattedText className="text-gray-700 text-xs leading-relaxed font-normal">
              {plan.investmentAndIncubation?.pitchDeckTips || 'جار التحضير...'}
            </FormattedText>
          </div>
        </div>

        {/* How to Communicate */}
        <div className="bg-gradient-to-r from-orange-50/40 to-amber-50/20 border border-amber-100/50 rounded-3xl p-6 md:p-8 shadow-soft space-y-4">
          <h4 className="flex items-center gap-2 font-bold text-gray-950 text-base pb-3 border-b border-amber-100/40">
            <Users size={20} className="text-orange-600 shrink-0" /> كيف تتواصل وتتفاوض معهم
          </h4>
          <FormattedText className="text-gray-700 text-xs leading-relaxed font-normal">
            {plan.investmentAndIncubation?.howToCommunicate || 'جار التحضير...'}
          </FormattedText>
        </div>

        {/* Branded Advisor Call-to-action Button */}
        {onConsultAdvisor && (
          <AdvisorCTA 
            icon={Landmark}
            question="اسأل المرشد كيف تعرض مشروعك وتجذب المستثمرين؟"
            onConsult={onConsultAdvisor}
            isFreeUser={isFreeUser}
          />
        )}

        {/* Incubators List */}
        {plan.investmentAndIncubation?.recommendedIncubators && plan.investmentAndIncubation?.recommendedIncubators.length > 0 && (
          <div className="space-y-6 pt-4">
            <h4 className="font-bold text-gray-950 text-base flex items-center gap-2 mb-6">
              <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span> جهات الاحتضان والدعم المقترحة لمشروعك
            </h4>
            <div className="grid md:grid-cols-2 gap-6">
              {(plan.investmentAndIncubation?.recommendedIncubators || []).map((incubator, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 flex flex-col justify-between h-full space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 border-b border-gray-50 pb-3">
                      <h5 className="font-bold text-sm text-gray-950">{incubator.name}</h5>
                      <span className="text-[9px] font-bold bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full border border-orange-100/50 uppercase">
                        {incubator.type}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-700 font-normal leading-relaxed">
                      <FormattedText>{incubator.description}</FormattedText>
                    </div>
                    
                    <div className="space-y-2 border-t border-dashed border-gray-100 pt-4">
                      <h6 className="font-bold text-xs text-gray-950">شروط القبول الأساسية:</h6>
                      <FormattedText className="text-xs text-gray-500 leading-relaxed font-normal">{incubator.requirements}</FormattedText>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-normal text-gray-600">
                    {incubator.location && (
                      <div className="col-span-2 flex items-center gap-2 text-gray-550">
                        <MapPin size={14} className="text-orange-600 shrink-0" />
                        <span className="truncate">{incubator.location}</span>
                      </div>
                    )}
                    {incubator.phone && (
                      <a href={`tel:${incubator.phone}`} className="flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors" target="_blank" rel="noopener noreferrer">
                        <Phone size={14} className="shrink-0" />
                        <span className="truncate" dir="ltr">{incubator.phone}</span>
                      </a>
                    )}
                    {incubator.website && (
                      <a href={incubator.website} className="flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors" target="_blank" rel="noopener noreferrer">
                        <Globe size={14} className="shrink-0" />
                        <span>زيارة الموقع الإلكتروني</span>
                      </a>
                    )}
                    {incubator.googleMapsLink && (
                      <a href={incubator.googleMapsLink} className="col-span-2 flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors mt-1 font-black" target="_blank" rel="noopener noreferrer">
                        <MapPin size={14} className="shrink-0" />
                        <span>عرض على خرائط جوجل ↗</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      
      {renderTabNavigation()}
    </div>
  );
};

export default InvestmentTab;

