import express from "express";
import cors from "cors";
import { Resend } from "resend";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load environment variables immediately in Node.js
try {
  if (typeof (process as any).loadEnvFile === "function") {
    (process as any).loadEnvFile();
  }
} catch (e) {
  // If .env file exists, parse manually as fallback
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}

// Normalize Gemini key if needed
if (!process.env.GEMINI_API_KEY && process.env.geminiApiKey) {
  process.env.GEMINI_API_KEY = process.env.geminiApiKey;
}
if (!process.env.VITE_GEMINI_API_KEY && process.env.GEMINI_API_KEY) {
  process.env.VITE_GEMINI_API_KEY = process.env.GEMINI_API_KEY;
}

import { AiBusinessService } from "./services/geminiService.js";
import { LogoService } from "./services/logoService.js";
import sendEmailHandler from "./api/send-email.js";
import paymobCheckoutHandler from "./api/paymob-checkout.js";
import paymobWebhookHandler from "./api/paymob-webhook.js";
import aiTaskHandler from "./api/ai-task.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let supabaseAdminClient: any = null;

function getSupabaseAdmin() {
  if (supabaseAdminClient) return supabaseAdminClient;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars not set.");
  }
  supabaseAdminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return supabaseAdminClient;
}

async function sendIncompleteFormReminderEmailOnServer(to: string, userName: string, gender: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("[Reminder Worker] RESEND_API_KEY is not set.");
    return;
  }

  try {
    const resend = new Resend(resendApiKey);
    let fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!fromEmail || !fromEmail.includes("@") || fromEmail.startsWith("re_")) {
      fromEmail = "Business Creator <onboarding@resend.dev>";
    }

    const greeting = gender === "female" ? "عزيزتي رائدة الأعمال المستقبلية" : "عزيزي رائد الأعمال المستقبلي";
    const appUrl = process.env.APP_URL || "https://businesscreator.app";
    // Target the Wizard form at step 1 directly
    const targetUrl = `${appUrl}?view=form&step=1`;

    const subject = "أنت على بُعد خطوات بسيطة من تحقيق حلمك الريادي.. نحن نؤمن بك ✨";
    const html = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 16px; background-color: #ffffff; text-align: right;">
        <div style="text-align: center; margin-bottom: 25px;">
          <img src="https://businesscreator.app/logoo.png" alt="Business Creator Logo" style="width: 80px; height: 80px; object-fit: contain;" />
        </div>
        
        <h2 style="color: #ea580c; font-size: 20px; font-weight: 800; margin: 0 0 20px 0;">أهلاً بك يا ${userName || "رائد أعمال الغد"}، 👋</h2>
        
        <p style="font-size: 16px; color: #334155; line-height: 1.85; margin: 0 0 15px 0;">
          لقد لاحظنا أنك بدأت في اتخاذ أول وأهم خطوة نحو مستقبلك الاستثماري، وشاركتنا جزءاً من طموحك وشغفك في استبيان <strong>Business Creator AI</strong>.
        </p>
        
        <p style="font-size: 16px; color: #334155; line-height: 1.85; margin: 0 0 15px 0;">
          هل تعلم أن الفارق الوحيد بين الحلم والواقع هو الشجاعة على الاستمرار وإكمال ما بدأته؟ أنت الآن على بعد خطوات معدودة لتصبح صاحب مشروع حقيقي يملك دراسة جدوى متكاملة، خطة مالية دقيقة، وتحليل سوقي مخصص لقدراتك الحالية.
        </p>
        
        <div style="background-color: #fff7ed; border-right: 4px solid #ea580c; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="font-size: 16px; color: #ea580c; font-weight: 700; margin: 0; font-style: italic;">
            "كل فكرة عظيمة كانت تبدو مستحيلة حتى تم اتخاذ الخطوة التالية."
          </p>
        </div>
        
        <p style="font-size: 16px; color: #334155; line-height: 1.85; margin: 0 0 25px 0;">
          أنت تستحق أن ترى فكرتك النور، ونحن هنا لنكون رفيقك المخلص والمستشار الذكي الذي يساندك في كل مرحلة. العودة إلى استبيانك واستكماله لن يستغرق منك سوى دقيقتين، لكنه قد يكون البداية لمشروع يغير مجرى حياتك بالكامل.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${targetUrl}" target="_blank" style="background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 14px 35px; font-size: 16px; font-weight: bold; border-radius: 12px; display: inline-block; box-shadow: 0 4px 15px rgba(234, 88, 12, 0.25); transition: all 0.2s ease;">
            إكمال بناء هويتك الاستثمارية الآن 🚀
          </a>
        </div>
        
        <p style="font-size: 14px; color: #64748b; margin-top: 25px; line-height: 1.6;">
          بالضغط على الزر، ستعود مباشرة إلى صفحة <strong>"من أنت؟ (البيانات الشخصية)"</strong> لإكمال بناء الهوية الأساسية لمشروعك والانطلاق فوراً. نحن بانتظارك!
        </p>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
        
        <div style="text-align: center; font-size: 12px; color: #94a3b8;">
          &copy; ${new Date().getFullYear()} Business Creator AI. جميع الحقوق محفوظة.<br />
          إذا كانت لديك أي استفسارات، يسعدنا دائماً تواصلك معنا.
        </div>
      </div>
    `;

    console.log(`[Reminder Worker] Sending email via Resend to ${to}...`);
    const response = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: subject,
      html: html,
    });

    if (response.error) {
      if (response.error.message?.includes("only send testing emails")) {
        console.log("[Reminder Worker] Resend in testing mode - email delivery restricted to account owner:", to);
      } else {
        console.warn("[Reminder Worker] Resend email delivery warning:", response.error?.message || response.error);
      }
    } else {
      console.log("[Reminder Worker] Email sent successfully to:", to);
    }
  } catch (error: any) {
    console.warn("[Reminder Worker] Exception sending email:", error?.message || error);
  }
}

async function startReminderEmailWorker(supabase: any) {
  console.log("[Reminder Worker] Starting background incomplete form reminder worker (Supabase)...");
  
  // Check every 15 minutes
  setInterval(async () => {
    try {
      console.log("[Reminder Worker] Checking for incomplete forms...");
      
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, display_name, user_data, last_form_update_at, form_status, reminder_email_sent')
        .eq('form_status', 'started')
        .not('reminder_email_sent', 'eq', true);

      if (error) {
        console.warn("[Reminder Worker] Supabase query error:", error.message);
        return;
      }

      const now = Date.now();
      const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

      for (const userData of (users || [])) {
        const lastFormUpdateAt = userData.last_form_update_at;
        if (lastFormUpdateAt) {
          const updateTime = new Date(lastFormUpdateAt).getTime();
          if (now - updateTime >= FIVE_HOURS_MS) {
            const email = userData.email;
            const displayName = userData.display_name || userData.user_data?.fullName || "";
            const gender = userData.user_data?.gender || "";

            if (email && email.includes("@")) {
              await sendIncompleteFormReminderEmailOnServer(email, displayName, gender);
              
              await supabase.from('users').update({
                reminder_email_sent: true,
                reminder_email_sent_at: new Date().toISOString()
              }).eq('id', userData.id);
              console.log(`[Reminder Worker] Successfully marked reminderEmailSent for ${email}`);
            }
          }
        }
      }
    } catch (err: any) {
      console.warn("[Reminder Worker] Exception during check interval:", err?.message || err);
    }
  }, 15 * 60 * 1000);
}

import rateLimit from "express-rate-limit";

// Rate limiters for security and abuse prevention
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'تم تجاوز الحد المسموح به من الطلبات مؤقتاً. يرجى المحاولة لاحقاً.' }
});

const emailApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'تم تجاوز الحد المسموح به لإرسال الرسائل. يرجى المحاولة بعد قليل.' }
});

const aiTaskLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'تم تجاوز معدل طلبات الذكاء الاصطناعي في الدقيقة. يرجى الانتظار قليلاً.' }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use("/api/", generalApiLimiter);

  // API Routes mapping for local development
  app.post("/api/send-email", emailApiLimiter, async (req, res) => {
    await sendEmailHandler(req, res);
  });

  app.post("/api/paymob-checkout", async (req, res) => {
    await paymobCheckoutHandler(req, res);
  });

  app.post("/api/paymob-webhook", async (req, res) => {
    await paymobWebhookHandler(req, res);
  });

  // Unified, high-performance in-memory AI task executor with streaming support
  app.post("/api/ai-task", aiTaskLimiter, async (req, res) => {
    await aiTaskHandler(req, res);
  });

  // Start background reminder email worker
  try {
    const supabase = getSupabaseAdmin();
    await startReminderEmailWorker(supabase);
  } catch (err) {
    console.error("[Server] Failed to start reminder email worker:", err);
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
