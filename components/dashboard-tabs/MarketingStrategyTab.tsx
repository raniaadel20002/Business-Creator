import React from 'react';
import { 
  Rocket, 
  MessageCircle, 
  ListChecks, 
  CheckSquare, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Heart, 
  Lightbulb, 
  ArrowRightCircle,
  Award
} from 'lucide-react';
import { BusinessPlan } from '../../types';
import { FormattedText, cleanText } from '../FormattedText';
import { AdvisorCTA } from '../AdvisorCTA';

interface MarketingStrategyTabProps {
  plan: BusinessPlan;
  renderTabNavigation: () => React.ReactNode;
  onConsultAdvisor?: () => void;
  isFreeUser?: boolean;
}

export const MarketingStrategyTab: React.FC<MarketingStrategyTabProps> = ({ plan, renderTabNavigation, onConsultAdvisor, isFreeUser }) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-900">
      <div className="space-y-10">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <Rocket size={24} className="text-orange-600 shrink-0" />
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900">وكالة التسويق الخاصة بك</h3>
            <p className="text-gray-500 text-xs font-medium">استراتيجية نمو متكاملة وتسويق عبر القنوات المختلفة</p>
          </div>
        </div>

        {/* Core Message Highlight */}
        <div className="bg-gradient-to-r from-orange-50/40 to-amber-50/20 border border-amber-100 p-6 md:p-8 rounded-3xl text-center space-y-4">
          <h4 className="text-orange-900 font-bold text-base flex items-center justify-center gap-2">
            <span>الرسالة التسويقية والتموضع الاستراتيجي Core Message</span>
          </h4>
          <div className="text-xs font-normal text-gray-900 leading-relaxed max-w-4xl mx-auto">
            <FormattedText className="text-xs">{plan.marketingStrategy?.coreMessage || 'سيتم إعداد الرسالة الأساسية بناءً على مشروعك.'}</FormattedText>
          </div>
        </div>

        {/* Branded Advisor Call-to-action Button */}
        {onConsultAdvisor && (
          <AdvisorCTA 
            question="اسأل المستشار كيف تصمم حملة تسويقية مبتكرة لمشروعك؟"
            onConsult={onConsultAdvisor}
            isFreeUser={isFreeUser}
          />
        )}

        <div className="grid md:grid-cols-2 gap-8 py-2">
          {/* Social Media Strategy */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-soft space-y-4">
            <h4 className="flex items-center gap-2 font-bold text-gray-950 text-base border-b border-gray-100 pb-3">
              <MessageCircle size={20} className="text-orange-600" />
              <span>قنوات التواصل الاجتماعي</span>
            </h4>
            <div className="text-gray-750 text-xs leading-relaxed font-normal">
              <FormattedText className="text-xs">{plan.marketingStrategy?.socialMediaStrategy || 'سيتم إعداد التفاصيل.'}</FormattedText>
            </div>
          </div>

          {/* Content Pillars */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-soft space-y-4">
            <h4 className="flex items-center gap-2 font-bold text-gray-950 text-base border-b border-gray-100 pb-3">
              <ListChecks size={20} className="text-orange-600" />
              <span>أعمدة المحتوى Content Pillars</span>
            </h4>
            <div className="grid gap-3 pt-1">
              {plan.marketingStrategy?.contentPillars?.map((pillar, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-50/50 hover:bg-neutral-50 rounded-xl transition-colors">
                  <CheckSquare size={16} className="text-orange-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-gray-800 leading-relaxed font-normal flex-1">
                    <FormattedText className="text-xs">{pillar}</FormattedText>
                  </div>
                </div>
              )) || <p className="text-gray-550 text-xs">لا توجد أعمدة محتوى.</p>}
            </div>
          </div>
        </div>

        {/* Growth Hacks / Partnerships / Advertising */}
        <div className="grid md:grid-cols-3 gap-6 py-4">
          <div className="bg-orange-50/15 border border-orange-100/40 p-6 rounded-2xl shadow-soft space-y-3">
            <h4 className="flex items-center gap-2 font-bold text-orange-950 text-base border-b border-orange-100/30 pb-2">
              <TrendingUp size={18} className="text-orange-600" />
              <span>النمو السريع Growth Hacks</span>
            </h4>
            <div className="text-gray-700 text-xs leading-relaxed font-normal">
              <FormattedText className="text-xs">{plan.marketingStrategy?.growthHacks || 'جار التحضير'}</FormattedText>
            </div>
          </div>
          
          <div className="bg-orange-50/15 border border-orange-100/40 p-6 rounded-2xl shadow-soft space-y-3">
            <h4 className="flex items-center gap-2 font-bold text-orange-950 text-base border-b border-orange-100/30 pb-2">
              <Users size={18} className="text-orange-600" />
              <span>الشراكات والمؤثرين</span>
            </h4>
            <div className="text-gray-700 text-xs leading-relaxed font-normal">
              <FormattedText className="text-xs">{plan.marketingStrategy?.influencerPartnerships || 'جار التحضير'}</FormattedText>
            </div>
          </div>

          <div className="bg-orange-50/15 border border-orange-100/40 p-6 rounded-2xl shadow-soft space-y-3">
            <h4 className="flex items-center gap-2 font-bold text-orange-950 text-base border-b border-orange-100/30 pb-2">
              <DollarSign size={18} className="text-orange-600" />
              <span>الإعلانات الممولة</span>
            </h4>
            <div className="text-gray-700 text-xs leading-relaxed font-normal">
              <FormattedText className="text-xs">{plan.marketingStrategy?.advertisingPlan || 'جار التحضير'}</FormattedText>
            </div>
          </div>
        </div>

        {/* 1000 Customers & Retention */}
        <div className="grid md:grid-cols-2 gap-8 py-4 border-t border-gray-100">
          {/* Roadmap to 1000 */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-soft space-y-4">
            <h4 className="flex items-center gap-2 font-bold text-gray-950 text-base pb-2 border-b border-gray-100">
              <Award size={20} className="text-orange-600" />
              <span>خارطة طريق أول 1000 عميل</span>
            </h4>
            <div className="text-gray-700 text-xs leading-relaxed font-normal">
              <FormattedText className="text-xs">{plan.marketingStrategy?.first1000Customers || 'جار التحضير'}</FormattedText>
            </div>
          </div>
          
          {/* Retention */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-soft space-y-4">
            <h4 className="flex items-center gap-2 font-bold text-gray-950 text-base pb-2 border-b border-gray-100">
              <Heart size={20} className="text-orange-600" />
              <span>استراتيجية الاحتفاظ بالعملاء</span>
            </h4>
            <div className="text-gray-700 text-xs leading-relaxed font-normal">
              <FormattedText className="text-xs">{plan.marketingStrategy?.retentionStrategy || 'جار التحضير'}</FormattedText>
            </div>
          </div>
        </div>

        {/* Content Ideas */}
        <div className="space-y-6 pt-4 border-t border-gray-100">
          <h4 className="flex items-center gap-2 font-bold text-gray-950 text-base">
            <Lightbulb size={20} className="text-orange-600" />
            <span>أفكار صناعة المحتوى الجاهزة للتنفيذ</span>
          </h4>
          <div className="grid md:grid-cols-2 gap-6 pt-2">
            {plan.marketingStrategy?.contentIdeas?.map((idea, idx) => (
              <div key={idx} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-soft flex items-start gap-3 hover:-translate-y-0.5 transition-all duration-300">
                <ArrowRightCircle size={20} className="text-orange-600 shrink-0 mt-0.5" />
                <div className="text-xs text-gray-700 leading-relaxed font-normal flex-1 pt-0.5">
                  <FormattedText className="text-xs">{idea}</FormattedText>
                </div>
              </div>
            )) || <p className="text-gray-550 text-xs">لا توجد أفكار محتوى.</p>}
          </div>
        </div>
      </div>
      
      {renderTabNavigation()}
    </div>
  );
};
