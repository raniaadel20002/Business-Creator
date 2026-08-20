import { supabase } from '../supabase';

export interface SystemErrorEvent {
  id?: string;
  timestamp: string;
  source: 'client' | 'api' | 'ai_engine';
  context: string;
  errorMessage: string;
  stackTrace?: string;
  userId?: string;
  userEmail?: string;
  metadata?: Record<string, any>;
}

const LOCAL_ERRORS_KEY = 'bc_system_telemetry_errors_v1';

export class ErrorTracker {
  private static recentErrors: SystemErrorEvent[] = [];

  public static initGlobalHandlers() {
    if (typeof window === 'undefined') return;

    // Unhandled JS Errors
    window.addEventListener('error', (event) => {
      this.captureError({
        source: 'client',
        context: 'window.onerror',
        errorMessage: event.message || 'Unknown runtime error',
        stackTrace: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
        metadata: {
          url: window.location.href,
          userAgent: navigator.userAgent
        }
      });
    });

    // Unhandled Promise Rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      this.captureError({
        source: 'client',
        context: 'unhandled_promise_rejection',
        errorMessage: reason?.message || String(reason) || 'Unhandled Promise rejection',
        stackTrace: reason?.stack || 'No stack available',
        metadata: {
          url: window.location.href,
        }
      });
    });

    console.log('[ErrorTracker] Global telemetry listener active.');
  }

  public static async captureError(errorData: {
    source: 'client' | 'api' | 'ai_engine';
    context: string;
    errorMessage: string;
    stackTrace?: string;
    userId?: string;
    userEmail?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const event: SystemErrorEvent = {
      id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...errorData
    };

    // 1. Buffer in memory
    this.recentErrors.unshift(event);
    if (this.recentErrors.length > 50) this.recentErrors.pop();

    // 2. Buffer in LocalStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = JSON.parse(localStorage.getItem(LOCAL_ERRORS_KEY) || '[]');
        const updated = [event, ...stored].slice(0, 50);
        localStorage.setItem(LOCAL_ERRORS_KEY, JSON.stringify(updated));
      }
    } catch (e) {}

    // 3. Log to console clearly
    console.error(`[TELEMETRY LOG] [${event.source.toUpperCase()}] [${event.context}]:`, event.errorMessage, event.metadata || '');

    // 4. Send to Supabase logs table silently for remote inspection
    try {
      if (supabase) {
        await supabase.from('logs').insert({
          user_id: event.userId || 'system',
          user_name: 'Telemetry Monitor',
          user_email: event.userEmail || 'telemetry@businesscreator.ai',
          action: `[ERROR] ${event.context}: ${event.errorMessage.slice(0, 150)}`,
          details: {
            source: event.source,
            context: event.context,
            errorMessage: event.errorMessage,
            stackTrace: event.stackTrace,
            metadata: event.metadata
          },
          timestamp: event.timestamp
        });
      }
    } catch (dbErr) {
      // Non-blocking telemetry
    }
  }

  public static getLocalErrors(): SystemErrorEvent[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return JSON.parse(localStorage.getItem(LOCAL_ERRORS_KEY) || '[]');
      }
    } catch (e) {}
    return this.recentErrors;
  }
}
