import React from 'react';
import { Target, Check, AlertTriangle, ExternalLink, Award } from 'lucide-react';
import { BusinessPlan } from '../../../../types/types';
import { FormattedText, cleanText } from '../../../../../components/shared/FormattedText';
import { AdvisorCTA } from '../../../advisor/components/AdvisorCTA';

interface CompetitorsAnalysisTabProps {
  plan: BusinessPlan;
  renderTabNavigation: () => React.ReactNode;
  onConsultAdvisor?: () => void;
  isFreeUser?: boolean;
}

export const CompetitorsAnalysisTab: React.FC<CompetitorsAnalysisTabProps> = ({ plan, renderTabNavigation, onConsultAdvisor, isFreeUser }) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-900">
      {plan.validation?.competitorsDetailed && plan.validation.competitorsDetailed.length > 0 ? (
        <div className="space-y-8">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Target size={24} className="text-orange-600 shrink-0" />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">دراسة المنافسين التفصيلية</h3>
              <p className="text-xs text-gray-505 font-medium">رصد نقاط القوة والضعف ومحركات التفوق والسيطرة بالسوق</p>
            </div>
          </div>
          
          <div className="space-y-8">
            {plan.validation.competitorsDetailed.map((comp: any, idx: number) => (
              <div key={idx} className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-6">
                <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between pb-4 border-b border-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="font-bold text-2xl text-gray-950 break-words">{cleanText(comp.name)}</h4>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-55/15 text-orange-600 border border-orange-200/50 font-bold">
                        منافس {cleanText(comp.type)}
                      </span>
                    </div>
                    {comp.url && (
                      <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-orange-700 font-bold text-xs flex items-center gap-1 mt-1 transition-colors" title={comp.url}>
                        <ExternalLink size={12} /> زيارة الموقع الإلكتروني للمنافس
                      </a>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-600 font-normal leading-relaxed max-w-xl md:text-left">
                    <FormattedText className="text-xs">{comp.description}</FormattedText>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3 bg-orange-50/15 border border-orange-100/50 p-5 rounded-2xl">
                    <h5 className="font-bold text-orange-950 text-base flex items-center gap-1.5 pb-2 border-b border-orange-100/40">
                      <Check size={16} className="text-orange-600 shrink-0" />
                      <span>نقاط القوة والمزايا الحالية</span>
                    </h5>
                    <ul className="text-xs text-gray-700 list-none space-y-2.5 font-normal break-words">
                      {(comp.strengths || []).map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
                          <span>{cleanText(s)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3 bg-gray-50/70 border border-gray-200/50 p-5 rounded-2xl">
                    <h5 className="font-bold text-gray-900 text-base flex items-center gap-1.5 pb-2 border-b border-gray-200/40">
                      <AlertTriangle size={16} className="text-orange-600 shrink-0" />
                      <span>نقاط الضعف والفجوات التشغيلية</span>
                    </h5>
                    <ul className="text-xs text-gray-700 list-none space-y-2.5 font-normal break-words">
                      {(comp.weaknesses || []).map((w: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                          <span>{cleanText(w)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="md:col-span-2 bg-gradient-to-r from-orange-50 to-amber-50/30 border border-amber-100 p-6 rounded-2xl space-y-2.5">
                    <h5 className="font-bold text-amber-900 text-base flex items-center gap-2">
                      <Award size={18} className="text-orange-600" />
                      <span>كيف تتفوق استراتيجياً عليهم وتكتسب حصة سوقية؟</span>
                    </h5>
                    <div className="text-xs text-gray-800 break-words leading-relaxed font-normal">
                      <FormattedText className="text-xs">{comp.howToCompete}</FormattedText>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center bg-white border border-gray-100 rounded-3xl p-8 shadow-soft">
          <Target size={48} className="mx-auto text-orange-600 mb-4 animate-pulse" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد دراسة مفصلة للمنافسين</h3>
          <p className="text-gray-500 font-medium text-sm">تم إنشاء هذه الخطة قبل إضافة ميزة دراسة المنافسين المفصلة.</p>
        </div>
      )}

      {/* Branded Advisor Call-to-action Button */}
      {onConsultAdvisor && (
        <AdvisorCTA 
          question="اسأل المرشد كيف تتفوق وتستحوذ على منافسيك في السوق؟"
          onConsult={onConsultAdvisor}
          isFreeUser={isFreeUser}
        />
      )}

      {renderTabNavigation()}
    </div>
  );
};

