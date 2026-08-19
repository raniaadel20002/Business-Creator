import { supabase } from '../supabase';
import { createNotification } from './notificationService';

/**
 * ==============================================================================
 * Temporary Payment & Upgrade Service (Business Creator)
 * ==============================================================================
 * هذا الملف مستقل بالكامل للتحكم في آلية الدفع المؤقتة عبر الواتساب وطلبات الدفع.
 * للرجوع للنظام الأصلي في أي وقت: قم بتغيير IS_TEMP_PAYMENT_ENABLED إلى false.
 */

export const TEMP_PAYMENT_CONFIG = {
  // مفتاح التفعيل / التعطيل للعودة للنظام الأصلي بسهولة
  IS_TEMP_PAYMENT_ENABLED: true,

  // رقم الواتساب الرسمي المعتمد للمنصة
  WHATSAPP_NUMBER: '201034927416',

  // النصوص الرسمية
  NOTICE_MESSAGE: 'نعمل علي اصلاح طريقة الدفع الخصه ب business creator',
  BUTTON_TEXT: 'ادفع من هنا بشكل مؤقت',

  // تفاصيل الباقة الافتراضية
  PRO_PLAN_PRICE: '499',
  PRO_PLAN_TOKENS: 100000,
  PRO_PLAN_NAME: 'خطة رواد الأعمال (PRO)'
};

/**
 * إنشاء رابط الواتساب المباشر مع رسالة مجهزة ببيانات المستخدم
 */
export const getWhatsAppPaymentUrl = (userEmail?: string, userName?: string): string => {
  const emailText = userEmail ? `\n- البريد الإلكتروني المسجل: ${userEmail}` : '';
  const nameText = userName ? `\n- الاسم: ${userName}` : '';
  
  const text = `أهلاً بك، أرغب في الدفع والترقية إلى ${TEMP_PAYMENT_CONFIG.PRO_PLAN_NAME} (قيمة ${TEMP_PAYMENT_CONFIG.PRO_PLAN_PRICE} ج.م) عبر التحويل المؤقت.${nameText}${emailText}\n\nيرجى تزويدي ببيانات التحويل لإتمام العملية وترقية حسابي.`;
  
  return `https://wa.me/${TEMP_PAYMENT_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
};

/**
 * إرسال إشعار / طلب دفع تلقائي للأدمن في لوحة التحكم
 */
export const sendPaymentRequestToAdmin = async (params: {
  userId: string;
  userEmail: string;
  userName?: string;
  planName?: string;
  amount?: string;
}) => {
  const { userId, userEmail, userName, planName = TEMP_PAYMENT_CONFIG.PRO_PLAN_NAME, amount = TEMP_PAYMENT_CONFIG.PRO_PLAN_PRICE } = params;

  try {
    // 1. تسجيل طلب الدفع في جدول feedbacks لسهولة العرض والرد في لوحة الأدمن
    const { error: feedbackError } = await supabase.from('feedbacks').insert({
      user_id: userId,
      user_name: userName || userEmail.split('@')[0],
      user_email: userEmail,
      type: 'payment_request',
      text: `طلب دفع وترقية إلى ${planName} بقيمة ${amount} ج.م (دفع مؤقت عبر الواتساب)`,
      status: 'new'
    });

    if (feedbackError) {
      console.warn('Feedbacks insert error (temp payment):', feedbackError);
    }

    // 2. تسجيل الحدث في سجلات النظام logs
    await supabase.from('logs').insert({
      user_id: userId,
      user_name: userName || userEmail.split('@')[0],
      user_email: userEmail,
      action: 'طلب دفع',
      details: {
        module: 'Payment',
        plan: 'PRO',
        amount: Number(amount) || 499,
        status: 'pending',
        via: 'whatsapp_temp',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending payment request to admin:', error);
    return { success: false, error };
  }
};

/**
 * ترقية حساب المستخدم يدوياً بضغطة زر واحدة من لوحة الأدمن
 */
export const adminUpgradeUserAccount = async (params: {
  userId: string;
  userEmail?: string;
  feedbackId?: string;
  tokensToAdd?: number;
}) => {
  const { userId, userEmail, feedbackId, tokensToAdd = TEMP_PAYMENT_CONFIG.PRO_PLAN_TOKENS } = params;

  try {
    // 1. جلب بيانات المستخدم الحالية لمعرفة رصيد النقاط الحالي
    const { data: userData, error: fetchErr } = await supabase
      .from('users')
      .select('tokens, subscription_plan')
      .eq('id', userId)
      .single();

    if (fetchErr) {
      console.warn('Could not fetch current tokens, defaulting to base tokens', fetchErr);
    }

    const currentTokens = userData?.tokens || 0;
    const newTokens = currentTokens + tokensToAdd;

    // 2. تحديث باقة المستخدم إلى PRO وشحن النقاط
    const { error: updateErr } = await supabase
      .from('users')
      .update({
        subscription_plan: 'PRO',
        tokens: newTokens,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    // 3. تحديث حالة طلب الدفع في feedbacks إذا كان المعرف متوفراً
    if (feedbackId) {
      await supabase
        .from('feedbacks')
        .update({
          status: 'replied',
          reply: 'تمت ترقية الحساب بنجاح إلى باقة رواد الأعمال (PRO) وشحن 100,000 نقطة.',
          replied_at: new Date().toISOString()
        })
        .eq('id', feedbackId);
    }

    // 4. إرسال إشعار رسمي موثق ومميز للمستخدم
    await createNotification(
      userId,
      '🎉 تهانينا! تمت ترقية حسابك بنجاح',
      `تم تفعيل خطة رواد الأعمال (PRO) وشحن ${tokensToAdd.toLocaleString('ar-EG')} نقطة في رصيدك. يمكنك الآن إكمال واستخراج كافة دراسات ومسارات مشاريعك الاحترافية!`,
      'recharge_renew',
      false,
      true
    );

    // 5. تسجيل نشاط ترقية الأدمن في الـ logs
    await supabase.from('logs').insert({
      user_id: 'admin',
      user_name: 'إدارة المنصة',
      user_email: 'admin@businesscreator.ai',
      action: 'ترقية حساب مستخدم (دفع يدوي)',
      details: {
        targetUserId: userId,
        targetEmail: userEmail,
        plan: 'PRO',
        addedTokens: tokensToAdd,
        newTotalTokens: newTokens,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

    return { success: true, newTokens };
  } catch (error: any) {
    console.error('Failed to upgrade user in temp payment service:', error);
    return { success: false, error: error.message || 'فشلت ترقية الحساب' };
  }
};
