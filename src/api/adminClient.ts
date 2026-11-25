import { supabase } from '../services/supabase';
import { createNotification } from '../services/notificationService';

const PRO_PLAN_TOKENS = 100000;

export const adminUpgradeUserAccount = async (params: {
  userId: string;
  userEmail?: string;
  feedbackId?: string;
  tokensToAdd?: number;
}) => {
  const { userId, userEmail, feedbackId, tokensToAdd = PRO_PLAN_TOKENS } = params;

  try {
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

    const { error: updateErr } = await supabase
      .from('users')
      .update({
        subscription_plan: 'PRO',
        tokens: newTokens,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    if (feedbackId) {
      await supabase
        .from('feedbacks')
        .update({
          status: 'replied',
          reply: '\u062a\u0645\u062a \u062a\u0631\u0642\u064a\u0629 \u0627\u0644\u062d\u0633\u0627\u0628 \u0628\u0646\u062c\u0627\u062d \u0625\u0644\u0649 \u0628\u0627\u0642\u0629 \u0631\u0648\u0627\u062f \u0627\u0644\u0623\u0639\u0645\u0627\u0644 (PRO) \u0648\u0634\u062d\u0646 100,000 \u0646\u0642\u0637\u0629.',
          replied_at: new Date().toISOString()
        })
        .eq('id', feedbackId);
    }

    await createNotification(
      userId,
      '\ud83c\udf89 \u062a\u0647\u0627\u0646\u064a\u0646\u0627! \u062a\u0645\u062a \u062a\u0631\u0642\u064a\u0629 \u062d\u0633\u0627\u0628\u0643 \u0628\u0646\u062c\u0627\u062d',
      `\u062a\u0645 \u062a\u0641\u0639\u064a\u0644 \u062e\u0637\u0629 \u0631\u0648\u0627\u062f \u0627\u0644\u0623\u0639\u0645\u0627\u0644 (PRO) \u0648\u0634\u062d\u0646 ${tokensToAdd.toLocaleString('ar-EG')} \u0646\u0642\u0637\u0629 \u0641\u064a \u0631\u0635\u064a\u062f\u0643. \u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u0622\u0646 \u0625\u0643\u0645\u0627\u0644 \u0648\u0627\u0633\u062a\u062e\u0631\u0627\u062c \u0643\u0627\u0641\u0629 \u062f\u0631\u0627\u0633\u0627\u062a \u0648\u0645\u0633\u0627\u0631\u0627\u062a \u0645\u0634\u0627\u0631\u064a\u0639\u0643 \u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629!`,
      'recharge_renew',
      false,
      true
    );

    await supabase.from('logs').insert({
      user_id: 'admin',
      user_name: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0635\u0629',
      user_email: 'admin@businesscreator.ai',
      action: '\u062a\u0631\u0642\u064a\u0629 \u062d\u0633\u0627\u0628 \u0645\u0633\u062a\u062e\u062f\u0645 (\u062f\u0641\u0639 \u064a\u062f\u0648\u064a)',
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
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Failed to upgrade user in admin client:', err);
    return { success: false, error: err.message || '\u0641\u0634\u0644\u062a \u062a\u0631\u0642\u064a\u0629 \u0627\u0644\u062d\u0633\u0627\u0628' };
  }
};
