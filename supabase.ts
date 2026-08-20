import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---- Auth helpers ----

export const signInWithGoogle = async () => {
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });
  if (error) throw error;
  return data;
};

export const logOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// ---- Task system (kept identical — HTTP based, no Firebase dependency) ----

export const processedTaskIds = new Set<string>();

type TaskCallback = (taskId: string, taskData: any) => void;
const taskCallbacks = new Set<TaskCallback>();

export function subscribeToTaskCompletions(callback: TaskCallback) {
  taskCallbacks.add(callback);
  return () => {
    taskCallbacks.delete(callback);
  };
}

function notifyTaskSuccess(type: string, payload: any, result: any) {
  const mockTaskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  taskCallbacks.forEach(cb => {
    try {
      cb(mockTaskId, { id: mockTaskId, status: 'completed', type, payload, result });
    } catch (e) {}
  });
  return result;
}

export async function runAiTask(type: string, payload: any, userId: string): Promise<any> {
  // 1. Attempt 1: Serverless API endpoint
  try {
    const response = await fetch('/api/ai-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, payload, userId, stream: false }),
    });

    if (response.ok) {
      let finalData: any = null;
      const contentType = response.headers.get('content-type') || '';

      // Handle Streaming / Server-Sent Events (SSE) if returned
      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              try {
                const jsonStr = trimmed.slice(5).trim();
                if (jsonStr) {
                  const parsed = JSON.parse(jsonStr);
                  if (parsed.success !== undefined) {
                    finalData = parsed;
                  }
                }
              } catch (pErr) {
                console.warn('[Stream Parser Warning]', pErr);
              }
            }
          }
        }

        if (buffer.trim().startsWith('data:')) {
          try {
            const parsed = JSON.parse(buffer.trim().slice(5).trim());
            if (parsed.success !== undefined) finalData = parsed;
          } catch {}
        }
      } else {
        finalData = await response.json();
      }

      if (finalData && finalData.success && finalData.result) {
        return notifyTaskSuccess(type, payload, finalData.result);
      }
    }
  } catch (apiErr) {
    console.warn("[runAiTask] Serverless endpoint unavailable or errored, falling back to direct client execution:", apiErr);
  }

  // 2. Attempt 2: Direct Client Execution Fallback (Zero-Failure Architecture)
  console.log(`[runAiTask] Executing ${type} directly via resilient client engine...`);
  try {
    let result: any = null;

    if (type === 'generate_plan') {
      const { AiBusinessService } = await import('./services/geminiService');
      const service = new AiBusinessService();
      result = await service.generateBusinessPlan(payload.userData, payload.isPro);
    } else if (type === 'complete_pro') {
      const { AiBusinessService } = await import('./services/geminiService');
      const service = new AiBusinessService();
      result = await service.completeProBusinessPlan(payload.currentPlan);
    } else if (type === 'generate_logo') {
      const { LogoService } = await import('./services/logoService');
      const logoService = new LogoService();
      result = await logoService.generateLogoSystem(payload.prompt, payload.projectName, payload.idea, payload.styleDesc);
    } else if (type === 'chat_message') {
      const { GoogleGenAI } = await import('@google/genai');
      let key = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;
      if (!key && typeof process !== 'undefined' && process.env) {
        key = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || (process.env as any).geminiApiKey;
      }
      const gAI = new GoogleGenAI(key ? { apiKey: key } : {});
      const modelsToTry = ["gemini-3.5-flash", "gemini-3.7-flash", "gemini-flash-latest", "gemini-flash-lite-latest", "gemini-3.1-flash-lite", "gemini-2.5-flash"];
      let chatRes: string | null = null;
      let lastErr: any = null;

      for (const modelName of modelsToTry) {
        try {
          const resp = await gAI.models.generateContent({
            model: modelName,
            contents: payload.chatHistory || [],
            config: {
              systemInstruction: payload.systemInstruction || "أنت المرشد الريادي الذكي لمنصة Business Creator AI.",
              temperature: 0.7,
            }
          });
          if (resp && resp.text) {
            chatRes = resp.text;
            break;
          }
        } catch (err) {
          lastErr = err;
        }
      }

      if (!chatRes) throw lastErr || new Error("Chat model generation failed.");
      result = chatRes;
    }

    if (result) {
      return notifyTaskSuccess(type, payload, result);
    }
    throw new Error("لم يتم إرجاع أي نتيجة من محرك الذكاء الاصطناعي.");
  } catch (directErr: any) {
    console.error("[runAiTask] Direct execution failed, recording async backup task:", directErr);
    
    // Telemetry capture
    try {
      const { ErrorTracker } = await import('./services/errorTracker');
      ErrorTracker.captureError({
        source: 'ai_engine',
        context: `runAiTask:${type}`,
        errorMessage: directErr?.message || String(directErr),
        stackTrace: directErr?.stack,
        userId: userId || 'anonymous',
        metadata: {
          taskType: type,
          payloadSummary: typeof payload === 'object' ? Object.keys(payload || {}) : typeof payload
        }
      });
    } catch (tErr) {}

    // Attempt 3: Record backup task in Supabase DB
    try {
      if (supabase && userId && userId !== 'anonymous') {
        await supabase.from('ai_tasks').insert({
          user_id: userId,
          task_type: type,
          payload: payload || {},
          status: 'pending'
        });
      }
    } catch (fbErr) {}

    throw directErr;
  }
}

// ---- Supabase Error Handler ----
export const handleSupabaseError = (error: unknown, operationType: string, path: string | null) => {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error('Supabase Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};
