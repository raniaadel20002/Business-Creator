import React, { useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';
import { createNotification } from '../services/notificationService';
import { sendFeedbackReceivedEmail } from '../server/services/email/emailService';

export default function Feedback() {
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    if (!user) {
      setError('يرجى تسجيل الدخول أولاً لإرسال ملاحظاتك.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase.from('feedbacks').insert({
        user_id: user.id,
        user_name: profile?.displayName || user.user_metadata?.full_name || user.email || 'متصل',
        user_email: user.email,
        type: feedbackType,
        text: feedbackText,
        created_at: new Date().toISOString(),
        status: 'new'
      });
      if (error) throw error;

      const typeLabel = feedbackType === 'suggestion' 
        ? 'اقتراح تطوير' 
        : feedbackType === 'problem' 
          ? 'مشكلة واجهتك' 
          : 'أخرى';
          
      if (user.email) {
        await sendFeedbackReceivedEmail(user.email, feedbackType, feedbackText, profile?.userData?.gender);
      }

      await createNotification(
        user.id,
        'تم استلام مشاركتك بنجاح',
        `شكراً لك على مشاركتنا (${typeLabel})، يقدر فريق العمل ملاحظاتك وسيتم مراجعتها بعناية.`,
        'feedback_submitted',
        false,
        true
      );

      setSuccess(true);
      setFeedbackText('');
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setError('حدث خطأ أثناء إرسال ملاحظاتك، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-3xl shadow-xl shadow-orange-500/5 border border-orange-100 p-8">
        <div className="flex items-center gap-3 md:gap-4 mb-8">
          <MessageCircle size={36} className="text-orange-600 shrink-0 stroke-[2]" />
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">شاركنا رأيك</h2>
            <p className="text-gray-500 mt-1 text-sm md:text-base">نحن نقدر رأيك لمساعدتنا في تحسين تجربتك.</p>
          </div>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-6 text-center animate-in fade-in zoom-in duration-500">
            <h3 className="text-xl font-bold mb-2">شكراً لمشاركتك!</h3>
            <p>لقد استلمنا رسالتك بنجاح وسنقوم بمراجعتها في أقرب وقت.</p>
            <button 
              onClick={() => setSuccess(false)}
              className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
            >
              إرسال ملاحظة أخرى
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">نوع المشاركة</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['suggestion', 'problem', 'other'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFeedbackType(type)}
                    className={`p-3 rounded-xl border font-bold text-sm transition-all text-center ${
                      feedbackType === type 
                        ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {type === 'suggestion' ? 'اقتراح تطوير' : type === 'problem' ? 'مشكلة واجهتك' : 'أخرى'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">التفاصيل</label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={5}
                className="w-full p-4 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-none bg-gray-50/50"
                placeholder="اكتب ملاحظاتك، شكواك، أو اقتراحاتك هنا..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !feedbackText.trim()}
              className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-xl font-bold text-lg hover:from-orange-700 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send size={20} /> إرسال المشاركة
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
