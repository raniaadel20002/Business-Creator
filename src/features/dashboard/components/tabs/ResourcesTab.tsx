import React from 'react';
import { ShieldCheck, Zap, ExternalLink, Lightbulb, DollarSign, Wrench, Search, Check, GraduationCap } from 'lucide-react';
import { BusinessPlan, UserProfile, UserData, ChallengeAdviceItem } from '../../../../types/types';
import { FormattedText } from '../../../../components/shared/FormattedText';
import { AdvisorCTA } from '../../../advisor/components/AdvisorCTA';

interface ResourcesTabProps {
  plan: BusinessPlan;
  profile?: UserProfile | null;
  activeUserData: UserData;
  challengesAdvice: ChallengeAdviceItem[];
  renderTabNavigation: () => React.ReactNode;
  onConsultAdvisor?: () => void;
  isFreeUser?: boolean;
}

const ResourcesTab: React.FC<ResourcesTabProps> = ({
  plan,
  profile,
  activeUserData,
  challengesAdvice,
  renderTabNavigation,
  onConsultAdvisor,
  isFreeUser,
}) => {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-900">
      {/* Expected Challenges & Advice */}
      {profile?.userData?.expectedChallenges && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <ShieldCheck size={20} className="text-orange-600 shrink-0" />
            <div>
              <h4 className="text-lg font-bold text-gray-950">مواجهة التحديات المتوقعة</h4>
              <p className="text-gray-500 text-xs font-medium">حلول عملية ونبرة إرشادية لتخطي العقبات المحددة</p>
            </div>
          </div>

          <div className="bg-rose-50/30 border border-rose-100 p-6 rounded-2xl font-normal text-sm">
            <p className="text-xs text-rose-800 mb-1 font-bold">التحديات التي ذكرتها في الاستبيان:</p>
            <p className="text-gray-800 italic font-bold">"{activeUserData.expectedChallenges}"</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {challengesAdvice.map((item, idx) => (
              <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-950 flex items-center gap-2 text-sm md:text-base">
                    <Zap size={18} className="text-orange-600 shrink-0" /> {item.title}
                  </h4>
                  <p className="text-xs text-gray-655 leading-relaxed font-normal">{item.advice}</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                  {item.links.map((link, lIdx) => (
                    <a 
                      key={lIdx} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1 bg-orange-50 px-3 py-1 rounded-lg border border-orange-100/50"
                    >
                      <ExternalLink size={12} /> {link.name}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Branded Advisor Call-to-action Button */}
      {onConsultAdvisor && (
        <AdvisorCTA 
          icon={GraduationCap}
          question="اسأل المرشد كيف تتغلب على أهم التحديات التشغيلية؟"
          onConsult={onConsultAdvisor}
          isFreeUser={isFreeUser}
        />
      )}

      {plan.mentorshipAndGuidance && (
        <div className="space-y-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <Lightbulb size={20} className="text-orange-600 shrink-0" />
            <div>
              <h4 className="text-lg font-bold text-gray-950">الإرشاد والتوجيه لمرحلة الانطلاق</h4>
              <p className="text-gray-500 text-xs font-medium">نصائح مخصصة لتذليل عقبات التأسيس والتمويل</p>
            </div>
          </div>
          
          {plan.mentorshipAndGuidance.fundingAdvice && (
            <div className="bg-gradient-to-br from-white to-amber-50/20 border border-amber-100 rounded-3xl p-6 md:p-8 space-y-3 shadow-soft">
              <h4 className="font-bold text-gray-950 text-base flex items-center gap-2">
                <DollarSign size={18} className="text-amber-600 shrink-0" /> نصيحة الدعم المالي والبدء الأمثل
              </h4>
              <FormattedText className="text-gray-700 leading-relaxed text-xs md:text-sm font-normal">{plan.mentorshipAndGuidance.fundingAdvice}</FormattedText>
            </div>
          )}
        </div>
      )}

      {/* Tools and Resources */}
      <div className="space-y-8 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <Wrench size={20} className="text-orange-600 shrink-0" />
          <div>
            <h4 className="text-lg font-bold text-gray-950">الأدوات والموارد التكنولوجية المقترحة</h4>
            <p className="text-gray-500 text-xs font-medium">الأدوات الرقمية والبرامج الموصى بها لتشغيل أعمالك بأقل تكلفة</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {plan.toolsAndResources?.map((cat, idx) => (
            <div key={idx} className="space-y-4">
              <h4 className="font-bold text-gray-950 text-base flex items-center gap-2 pb-2 border-b border-gray-100">
                {cat.category}
              </h4>
              <div className="space-y-4">
                {(cat.suggestions || []).map((tool, tIdx) => (
                  <div key={tIdx} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="font-bold text-gray-950 text-base block">{tool.name}</span>
                        <div className="flex gap-2">
                          <span className="text-[9px] font-bold text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md">
                            {tool.isFree ? 'مجاني' : 'مدفوع'}
                          </span>
                          {tool.estimatedCost && (
                            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                              {tool.estimatedCost}
                            </span>
                          )}
                        </div>
                      </div>
                      {tool.link && (
                        <a href={tool.link} target="_blank" rel="noopener noreferrer" className="p-2 bg-orange-50 text-orange-600 border border-orange-100 rounded-xl hover:bg-orange-100 transition-all shrink-0">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600 leading-relaxed font-normal">{tool.description}</p>
                    
                    {tool.whereToBuyOrGet && (
                      <div className="pt-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                        <p className="text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1"><Search size={12} className="text-orange-600 shrink-0"/> من أين تحصل عليها؟</p>
                        <p className="text-xs text-gray-700 leading-relaxed font-normal">{tool.whereToBuyOrGet}</p>
                      </div>
                    )}
                    
                    {tool.howToUse && (
                      <div className="pt-2 border-t border-dashed border-gray-100">
                        <p className="text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1"><Check size={12} className="text-orange-600 shrink-0"/> كيف تستخدمها؟</p>
                        <p className="text-xs text-gray-700 leading-relaxed font-normal">{tool.howToUse}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )) || <p className="text-center text-gray-500 py-8">الأدوات والموارد غير متوفرة.</p>}
        </div>
      </div>

      {/* Learning Path */}
      <div className="space-y-8 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <GraduationCap size={20} className="text-orange-600 shrink-0" />
          <div>
            <h4 className="text-lg font-bold text-gray-950">مسار التعلم وتطوير المهارات الموصى به</h4>
            <p className="text-gray-500 text-xs font-medium">مساقات تدريبية ومصادر تعليمية موجهة لتمكينك من قيادة المشروع بنجاح</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {plan.learningPath?.map((item, idx) => (
            <a 
              key={idx} 
              href={item.resourceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col justify-between p-6 bg-white border border-gray-100 rounded-3xl hover:border-orange-200 shadow-soft hover:shadow-soft-lg transition-all group min-h-[180px]"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-3 border-b border-gray-50 pb-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-full uppercase">
                      {item.platform}
                    </span>
                    <h4 className="font-bold text-gray-950 text-base block pt-1">{item.skill}</h4>
                  </div>
                  <div className="p-2 bg-orange-50 text-orange-600 border border-orange-100 rounded-xl group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-600 transition-all shrink-0">
                    <ExternalLink size={14} />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-900 font-bold text-xs">
                    <Check size={14} strokeWidth={2.5} className="text-orange-600" />
                    <span>{item.resourceName}</span>
                  </div>
                  <p className="text-xs text-gray-600 font-normal leading-relaxed">
                    {item.description}
                  </p>
                  {item.importance && (
                    <div className="mt-2 pt-2 border-t border-dashed border-gray-100">
                      <p className="text-[9px] text-gray-400 font-bold uppercase">لماذا هذا مهم؟</p>
                      <p className="text-xs text-gray-700 leading-relaxed font-normal">{item.importance}</p>
                    </div>
                  )}
                </div>
              </div>
            </a>
          )) || <p className="text-center text-gray-500 py-8">مسار التعلم غير متوفر.</p>}
        </div>
      </div>
      
      {renderTabNavigation()}
    </div>
  );
};

export default ResourcesTab;

