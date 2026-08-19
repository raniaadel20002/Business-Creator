import React, { useState } from 'react';
import { ListChecks, Zap, Check } from 'lucide-react';
import { BusinessPlan } from '../../types';
import { AdvisorCTA } from '../AdvisorCTA';

interface ExecutionGuideTabProps {
  plan: BusinessPlan;
  renderTabNavigation: () => React.ReactNode;
  onConsultAdvisor?: () => void;
  isFreeUser?: boolean;
}

const ExecutionGuideTab: React.FC<ExecutionGuideTabProps> = ({
  plan,
  renderTabNavigation,
  onConsultAdvisor,
  isFreeUser,
}) => {
  const [executionSubTab, setExecutionSubTab] = useState<'phases' | 'days' | 'weeks'>('phases');
  const [completedDays, setCompletedDays] = useState<number[]>([]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-900">
      <div className="space-y-8">
        {/* Header Banner with Custom Subtab Navigation */}
        <div className="space-y-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <ListChecks size={24} className="text-orange-600 shrink-0" />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-950">خطة التشغيل وخارطة الطريق للتنفيذ</h3>
              <p className="text-gray-600 text-xs mt-1">المراحل والخطوات العملية واليومية المبرمجة لإطلاق مشروعك</p>
            </div>
          </div>
          
          {plan.executionBlueprint && (
            <div className="bg-gray-100/80 p-1 rounded-2xl flex flex-wrap gap-1 shrink-0 w-full md:w-auto max-w-max">
              <button
                onClick={() => setExecutionSubTab('phases')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 ${
                  executionSubTab === 'phases'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                المراحل العامة
              </button>
              <button
                onClick={() => setExecutionSubTab('days')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 ${
                  executionSubTab === 'days'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                الخطة اليومية (30 يوماً)
              </button>
              <button
                onClick={() => setExecutionSubTab('weeks')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 ${
                  executionSubTab === 'weeks'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                الخطة الأسبوعية (4 أسابيع)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Branded Advisor Call-to-action Button */}
      {onConsultAdvisor && (
        <AdvisorCTA 
          icon={Zap}
          question="اسأل المستشار كيف تنفذ مهام خطة الإطلاق بسلاسة وبأقل وقت؟"
          onConsult={onConsultAdvisor}
          isFreeUser={isFreeUser}
        />
      )}

      {executionSubTab === 'phases' && (
        <div className="space-y-12">
          {plan.executionGuide?.map((phase, pIdx) => (
            <div key={pIdx} className="space-y-6">
              <h4 className="text-lg md:text-xl font-bold text-gray-950 flex items-center gap-3 pb-3 border-b border-gray-100">
                <span className="w-8 h-8 bg-orange-100 text-orange-600 flex items-center justify-center rounded-xl font-bold text-sm shrink-0">
                  {pIdx + 1}
                </span>
                <span>{phase.phase}</span>
              </h4>
              <div className="grid md:grid-cols-2 gap-6 pr-4 border-r-2 border-orange-100">
                {(phase.steps || []).map((step, sIdx) => (
                  <div key={sIdx} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300 flex flex-col justify-between h-full space-y-4">
                    <p className="font-semibold text-gray-950 text-sm leading-relaxed">{step.action}</p>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {(step.tools || []).map((tool, tIdx) => (
                          <span key={tIdx} className="text-[9px] font-bold bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded-full uppercase">
                            {tool}
                          </span>
                        ))}
                      </div>
                      <div className="pt-3 border-t border-gray-50">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">النتيجة المتوقعة:</span>
                        <p className="text-xs text-gray-700 font-normal mt-1 leading-relaxed">{step.expectedResult}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )) || <p className="text-center text-gray-500 py-8">دليل التنفيذ غير متوفر.</p>}
        </div>
      )}

      {executionSubTab === 'days' && plan.executionBlueprint?.days && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-soft flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-1 text-center md:text-right">
              <h4 className="font-bold text-gray-950 text-base">لوحة تتبع التشغيل اليومي (30 يوماً)</h4>
              <p className="text-gray-500 text-xs font-normal">قم بإنهاء المهام اليومية خطوة بخطوة للوصول ليوم الإطلاق بنجاح.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-gray-400 uppercase">معدل الإنجاز:</span>
              <div className="w-32 bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 transition-all duration-500 rounded-full"
                  style={{ width: `${(completedDays.length / (plan.executionBlueprint?.days?.length || 30)) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-emerald-600">
                {Math.round((completedDays.length / (plan.executionBlueprint?.days?.length || 30)) * 100)}%
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(plan.executionBlueprint?.days || []).map((item, idx) => {
              const isDone = completedDays.includes(item.day);
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (isDone) {
                      setCompletedDays(completedDays.filter(d => d !== item.day));
                    } else {
                      setCompletedDays([...completedDays, item.day]);
                    }
                  }}
                  className={`cursor-pointer group select-none p-6 rounded-3xl border transition-all duration-300 flex flex-col h-full justify-between shadow-soft hover:shadow-soft-lg ${
                    isDone
                      ? 'bg-emerald-50/20 border-emerald-100 opacity-80'
                      : 'bg-white border-gray-100 hover:border-orange-200'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 justify-between">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        isDone ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-50 text-gray-600 group-hover:bg-orange-50 group-hover:text-orange-600 transition-all'
                      }`}>
                        {item.day}
                      </span>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                        isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 bg-white group-hover:border-orange-300'
                      }`}>
                        {isDone && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    
                    <p className={`font-semibold text-sm text-gray-900 leading-relaxed ${isDone ? 'line-through text-gray-400' : ''}`}>
                      {item.action}
                    </p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-gray-50 mt-4 text-xs font-normal text-gray-600">
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-400 font-bold">النتيجة:</span>
                      <span className="text-gray-900 font-semibold text-left">{item.expectedOutcome}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-400 font-bold">التكلفة:</span>
                      <span className="text-gray-900 font-semibold">{item.costEstimate}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-400 font-bold">القياس:</span>
                      <span className="text-gray-900 font-semibold text-left">{item.measurementMetric}</span>
                    </div>
                    {item.tools && item.tools.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-dashed border-gray-100">
                        {item.tools.map((t, tIdx) => (
                          <span key={tIdx} className="text-[9px] font-bold bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {executionSubTab === 'weeks' && plan.executionBlueprint?.weeks && (
        <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
          <div className="relative border-r-2 border-dashed border-gray-100 pr-8 space-y-8 py-4">
            {(plan.executionBlueprint?.weeks || []).map((item, idx) => (
              <div key={idx} className="relative bg-white p-6 md:p-8 border border-gray-100 rounded-3xl space-y-4 hover:border-orange-100 shadow-soft transition-all duration-300">
                {/* Timeline dot */}
                <div className="absolute right-[-37px] top-9 w-3 h-3 bg-orange-500 rounded-full border-2 border-white ring-4 ring-orange-50" />
                
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 pb-3">
                  <div className="space-y-1">
                    <span className="inline-block px-2.5 py-0.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold">
                      الأسبوع {item.week}
                    </span>
                    <h4 className="text-base font-bold text-gray-950">{item.milestone}</h4>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] text-gray-400 font-bold uppercase">الميزانية التقديرية</span>
                    <span className="text-xs font-semibold text-gray-950 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">{item.estimatedCost}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">المهام التشغيلية للأسبوع:</span>
                  <div className="grid sm:grid-cols-2 gap-3 font-normal">
                    {(item.tasks || []).map((task, tIdx) => (
                      <div key={tIdx} className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/50 text-xs font-normal text-gray-700">
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full shrink-0 mt-1.5" />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-50 flex justify-between items-center text-xs font-normal text-gray-600">
                  <span className="text-gray-400 font-bold uppercase">مؤشر نجاح الأسبوع:</span>
                  <span className="text-emerald-600 bg-emerald-50/50 px-3 py-1 rounded-full border border-emerald-100/50 font-bold">{item.successMetric}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {renderTabNavigation()}
    </div>
  );
};

export default ExecutionGuideTab;
