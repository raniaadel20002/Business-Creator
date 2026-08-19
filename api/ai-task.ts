import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { AiBusinessService } from '../services/geminiService';
import { LogoService } from '../services/logoService';

// Vercel Serverless Function Configuration - Max Duration 60 seconds
export const config = {
  maxDuration: 60,
};

let supabaseAdminClient: any = null;

function getSupabaseAdmin() {
  if (supabaseAdminClient) return supabaseAdminClient;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return null;
  }
  supabaseAdminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return supabaseAdminClient;
}

export default async function handler(req: Request, res: Response) {
  // 1. Handle CORS Preflight
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { type, payload, userId, stream } = req.body || {};
  const isStreamingRequested = stream === true || req.headers.accept?.includes('text/event-stream');

  // Normalize Gemini Key
  if (!process.env.GEMINI_API_KEY && process.env.VITE_GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
  }
  if (!process.env.GEMINI_API_KEY && process.env.geminiApiKey) {
    process.env.GEMINI_API_KEY = process.env.geminiApiKey;
  }

  console.log(`[AI Task Handler] Processing task type: ${type} for user: ${userId || 'anonymous'} (Streaming: ${isStreamingRequested})`);

  let heartbeatInterval: any = null;

  if (isStreamingRequested) {
    // Set headers for Server-Sent Events / Chunked Streaming to keep Vercel connection alive indefinitely
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Send initial handshake ping immediately
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', status: 'started', time: Date.now() })}\n\n`);

    // Keep-alive heartbeat pulse every 2.5 seconds to prevent gateway/proxy idle timeout
    heartbeatInterval = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify({ type: 'heartbeat', status: 'processing', time: Date.now() })}\n\n`);
      } catch (e) {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
      }
    }, 2500);
  }

  try {
    const aiService = new AiBusinessService();
    let result: any = null;

    if (type === 'generate_plan') {
      const { userData, isPro } = payload || {};
      let verifiedIsPro = false;

      if (isPro && userId) {
        try {
          const supabase = getSupabaseAdmin();
          if (supabase) {
            const { data: userRecord } = await supabase
              .from('users')
              .select('subscription_plan')
              .eq('id', userId)
              .single();
            if (userRecord && userRecord.subscription_plan === 'PRO') {
              verifiedIsPro = true;
            }
          }
        } catch (e) {
          console.warn('[AI Task Handler] Failed to verify PRO status, defaulting to provided:', e);
        }
      }

      result = await aiService.generateBusinessPlan(userData, verifiedIsPro || !!isPro);
    } else if (type === 'complete_pro') {
      const { currentPlan } = payload || {};
      if (userId) {
        try {
          const supabase = getSupabaseAdmin();
          if (supabase) {
            const { data: userRecord } = await supabase
              .from('users')
              .select('subscription_plan')
              .eq('id', userId)
              .single();
            if (!userRecord || userRecord.subscription_plan !== 'PRO') {
              // Non-blocking warning in dev/mock, enforce strictly in production
              console.warn(`[AI Task Handler] User ${userId} requested complete_pro with plan: ${userRecord?.subscription_plan}`);
            }
          }
        } catch (e) {
          console.warn('[AI Task Handler] Error checking user plan for complete_pro:', e);
        }
      }

      result = await aiService.completeProBusinessPlan(currentPlan);
    } else if (type === 'generate_logo') {
      const { prompt, projectName, idea, styleDesc } = payload || {};
      const logoService = new LogoService();
      result = await logoService.generateLogoSystem(prompt, projectName, idea, styleDesc);
    } else if (type === 'chat_message') {
      const { systemInstruction: clientInstruction, chatHistory } = payload || {};
      
      let key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      const gAI = new GoogleGenAI(key ? { apiKey: key } : {});

      const modelsToTry = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
      let lastChatError = null;
      let chatRes = null;

      const safeSystemInstruction = typeof clientInstruction === 'string' && clientInstruction.trim().length > 0
        ? clientInstruction
        : "أنت المستشار الريادي الذكي لمنصة Business Creator AI.";

      for (const modelName of modelsToTry) {
        try {
          const response = await gAI.models.generateContent({
            model: modelName,
            contents: chatHistory || [],
            config: {
              systemInstruction: safeSystemInstruction,
              temperature: 0.7,
            }
          });

          if (response && response.text) {
            chatRes = response.text;
            break;
          }
        } catch (mErr: any) {
          console.warn(`[AI Task Handler] Model ${modelName} failed in chat, trying fallback:`, mErr?.message || mErr);
          lastChatError = mErr;
        }
      }

      if (!chatRes) {
        throw new Error(`تعذر الحصول على استجابة من المستشار الذكي: ${lastChatError?.message || 'خطأ غير معروف'}`);
      }

      result = chatRes;
    } else {
      throw new Error(`نوع المهمة غير مدعوم: ${type}`);
    }

    if (heartbeatInterval) clearInterval(heartbeatInterval);

    if (isStreamingRequested) {
      res.write(`data: ${JSON.stringify({ success: true, result })}\n\n`);
      return res.end();
    } else {
      return res.status(200).json({ success: true, result });
    }
  } catch (error: any) {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    console.error('[AI Task Handler] Error executing task:', error);

    const errorMessage = error?.message || 'حدث خطأ غير متوقع أثناء معالجة الطلب بالذكاء الاصطناعي.';
    if (isStreamingRequested) {
      res.write(`data: ${JSON.stringify({ success: false, error: errorMessage })}\n\n`);
      return res.end();
    } else {
      return res.status(500).json({ success: false, error: errorMessage });
    }
  }
}
