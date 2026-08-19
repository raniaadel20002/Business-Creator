import { Request, Response } from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export default async function paymobWebhookHandler(req: Request, res: Response) {
  try {
    const PAYMOB_HMAC = process.env.PAYMOB_HMAC;
    if (!PAYMOB_HMAC) {
      console.warn('Paymob HMAC secret missing.');
      return res.status(200).send('mock-ok');
    }

    const hmacReceived = req.query.hmac as string;
    const { obj } = req.body;

    if (!obj || !obj.order) {
      return res.status(400).send('Invalid payload');
    }

    // Determine HMAC string based on Paymob docs
    const amount_cents = obj.amount_cents;
    const created_at = obj.created_at;
    const currency = obj.currency;
    const error_occured = obj.error_occured;
    const has_parent_transaction = obj.has_parent_transaction;
    const id = obj.id;
    const integration_id = obj.integration_id;
    const is_3d_secure = obj.is_3d_secure;
    const is_auth = obj.is_auth;
    const is_capture = obj.is_capture;
    const is_refunded = obj.is_refunded;
    const is_standalone_payment = obj.is_standalone_payment;
    const is_voided = obj.is_voided;
    const order_id = obj.order.id;
    const owner = obj.owner;
    const pending = obj.pending;
    const source_data_pan = obj.source_data.pan;
    const source_data_sub_type = obj.source_data.sub_type;
    const source_data_type = obj.source_data.type;
    const success = obj.success;

    const hmacString = [
      amount_cents,
      created_at,
      currency,
      error_occured,
      has_parent_transaction,
      id,
      integration_id,
      is_3d_secure,
      is_auth,
      is_capture,
      is_refunded,
      is_standalone_payment,
      is_voided,
      order_id,
      owner,
      pending,
      source_data_pan,
      source_data_sub_type,
      source_data_type,
      success
    ].join('');

    const hmacCalculated = crypto
      .createHmac('sha512', PAYMOB_HMAC)
      .update(hmacString)
      .digest('hex');

    const calculatedBuffer = Buffer.from(hmacCalculated, 'utf-8');
    const receivedBuffer = Buffer.from(hmacReceived || '', 'utf-8');

    if (calculatedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(calculatedBuffer, receivedBuffer)) {
      console.error('Paymob HMAC verification failed');
      return res.status(401).send('Unauthorized');
    }

    if (success === true) {
      // Payment successful!
      const userId = obj.order.shipping_data?.apartment || obj.order.billing_data?.apartment; // userId in apartment
      const planId = obj.order.shipping_data?.floor || obj.order.billing_data?.floor; // planId in floor

      const EXPECTED_PLAN_PRICES_CENTS: Record<string, number> = {
        PRO: 49900
      };

      if (planId && EXPECTED_PLAN_PRICES_CENTS[planId]) {
        const expectedCents = EXPECTED_PLAN_PRICES_CENTS[planId];
        if (amount_cents < expectedCents) {
          console.error(`[Paymob Webhook] Underpaid transaction for user ${userId}. Expected ${expectedCents} cents, got ${amount_cents} cents.`);
          return res.status(400).send('Underpaid transaction rejected');
        }
      }

      if (userId && userId !== 'NA') {
        const supabaseUrl = process.env.SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        });

        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('tokens, subscription_plan')
          .eq('id', userId)
          .single();

        if (!fetchError && userData) {
          let newTokens = userData.tokens || 0;
          let newPlan = userData.subscription_plan || 'FREE';

          if (planId === 'PRO') {
            newTokens += 100000;
            newPlan = 'PRO';
          }

          await supabase.from('users').update({
            tokens: newTokens,
            subscription_plan: newPlan
          }).eq('id', userId);

          // Record the transaction
          await supabase.from('transactions').insert({
            user_id: userId,
            order_id: order_id || obj.order.id,
            amount: obj.amount_cents / 100,
            currency: obj.currency,
            plan_id: planId,
            created_at: new Date().toISOString(),
            status: 'success'
          });

          console.log(`Payment success: upgraded user ${userId} to ${planId}`);
        } else {
          console.error(`User ${userId} not found in Supabase`);
        }
      }
    }

    res.status(200).send('success');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
}
