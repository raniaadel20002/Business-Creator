import React from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';

interface InsufficientTokensCardProps {
  title?: string;
  badgeText?: string;
  message: string;
  description?: string;
  onUpgrade?: () => void;
  className?: string;
  compact?: boolean;
}

export const InsufficientTokensCard: React.FC<InsufficientTokensCardProps> = ({
  title = 'Business Creator',
  badgeText = 'تنبيه رصيد النقاط',
  message,
  description = 'باقة رواد الأعمال (PRO) تمنحك 100,000 نقطة لإطلاق وتنفيذ مشاريعك بالكامل مع استشارات ومميزات غير محدودة.',
  onUpgrade,
  className = '',
  compact = false,
}) => {
  return (
    <div
      dir="rtl"
      className={`w-full bg-gradient-to-br from-orange-50/90 via-white to-amber-50/50 border-2 border-orange-200/90 rounded-3xl p-5 md:p-6 shadow-xl shadow-orange-500/5 text-right space-y-4 animate-in fade-in zoom-in-95 duration-300 ${className}`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-orange-100/90 pb-3.5">
        <div className="w-10 h-10 rounded-2xl bg-white border border-orange-200 flex items-center justify-center p-1.5 shrink-0 shadow-sm relative overflow-visible">
          <img
            src="/logoo.png"
            alt="Business Creator"
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <span className="absolute -bottom-1 -left-1 bg-blue-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[7px] border-2 border-white font-black" title="حساب رسمي موثق">✓</span>
        </div>
        <div>
          <h4 className="font-black text-gray-900 text-sm md:text-base leading-tight">{title}</h4>
          <p className="text-[10px] sm:text-[11px] text-orange-600 font-bold">{badgeText}</p>
        </div>
      </div>

      {/* Message Body */}
      <div className="space-y-1.5">
        <p className="text-gray-900 font-extrabold text-sm md:text-base leading-relaxed">
          {message}
        </p>
        {description && (
          <p className="text-gray-500 text-xs md:text-sm leading-relaxed font-medium">
            {description}
          </p>
        )}
      </div>

      {/* Upgrade Action Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => onUpgrade?.()}
          className="w-full py-3.5 px-5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-2xl font-black text-sm md:text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.01] active:scale-98 cursor-pointer border-none"
        >
          <Sparkles size={18} />
          <span>ترقية الحساب وشحن النقاط الآن</span>
          <ArrowLeft size={18} className="mr-1" />
        </button>
      </div>
    </div>
  );
};

