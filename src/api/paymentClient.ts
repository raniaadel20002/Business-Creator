import { supabase } from '../services/supabase';

export const TEMP_PAYMENT_CONFIG = {
  IS_TEMP_PAYMENT_ENABLED: true,
  WHATSAPP_NUMBER: '201034927416',
  NOTICE_MESSAGE: '\u0646\u0639\u0645\u0644 \u0639\u0644\u064a \u0627\u0635\u0644\u0627\u062d \u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062f\u0641\u0639 \u0627\u0644\u062e\u0635\u0647 \u0628 business creator',
  BUTTON_TEXT: '\u0627\u062f\u0641\u0639 \u0645\u0646 \u0647\u0646\u0627 \u0628\u0634\u0643\u0644 \u0645\u0624\u0642\u062a',
  PRO_PLAN_PRICE: '499',
  PRO_PLAN_TOKENS: 100000,
  PRO_PLAN_NAME: '\u062e\u0637\u0629 \u0631\u0648\u0627\u062f \u0627\u0644\u0623\u0639\u0645\u0627\u0644 (PRO)'
};

export const getWhatsAppPaymentUrl = (userEmail?: string, userName?: string): string => {
  const emailText = userEmail ? `\n- \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0627\u0644\u0645\u0633\u062c\u0644: ${userEmail}` : '';
  const nameText = userName ? `\n- \u0627\u0644\u0627\u0633\u0645: ${userName}` : '';

  const text = `\u0623\u0647\u0644\u0627\u064b \u0628\u0643\u060c \u0623\u0631\u063a\u0628 \u0641\u064a \u0627\u0644\u062f\u0641\u0639 \u0648\u0627\u0644\u062a\u0631\u0642\u064a\u0629 \u0625\u0644\u0649 ${TEMP_PAYMENT_CONFIG.PRO_PLAN_NAME} (\u0642\u064a\u0645\u0629 ${TEMP_PAYMENT_CONFIG.PRO_PLAN_PRICE} \u062c.\u0645) \u0639\u0628\u0631 \u0627\u0644\u062a\u062d\u0648\u064a\u0644 \u0627\u0644\u0645\u0624\u0642\u062a.${nameText}${emailText}\n\n\u064a\u0631\u062c\u0649 \u062a\u0632\u0648\u064a\u062f\u064a \u0628\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u062d\u0648\u064a\u0644 \u0644\u0625\u062a\u0645\u0627\u0645 \u0627\u0644\u0639\u0645\u0644\u064a\u0629 \u0648\u062a\u0631\u0642\u064a\u0629 \u062d\u0633\u0627\u0628\u064a.`;

  return `https://wa.me/${TEMP_PAYMENT_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
};

export const sendPaymentRequestToAdmin = async (params: {
  userId: string;
  userEmail: string;
  userName?: string;
  planName?: string;
  amount?: string;
}) => {
  const { userId, userEmail, userName, planName = TEMP_PAYMENT_CONFIG.PRO_PLAN_NAME, amount = TEMP_PAYMENT_CONFIG.PRO_PLAN_PRICE } = params;

  try {
    const { error: feedbackError } = await supabase.from('feedbacks').insert({
      user_id: userId,
      user_name: userName || userEmail.split('@')[0],
      user_email: userEmail,
      type: 'payment_request',
      text: `\u0637\u0644\u0628 \u062f\u0641\u0639 \u0648\u062a\u0631\u0642\u064a\u0629 \u0625\u0644\u0649 ${planName} \u0628\u0642\u064a\u0645\u0629 ${amount} \u062c.\u0645 (\u062f\u0641\u0639 \u0645\u0624\u0642\u062a \u0639\u0628\u0631 \u0627\u0644\u0648\u0627\u062a\u0633\u0627\u0628)`,
      status: 'new'
    });

    if (feedbackError) {
      console.warn('Feedbacks insert error (temp payment):', feedbackError);
    }

    await supabase.from('logs').insert({
      user_id: userId,
      user_name: userName || userEmail.split('@')[0],
      user_email: userEmail,
      action: '\u0637\u0644\u0628 \u062f\u0641\u0639',
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
