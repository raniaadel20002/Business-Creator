import { Request, Response } from 'express';

const PLAN_PRICING: Record<string, { price: number; name: string }> = {
  PRO: { price: 499, name: 'خطة رواد الأعمال (PRO)' }
};

export default async function paymobCheckoutHandler(req: Request, res: Response) {
  try {
    const { userId, email, planId } = req.body;

    if (!planId || !PLAN_PRICING[planId]) {
      return res.status(400).json({ error: 'خطة الاشتراك المطلوبة غير صحيحة.' });
    }

    // Authoritative server-side price (ignore any client-provided amount)
    const authoritativeAmount = PLAN_PRICING[planId].price;

    const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
    const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
    const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;

    if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION_ID || !PAYMOB_IFRAME_ID) {
      console.warn('Paymob environment variables missing. Returning mock URL for testing.');
      return res.status(200).json({ 
        isMock: true,
        orderId: 'MOCK_ORDER'
      });
    }

    const cleanIntegrationId = PAYMOB_INTEGRATION_ID.trim();
    const cleanIframeId = PAYMOB_IFRAME_ID.trim();
    const isIntegrationIdNumeric = /^\d+$/.test(cleanIntegrationId);
    const isIframeIdNumeric = /^\d+$/.test(cleanIframeId);

    if (!isIntegrationIdNumeric || !isIframeIdNumeric) {
      let specificDetail = '';
      if (cleanIntegrationId.includes('egy_pk') || cleanIntegrationId.includes('egy_sk')) {
        specificDetail = 'لقد قمت بإدخال مفتاح الـ API العام (Public Key - يبدأ بـ egy_pk) بالخطأ في حقل معرف قناة الدمج (PAYMOB_INTEGRATION_ID).';
      } else if (cleanIframeId.includes('egy_pk') || cleanIframeId.includes('egy_sk')) {
        specificDetail = 'لقد قمت بإدخال مفتاح الـ API العام (Public Key - يبدأ بـ egy_pk) بالخطأ في حقل معرف الإطار الذكي (PAYMOB_IFRAME_ID).';
      } else {
        specificDetail = 'تأكد من أن معرفات بيموب (Integration ID و Iframe ID) تحتوي على أرقام فقط وليس رموزاً أو أحرفاً.';
      }

      const userFriendlyError = `خطأ في إعدادات بوابة الدفع (Paymob):
${specificDetail}

يرجى الذهاب لوحة تحكم التطبيق في الـ Settings وتصحيح قيم المتغيرات:
1. PAYMOB_INTEGRATION_ID: يجب تدوين "رقم قيمة الدمج" فقط (أرقام فقط، مثال: 456789 - تجده في لوحة بيموب في خطوة الدمج Integration).
2. PAYMOB_IFRAME_ID: يجب تدوين "رقم الـ IFrame" فقط (أرقام فقط، مثال: 12345 - تجده في لوحة بيموب تحت IFrames).
3. PAYMOB_API_KEY: يجب تدوين مفتاح الـ API (API Key) الكامل الخاص بحسابك.`;

      return res.status(400).json({ error: userFriendlyError });
    }

    // 1. Get Auth Token
    const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: PAYMOB_API_KEY })
    });
    const authData = await authRes.json();
    if (!authRes.ok) throw new Error(authData.message || 'Failed to authenticate with Paymob');
    const authToken = authData.token;

    // 2. Register Order with authoritative price
    const orderRes = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: 'false',
        amount_cents: authoritativeAmount * 100,
        currency: 'EGP',
        items: [],
      })
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) throw new Error('Failed to create Paymob order');
    const orderId = orderData.id;

    // 3. Request Payment Key
    const paymentKeyRes = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: authoritativeAmount * 100,
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          apartment: userId || 'NA', email: email || 'test@test.com', floor: planId || 'NA',
          first_name: 'User', street: 'NA', building: 'NA',
          phone_number: '+201000000000', shipping_method: 'NA',
          postal_code: 'NA', city: 'NA', country: 'EG',
          last_name: 'NA', state: 'NA'
        },
        currency: 'EGP',
        integration_id: parseInt(cleanIntegrationId, 10),
        lock_order_when_paid: 'false'
      })
    });
    const paymentKeyData = await paymentKeyRes.json();
    if (!paymentKeyRes.ok) {
      throw new Error(paymentKeyData.message || 'Failed to get payment key');
    }
    const paymentToken = paymentKeyData.token;

    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${cleanIframeId}?payment_token=${paymentToken}`;

    res.status(200).json({ iframeUrl, orderId });

  } catch (error: any) {
    console.error('Paymob Checkout Error:', error);
    res.status(500).json({ error: error.message || 'Payment initiation failed' });
  }
}
