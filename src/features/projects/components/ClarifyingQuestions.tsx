import React, { useState } from 'react';
import { HelpCircle, ArrowRight, MessageSquare, Send } from 'lucide-react';

interface ClarifyingQuestionsProps {
  questions: string[];
  onBack: () => void;
  onSubmitAnswers: (answers: { question: string; answer: string }[]) => void;
}

const ClarifyingQuestions: React.FC<ClarifyingQuestionsProps> = ({ questions, onBack, onSubmitAnswers }) => {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});

  const handleSubmit = () => {
    const formattedAnswers = (questions || []).map((q, i) => ({
      question: q,
      answer: answers[i] || "لا يوجد إجابة"
    }));
    onSubmitAnswers(formattedAnswers);
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-surface rounded-3xl shadow-soft overflow-hidden border border-border">
        <div className="bg-primary/5 p-8 border-b border-primary/10 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-soft">
            <HelpCircle size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-text-primary">نحتاج لبعض التوضيحات</h2>
            <p className="text-primary text-sm font-medium">البيانات الحالية غير كافية لبناء خطة عمل احترافية</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <p className="text-text-secondary leading-relaxed">
            بصفتي مسرعة أعمال، أريد أن أقدم لك أفضل خطة ممكنة. لكي أتمكن من ذلك، يرجى الإجابة على الأسئلة التالية للمساعدة في إخراج خطة واقعية:
          </p>

          <div className="space-y-6">
            {(questions || []).map((q, i) => (
              <div key={i} className="flex gap-4 p-4 bg-background rounded-2xl border border-border items-start flex-col sm:flex-row">
                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="w-6 h-6 bg-surface text-primary rounded-full flex items-center justify-center text-xs font-bold border border-primary/20 flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-text-primary font-medium sm:hidden">{q}</p>
                </div>
                <div className="flex-1 w-full space-y-3">
                  <p className="text-text-primary font-medium hidden sm:block">{q}</p>
                  <textarea
                    value={answers[i] || ''}
                    onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                    className="w-full bg-surface border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-24"
                    placeholder="اكتب إجابتك هنا..."
                  ></textarea>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-soft shadow-primary/20"
            >
              <span>تقديم الإجابات والمتابعة</span>
              <Send size={20} />
            </button>
            <button
              onClick={onBack}
              className="sm:w-auto bg-surface text-text-secondary py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all border border-border"
            >
              <ArrowRight size={20} />
              <span>العودة للنموذج</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-text-muted bg-primary/5 p-4 rounded-xl border border-primary/10">
            <MessageSquare size={18} className="text-primary flex-shrink-0" />
            <p>نصيحة: كلما كانت إجاباتك مفصلة، كلما كانت خطة العمل أكثر دقة ومناسبة لك.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClarifyingQuestions;
