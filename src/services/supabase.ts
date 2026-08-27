import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
if (typeof globalThis !== 'undefined') {
  (globalThis as any).__bc_supabase = supabase;
}

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
  // SECURITY: All AI operations MUST go through the server-side API endpoint
  // Client-side execution has been removed to prevent API key exposure
  
  try {
    const response = await fetch('/api/ai-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, payload, userId, stream: false }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'فشلت عملية الذكاء الاصطناعي' }));
      throw new Error(errorData.error || `خطأ HTTP ${response.status}`);
    }

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
    
    throw new Error(finalData?.error || 'لم يتم إرجاع نتيجة من الخادم');
    
  } catch (error: any) {
    console.error('[runAiTask] API call failed:', error);
    
    // Telemetry capture
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).__bc_errorTracker) {
        (globalThis as any).__bc_errorTracker.captureError({
          source: 'ai_engine',
          context: `runAiTask:${type}`,
          errorMessage: error?.message || String(error),
          stackTrace: error?.stack,
          userId: userId || 'anonymous',
          metadata: {
            taskType: type,
            payloadSummary: typeof payload === 'object' ? Object.keys(payload || {}) : typeof payload
          }
        });
      } else if (supabase) {
        await supabase.from('logs').insert({
          user_id: userId || 'anonymous',
          user_name: 'Telemetry Monitor',
          user_email: 'telemetry@businesscreator.ai',
          action: `[ERROR] runAiTask:${type}: ${(error?.message || String(error)).slice(0, 150)}`,
          details: {
            source: 'ai_engine',
            context: `runAiTask:${type}`,
            errorMessage: error?.message || String(error),
            stackTrace: error?.stack
          },
          timestamp: new Date().toISOString()
        });
      }
    } catch (tErr) {}

    // Try to queue as backup task in database for async processing
    try {
      if (supabase && userId && userId !== 'anonymous') {
        await supabase.from('ai_tasks').insert({
          user_id: userId,
          task_type: type,
          payload: payload || {},
          status: 'pending'
        });
        console.log('[runAiTask] Task queued in database for background processing');
      }
    } catch (queueErr) {
      console.warn('[runAiTask] Failed to queue task:', queueErr);
    }

    throw new Error(error?.message || 'فشلت عملية الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.');
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
