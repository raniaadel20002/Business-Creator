import React from 'react';
import { MessageCircle, Lock } from 'lucide-react';

export interface AdvisorCTAProps {
  question: string;
  onConsult: () => void;
  isFreeUser?: boolean;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
}

export const AdvisorCTA: React.FC<AdvisorCTAProps> = ({
  question,
  onConsult,
  isFreeUser = false,
  icon: Icon = MessageCircle,
  className = '',
}) => {
  return (
    <div className={`border border-orange-200/80 rounded-2xl p-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-900 ${className}`}>
      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800">
        <Icon size={16} className="text-orange-600 shrink-0" />
        <span>{question}</span>
      </div>
      <button 
        onClick={onConsult}
        className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white transition-all duration-200 rounded-xl font-bold text-xs whitespace-nowrap shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
      >
        {isFreeUser ? (
          <>
            <Lock size={13} className="shrink-0" />
            <span>اسأل المستشار (ترقية)</span>
          </>
        ) : (
          <>
            <MessageCircle size={14} />
            <span>اسأل المستشار</span>
          </>
        )}
      </button>
    </div>
  );
};

