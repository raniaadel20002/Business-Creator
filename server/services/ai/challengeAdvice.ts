import { ChallengeAdviceItem } from '../types.js';

export const getChallengeAdvice = (challenges: string, projectName?: string): ChallengeAdviceItem[] => {
  const lowerChallenges = (challenges || '').toLowerCase();
  const advice: ChallengeAdviceItem[] = [];

  if (lowerChallenges.includes('تمويل') || lowerChallenges.includes('مال') || lowerChallenges.includes('فلوس') || lowerChallenges.includes('رأس المال') || lowerChallenges.includes('ميزانية') || lowerChallenges.includes('funding') || lowerChallenges.includes('money')) {
    advice.push({
      title: 'تخطي عقبة التمويل ورأس المال المحدود',
      advice: `تستطيع بدء مشروعك (${projectName || 'المحلي'}) بميزانية مرنة جداً من خلال الاعتماد على نموذج "الافتتاح التدريجي" والحد الأدنى من الخدمة (MVP). ابدأ بخدمة أولية ذات تكلفة تأسيس منخفضة، واعد استخدام الأرباح المبكرة لتمويل مراحل التوسع القادمة.`,
      links: [
        { name: 'دليل التمويل الجماعي والمستثمرين', url: 'https://io.hsoub.com/entrepreneurship' },
        { name: 'كيفية بدء مشروع بأقل تكلفة', url: 'https://www.wamda.com/ar' }
      ]
    });
  }

  if (lowerChallenges.includes('وقت') || lowerChallenges.includes('الوقت') || lowerChallenges.includes('مواعيد') || lowerChallenges.includes('time')) {
    advice.push({
      title: 'إدارة الوقت والموازنة مع الالتزامات اليومية',
      advice: 'خصص من ساعتين إلى 3 ساعات يومياً فقط في أوقات الهدوء أو عطلة نهاية الأسبوع لإنجاز المهام الأساسية للمشروع. استخدم أدوات الأتمتة والجدولة الآلية للمحتوى والردود لتوفير وقتك اليومي.',
      links: [
        { name: 'دليل أتمتة الأعمال التكرارية', url: 'https://zapier.com' },
        { name: 'أساليب تنظيم الوقت للرياديين', url: 'https://io.hsoub.com' }
      ]
    });
  }

  if (lowerChallenges.includes('علاقات') || lowerChallenges.includes('العلاقات') || lowerChallenges.includes('معارف') || lowerChallenges.includes('شبكة') || lowerChallenges.includes('networking')) {
    advice.push({
      title: 'بناء شبكة العلاقات والمعارف التجارية من الصفر',
      advice: 'عدم وجود معارف في البداية أمر طبيعي تماماً في بداية الطريق. يمكنك بناء شبكة علاقات ممتازة عبر التفاعل في مجتمعات ريادة الأعمال العربية مثل حسوب I/O والمشاركة الفعالة على منصة LinkedIn المخصصة لمجالك.',
      links: [
        { name: 'مجتمع حسوب ريادة أعمال', url: 'https://io.hsoub.com/entrepreneurship' },
        { name: 'شبكة LinkedIn المهنية', url: 'https://www.linkedin.com' }
      ]
    });
  }

  if (lowerChallenges.includes('بيئة') || lowerChallenges.includes('البيئة') || lowerChallenges.includes('أهل') || lowerChallenges.includes('محيط') || lowerChallenges.includes('تشجيع') || lowerChallenges.includes('دعم')) {
    advice.push({
      title: 'التعامل مع البيئة المحيطة وغياب الدعم المباشر',
      advice: 'اندمج مع مجتمع من الشغوفين ورواد الأعمال الذين يشاركونك نفس الطموح، ولا تنتظر التشجيع المباشر من المحيطين حتى تظهر نتائج مشروعك الملموسة. حوّل الملاحظات إلى حافز لإثبات نجاح الفكرة بخطوات عمل صغيرة يومية.',
      links: [
        { name: 'مجتمع رواد الأعمال العرب', url: 'https://io.hsoub.com' },
        { name: 'قصص تجارب رواد الأعمال', url: 'https://www.wamda.com/ar' }
      ]
    });
  }

  if (lowerChallenges.includes('تسويق') || lowerChallenges.includes('عملاء') || lowerChallenges.includes('marketing') || lowerChallenges.includes('customers')) {
    advice.push({
      title: 'جذب العملاء والتسويق الموجه بأقل تكلفة',
      advice: 'ركز على استراتيجية "التسويق بالمحتوى" القائم على حل مشكلات حقيقية لجمهورك المستهدف. اختر منصة واحدة يتواجد فيها عملاؤك بكثافة بدلاً من التشتت بين عدة منصات.',
      links: [
        { name: 'أساسيات التسويق الرقمي من جوجل', url: 'https://learndigital.withgoogle.com/digitalgarage/course/digital-marketing' },
        { name: 'دليل التسويق عبر منصات التواصل', url: 'https://hubspot.com/social-media-marketing' }
      ]
    });
  }

  if (lowerChallenges.includes('تقني') || lowerChallenges.includes('برمج') || lowerChallenges.includes('technical') || lowerChallenges.includes('software')) {
    advice.push({
      title: 'الحلول التقنية بدون الحاجة لخبرة برمجية',
      advice: 'إذا لم تكن لديك خلفية برمجية، اعتمد على الأدوات بدون كود (No-Code) والمنصات الجاهزة لبناء متجرك أو موقعك الأولي بمرونة وسرعة وبأقل تكلفة.',
      links: [
        { name: 'دليل أدوات No-Code لبناء المشاريع', url: 'https://www.makerpad.co/' },
        { name: 'تعلم المهارات التقنية الأساسية', url: 'https://www.freecodecamp.org/' }
      ]
    });
  }

  if (lowerChallenges.includes('قانون') || lowerChallenges.includes('ترخيص') || lowerChallenges.includes('legal') || lowerChallenges.includes('license')) {
    advice.push({
      title: 'الإجراءات القانونية والتراخيص الرسمية',
      advice: 'استشر مستشاراً قانونياً أو محاسباً متخصصاً في الشركات الناشئة. ابدأ بالحد الأدنى من التراخيص الرسمية ومظلات العمل الحر أو المنشآت الفردية لتأمين عملك.',
      links: [
        { name: 'دليل تأسيس الشركات والمنشآت', url: 'https://www.ycombinator.com/library' },
        { name: 'نماذج العقود والاتفاقيات', url: 'https://www.lawdepot.com/' }
      ]
    });
  }

  if (advice.length === 0) {
    advice.push({
      title: `استراتيجية التعامل مع تحدي: ${challenges}`,
      advice: `لتجاوز التحديات المحددة في استبيانك (${challenges})، يوصى بتقسيم المهام الكبيرة إلى خطوات صغيرة قابلة للتنفيذ أسبوعياً، مع الاستعانة بمجتمعات ريادة الأعمال للحصول على توجيه مباشر وحلول مجربة من رواد أعمال مروا بنفس التجربة.`,
      links: [
        { name: 'مجتمع حسوب ريادة أعمال', url: 'https://io.hsoub.com/entrepreneurship' },
        { name: 'منصة ومضة لرواد الأعمال', url: 'https://www.wamda.com/ar' }
      ]
    });
  }

  return advice;
};
