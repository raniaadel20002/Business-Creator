import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  MessageCircle, 
  X, 
  ArrowLeft,
  Coins
} from 'lucide-react';
import { 
  TEMP_PAYMENT_CONFIG, 
  getWhatsAppPaymentUrl, 
  sendPaymentRequestToAdmin 
} from '../services/tempPaymentService';
import { useAuth } from './AuthContext';

interface TempPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName?: string;
  price?: string;
}

const TempPaymentModal: React.FC<TempPaymentModalProps> = ({
  isOpen,
  onClose,
  planName = TEMP_PAYMENT_CONFIG.PRO_PLAN_NAME,
  price = TEMP_PAYMENT_CONFIG.PRO_PLAN_PRICE
}) => {
  const { user, profile } = useAuth();
  const [requestSent, setRequestSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const userEmail = user?.email || profile?.email || '';
  const userName = profile?.displayName || user?.user_metadata?.full_name || profile?.userData?.fullName || '';

  // عند فتح النافذة، نقوم بإرسال إشعار "طلب دفع" للأدمن تلقائياً
  useEffect(() => {
    if (isOpen && user?.id && !requestSent && !isSending) {
      setIsSending(true);
      sendPaymentRequestToAdmin({
        userId: user.id,
        userEmail: userEmail,
        userName: userName,
        planName: planName,
        amount: price
      }).then(() => {
        setRequestSent(true);
        setIsSending(false);
      }).catch(() => {
        setIsSending(false);
      });
    }
  }, [isOpen, user?.id, userEmail, userName, planName, price, requestSent, isSending]);

  if (!isOpen) return null;

  const whatsappUrl = getWhatsAppPaymentUrl(userEmail, userName);

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        dir="rtl"
      >
        {/* Backdrop click */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10 text-right"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-gray-100 relative flex items-center justify-between">
            {/* Payment Icon with brand color and NO background box */}
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-primary stroke-[2.2]" />
              <div>
                <h3 className="text-lg font-black text-gray-900 leading-tight">
                  بوابة الدفع المؤقتة
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Business Creator</p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer border-none"
              title="إغلاق"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-5">
            {/* Primary Notice Message */}
            <div className="bg-orange-50/70 border border-orange-200/90 rounded-2xl p-4">
              <p className="text-orange-950 font-bold text-sm sm:text-base leading-relaxed text-right">
                {TEMP_PAYMENT_CONFIG.NOTICE_MESSAGE}
              </p>
            </div>

            {/* Explanatory text */}
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              لتفادي أي تأخير في بدء وتطوير مشروعك، يمكنك إتمام التحويل والدفع مباشرة وبشكل آمن عبر الواتساب وسيقوم فريقنا بتفعيل وتأكيد ترقية حسابك فوراً.
            </p>

            {/* Plan Details Preview */}
            <div className="bg-gray-50/80 rounded-2xl p-4 space-y-2.5 border border-gray-100 text-xs text-gray-700">
              <div className="flex items-center justify-between font-bold text-gray-900 border-b border-gray-200/60 pb-2">
                <span className="font-black text-sm">{planName}</span>
                <span className="text-primary font-black text-sm">{price} جنيه مصري</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 font-medium pt-0.5">
                <Coins size={15} className="text-primary shrink-0" />
                <span>شحن 100,000 نقطة لتحليل وتنفيذ غير محدود</span>
              </div>
            </div>

            {/* User Details Box */}
            {userEmail && (
              <div className="text-xs text-gray-500 bg-orange-50/40 p-3 rounded-xl border border-orange-100/80 flex items-center justify-between">
                <span className="font-medium">الحساب المسجل:</span>
                <span className="font-mono font-bold text-gray-800 dir-ltr">{userEmail}</span>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              {/* Primary WhatsApp Action Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md shadow-orange-500/20 transition-all hover:scale-[1.01] active:scale-98 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white/20" />
                <span>{TEMP_PAYMENT_CONFIG.BUTTON_TEXT}</span>
                <ArrowLeft className="w-4 h-4 mr-1" />
              </a>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer border-none bg-transparent"
              >
                إغلاق والعودة
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TempPaymentModal;
