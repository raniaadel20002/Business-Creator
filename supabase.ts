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

export async function runAiTask(type: string, payload: any, userId: string): Promise<any> {
  try {
    const response = await fetch('/api/ai-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream, application/json',
      },
      body: JSON.stringify({ type, payload, userId, stream: true }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `HTTP error! status: ${response.status}`);
    }

    let finalData: any = null;
    const contentType = response.headers.get('content-type') || '';

    // Handle Streaming / Server-Sent Events (SSE) to prevent Vercel idle connection drop
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
      // Standard JSON response
      finalData = await response.json();
    }

    if (!finalData || !finalData.success) {
      throw new Error(finalData?.error || "حدث خطأ أثناء معالجة الطلب بالذكاء الاصطناعي.");
    }

    const mockTaskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    taskCallbacks.forEach(cb => {
      try {
        cb(mockTaskId, { id: mockTaskId, status: 'completed', type, payload, result: finalData.result });
      } catch (e) {
        console.error("Error in task callback:", e);
      }
    });

    return finalData.result;
  } catch (error: any) {
    console.error("Error executing runAiTask over HTTP, attempting async fallback:", error);
    
    // Fallback: Check if Supabase connection is available to create an async DB task
    try {
      if (supabase && userId && userId !== 'anonymous') {
        const { data: dbTask, error: dbErr } = await supabase
          .from('ai_tasks')
          .insert({
            user_id: userId,
            task_type: type,
            payload: payload || {},
            status: 'pending'
          })
          .select()
          .single();

        if (!dbErr && dbTask) {
          console.log("[Supabase Task Queue] Created backup task:", dbTask.id);
        }
      }
    } catch (fbErr) {
      console.warn("[Async Fallback Error]", fbErr);
    }

    throw error;
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
