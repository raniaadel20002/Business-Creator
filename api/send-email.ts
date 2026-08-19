import { Resend } from "resend";

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.warn("[Email API] RESEND_API_KEY is not set in environment variables.");
    return res.status(200).json({ 
      success: false, 
      warning: "RESEND_API_KEY_NOT_SET", 
      message: "لم يتم ضبط مفتاح RESEND_API_KEY في متغيرات البيئة." 
    });
  }

  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: "Missing required fields (to, subject, html)" });
    }

    if (typeof to !== 'string' || typeof subject !== 'string' || typeof html !== 'string') {
      return res.status(400).json({ error: "Invalid data types for email fields." });
    }

    // Basic RFC 5322 regex validation & header injection prevention
    const emailRegex = /^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/;
    const cleanTo = to.trim();
    if (!emailRegex.test(cleanTo) || cleanTo.length > 100) {
      return res.status(400).json({ error: "Invalid recipient email address format." });
    }

    if (subject.length > 200 || subject.includes('\r') || subject.includes('\n')) {
      return res.status(400).json({ error: "Subject is too long or contains invalid characters." });
    }

    if (html.length > 200000) {
      return res.status(400).json({ error: "Email body payload exceeds size limits." });
    }

    const resend = new Resend(resendApiKey);
    
    let fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!fromEmail || !fromEmail.includes("@") || fromEmail.startsWith("re_")) {
      fromEmail = "Business Creator <onboarding@resend.dev>";
    }
    
    console.log(`[Email API] Sending email to: ${cleanTo}, Subject: ${subject}`);
    const response = await resend.emails.send({
      from: fromEmail,
      to: [cleanTo],
      subject: subject,
      html: html,
    });

    if (response.error) {
      console.warn("[Email API] Resend email delivery skipped or failed:", response.error.message || response.error);
      return res.status(200).json({ 
        success: false, 
        warning: "RESEND_VALIDATION_ERROR",
        error: response.error.message || response.error 
      });
    }

    console.log("[Email API] Email sent successfully:", response.data);
    return res.status(200).json({ success: true, data: response.data });
  } catch (error: any) {
    console.warn("[Email API] Exception caught while sending email:", error?.message || error);
    return res.status(200).json({ success: false, error: error.message || "Failed to send email" });
  }
}

