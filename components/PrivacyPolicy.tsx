import React from 'react';
import { Shield } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="w-full bg-surface p-8 md:p-12 rounded-3xl shadow-sm border border-border">
      <div className="flex items-center gap-3 md:gap-4 mb-8 border-b border-gray-100 pb-8">
        <Shield size={36} className="text-primary shrink-0 stroke-[2]" />
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-text-primary">سياسة الخصوصية</h2>
          <p className="text-text-muted mt-1 text-sm md:text-base">آخر تحديث: أبريل 2026</p>
        </div>
      </div>

      <div className="space-y-8 text-text-secondary leading-relaxed">
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">1. جمع المعلومات</h3>
          <p>
            نحن نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند استخدام منصتنا، بما في ذلك بيانات المشروع، الأفكار، والمعلومات الشخصية الأساسية اللازمة لإنشاء حسابك وتخصيص تجربتك.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">2. استخدام المعلومات</h3>
          <p>
            تُستخدم المعلومات التي نجمعها بشكل أساسي لتوليد خطط العمل ودراسات الجدوى المخصصة لك باستخدام تقنيات Business Creator. لا نقوم ببيع أو مشاركة أفكار مشاريعك مع أي أطراف ثالثة.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">3. حماية البيانات</h3>
          <p>
            نتخذ إجراءات أمنية صارمة لحماية معلوماتك من الوصول غير المصرح به أو التعديل أو الإفصاح. يتم تشفير جميع البيانات الحساسة وتخزينها في خوادم آمنة.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">4. ملفات تعريف الارتباط (Cookies)</h3>
          <p>
            نستخدم ملفات تعريف الارتباط لتحسين تجربتك على الموقع، تذكر تفضيلاتك، وفهم كيفية استخدامك لخدماتنا لتطويرها باستمرار.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
