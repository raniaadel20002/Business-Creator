import React, { useState } from 'react';
import { LogIn, BadgeCheck } from 'lucide-react';
import { signInWithGoogle } from '../supabase';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';
import Logo from './Logo';

const Login: React.FC<{ onLogin: () => void, message?: string }> = ({ onLogin, message }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // With OAuth redirect flow, the page will redirect. 
      // But if popup mode is used (signInWithOAuth returns session), handle here.
      // After redirect, onAuthStateChange in AuthContext handles the session.
      // For popup-like flow, we just call onLogin() after auth state updates.
      // The onAuthStateChange listener in AuthContext will set the user.
      // We call onLogin() here as a fallback for environments where redirect doesn't happen.
      onLogin();
    } catch (err: any) {
      console.error(err);
      setError("حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div className="max-w-md mx-auto bg-surface p-6 sm:p-8 rounded-2xl shadow-sm border border-border text-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-green-600">
          <LogIn className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary mb-2">أنت مسجل الدخول بالفعل</h2>
        <p className="text-text-muted text-xs sm:text-sm mb-4 sm:mb-6 flex items-center justify-center gap-1">مرحباً بك مجدداً، {user.user_metadata?.full_name || user.email || 'صديقنا'} <BadgeCheck size={16} className="text-primary" /></p>
        <button 
          onClick={onLogin}
          className="w-full bg-primary text-white py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base hover:bg-orange-700 transition-colors"
        >
          {message ? 'متابعة إنشاء المشروع' : 'الذهاب إلى لوحة التحكم'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="text-center mb-6 sm:mb-8">
        <div className="flex justify-center mb-3 sm:mb-4">
          <Logo className="w-16 h-16 sm:w-20 sm:h-20" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">تسجيل الدخول</h2>
        <p className="text-gray-500 text-xs sm:text-sm mt-1.5 sm:mt-2 px-1">
          {message || 'مرحباً بك! قم بتسجيل الدخول لنبدأ في تصميم مشروع على مقاسك.'}
        </p>
      </div>

      {message && (
        <div className="mb-4 sm:mb-6 bg-primary/10 text-orange-700 p-3 sm:p-4 rounded-xl text-xs sm:text-sm text-center font-bold border border-orange-100">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 sm:mb-6 bg-red-50 text-red-600 p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm text-center font-medium">
          {error}
        </div>
      )}

      <button 
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-white border-2 border-border text-text-secondary py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm md:text-base hover:bg-background hover:border-orange-600 hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول باستخدام جوجل'}
      </button>
    </div>
  );
};

export default Login;
