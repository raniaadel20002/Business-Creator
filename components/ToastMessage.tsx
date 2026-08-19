import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

interface ToastMessageProps {
  message: string | null;
  onClose: () => void;
  type?: 'success' | 'error';
}

const ToastMessage: React.FC<ToastMessageProps> = ({ message, onClose, type = 'success' }) => {
  const isQuotaError = message?.includes("Quota exceeded") || 
                       message?.includes("Quota limit exceeded") || 
                       message?.includes("quota") || 
                       message?.includes("Quota");

  useEffect(() => {
    if (message && !isQuotaError) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // auto close after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [message, onClose, isQuotaError]);

  const Icon = type === 'success' ? CheckCircle2 : XCircle;
  const bgColor = type === 'success' ? 'bg-white' : 'bg-red-50';
  const borderColor = type === 'success' ? 'border-primary/20 border-r-primary' : 'border-red-200 border-r-red-500';
  const iconColor = type === 'success' ? 'text-primary' : 'text-red-500';
  const iconBg = type === 'success' ? 'bg-primary/10' : 'bg-red-100';

  return (
    <AnimatePresence>
      {message && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-4 w-full max-w-md pointer-events-none">
          <motion.div
            layout
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = offset.x;

              if (Math.abs(swipe) > 100 || Math.abs(velocity.x) > 500) {
                onClose();
              }
            }}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-xl shadow-black/5 border border-r-4 ${bgColor} ${borderColor} text-gray-900 mx-auto w-fit max-w-full font-medium`}
            style={{ touchAction: 'none' }}
          >
            <div className={`flex-shrink-0 ${iconBg} ${iconColor} p-2 rounded-full`}>
              <Icon size={24} />
            </div>
            <div className="flex-1 text-sm leading-snug">
              {isQuotaError ? (
                <div className="space-y-2 text-right" dir="rtl">
                  <p className="font-bold text-red-700 text-sm md:text-base">تنبيه: تم تجاوز حصة القراءة المجانية لـ Firestore (Quota Exceeded)</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    لقد تجاوزت قاعدة البيانات الحد المجاني اليومي لقراءة البيانات. ستتم إعادة تعيين الحدود تلقائياً غداً. 
                    إذا كنت بحاجة لترقية الحصة الحالية وتجنب انقطاع الخدمة، يرجى الانتقال إلى وحدة تحكم Firebase وتفعيل خيار الترقية:
                  </p>
                  <a 
                    href="https://console.firebase.google.com/project/gen-lang-client-0782647329/firestore/databases/ai-studio-cc0afd8f-ba32-43cb-b0ac-3cd2b8d59c47/data?openUpgradeDialog=true"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block mt-1 text-xs font-bold text-red-600 hover:text-red-800 underline transition-colors"
                  >
                    رابط ترقية قاعدة البيانات في كونسول Firebase ↗
                  </a>
                </div>
              ) : (
                <p className="text-sm md:text-base">{message}</p>
              )}
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 flex-shrink-0"
            >
              <X size={18} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ToastMessage;
