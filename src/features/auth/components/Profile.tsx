import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { User, Settings, LogOut, Save, Sparkles, Edit3, BadgeCheck, Zap } from 'lucide-react';
import { logOut } from '../supabase';
import { getDailyGenerationStatus } from '../../../types/types';
import { InsufficientTokensCard } from '../../../../components/InsufficientTokensCard';

interface ProfileProps {
  onLogout: () => void;
  onGenerateIdea: () => void;
  onEditIdea: () => void;
  onViewPricing?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onLogout, onGenerateIdea, onEditIdea, onViewPricing }) => {
  const { user, profile, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showGeneratePrompt, setShowGeneratePrompt] = useState(false);
  const [showLimitCard, setShowLimitCard] = useState(false);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTicker(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dailyStatus = getDailyGenerationStatus(profile);

  if (!user || !profile) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">يرجى تسجيل الدخول لعرض حسابك.</p>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        displayName: formData.displayName,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoutClick = async () => {
    await logOut();
    onLogout();
  };

  return (
    <div className="w-full space-y-4 sm:space-y-8">
      <div className="bg-surface p-4 sm:p-8 rounded-2xl shadow-soft border border-border flex flex-col md:flex-row items-center gap-3 sm:gap-6">
        <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden shrink-0">
          {(profile.photoURL || user.user_metadata?.avatar_url) ? (
            <img src={profile.photoURL || user.user_metadata?.avatar_url} alt={profile.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <User className="text-primary w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12" />
          )}
        </div>
        <div className="flex-1 text-center md:text-right w-full">
          <h2 className="text-base sm:text-xl md:text-2xl font-bold text-text-primary flex items-center gap-1.5 justify-center md:justify-start">
            {profile.displayName || 'مستخدم جديد'}
            <BadgeCheck className="text-primary w-4 h-4 sm:w-6 sm:h-6" />
          </h2>
          <p className="text-text-secondary text-[11px] sm:text-sm">{profile.email}</p>
          <div className="mt-1.5 sm:mt-2 flex gap-1.5 sm:gap-2 flex-wrap justify-center md:justify-start" dir="rtl">
            <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-black uppercase tracking-widest ${
              profile.subscriptionPlan === 'PRO' ? 'bg-primary/10 text-primary border border-primary/20' :
              'bg-orange-100 text-orange-700 border border-orange-200'
            }`}>
              خطة {profile.subscriptionPlan === 'PRO' ? 'رائد الأعمال' : 'البداية'}
            </span>
            {profile.subscriptionPlan === 'PRO' && (
              <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-black uppercase tracking-widest bg-green-100 text-green-700 border border-green-200">
                 الرصيد: {(profile.tokens || 0).toLocaleString()} نقطة
              </span>
            )}
            {profile.subscriptionPlan === 'FREE' && (() => {
              const { currentCount, formattedTimeLeft } = getDailyGenerationStatus(profile);
              return (
                <div className="flex flex-col items-center md:items-start gap-1">
                  <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-black uppercase tracking-widest bg-orange-100 text-orange-700 border border-orange-200">
                     الاستخدام اليومي: {currentCount} / 1 مشروع
                  </span>
                  {currentCount >= 1 && formattedTimeLeft && (
                    <span className="text-[9px] sm:text-[10px] font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      ⏱️ تتجدد الفرصة بعد: {formattedTimeLeft}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-wrap justify-center md:justify-end w-full md:w-auto mt-1 sm:mt-0">
          {onViewPricing && (!profile.subscriptionPlan || profile.subscriptionPlan === 'FREE') && (
            <button 
              onClick={onViewPricing}
              className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-all font-bold text-xs sm:text-sm shadow-soft shadow-primary/20 cursor-pointer active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-current" />
              ترقية
            </button>
          )}
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-background text-text-secondary rounded-xl hover:bg-gray-100 transition-colors font-medium text-xs sm:text-sm border border-border cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            تعديل
          </button>
          <button 
            onClick={handleLogoutClick}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium text-xs sm:text-sm cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            خروج
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="bg-surface p-4 sm:p-8 rounded-2xl shadow-soft border border-border space-y-4 sm:space-y-6">
          <h3 className="text-base sm:text-xl font-bold text-text-primary border-b border-border pb-3 sm:pb-4">تعديل البيانات الشخصية</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1.5 sm:mb-2">الاسم</label>
              <input 
                type="text" 
                value={formData.displayName}
                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                className="w-full px-3.5 py-2 sm:px-4 sm:py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-background text-text-primary text-xs sm:text-base"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-1.5 sm:px-6 sm:py-2 text-text-secondary hover:bg-background rounded-xl transition-colors font-medium text-xs sm:text-base"
            >
              إلغاء
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 sm:px-6 sm:py-2 bg-primary text-white rounded-xl hover:bg-orange-600 transition-colors font-bold disabled:opacity-50 shadow-soft shadow-primary/20 text-xs sm:text-base"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface p-4 sm:p-8 rounded-2xl shadow-soft border border-border space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border pb-3 sm:pb-4">
            <h3 className="text-base sm:text-xl font-bold text-text-primary">المعلومات الشخصية</h3>
            {profile.userData && (
              <div className="relative w-full sm:w-auto">
                <button 
                  onClick={() => setShowGeneratePrompt(!showGeneratePrompt)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-6 sm:py-2 bg-primary text-white rounded-xl hover:bg-orange-600 transition-all font-bold text-xs sm:text-sm shadow-soft shadow-primary/20 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                  <span>إنشاء فكرة بهذه المعلومات</span>
                </button>
                
                {showGeneratePrompt && (
                  <div className="absolute top-full left-0 mt-2 w-full sm:w-72 bg-surface rounded-xl shadow-soft-lg border border-border p-3 sm:p-4 z-10 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs sm:text-sm text-text-secondary font-medium mb-3 text-center">تحب تعدل على المعلومات ولا ننشئ على طول؟</p>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => { 
                          setShowGeneratePrompt(false); 
                          if (dailyStatus.hasReachedLimit) {
                            setShowLimitCard(true);
                          } else {
                            onGenerateIdea(); 
                          }
                        }}
                        className="w-full py-1.5 sm:py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-bold text-xs sm:text-sm cursor-pointer"
                      >
                        أنشئ على طول
                      </button>
                      <button 
                        onClick={() => { setShowGeneratePrompt(false); onEditIdea(); }}
                        className="w-full py-1.5 sm:py-2 bg-background text-text-secondary rounded-lg hover:bg-gray-100 transition-colors font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-border cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        تعديل المعلومات أولاً
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {showLimitCard && (
            <div className="pt-1">
              <InsufficientTokensCard
                title="Business Creator"
                badgeText="تنبيه الحد اليومي للمشاريع"
                message="عفواً، لقد وصلت للحد الأقصى لإنشاء المشاريع اليوم (مشروع واحد كل 24 ساعة)."
                description={`تتجدد فرصتك المجانية تلقائياً بعد ${dailyStatus.formattedTimeLeft || '24 ساعة'}. أو قم بالترقية الآن لاقتناء باقة رائد الأعمال (PRO) والحصول على 100,000 نقطة للتوليد الفوري دون انتظار.`}
                onUpgrade={onViewPricing}
                className="my-2"
              />
            </div>
          )}
          
          {profile.userData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              <div>
                <p className="text-xs sm:text-sm text-text-muted mb-0.5 sm:mb-1">الاسم الكامل</p>
                <p className="text-xs sm:text-base font-medium text-text-primary">{profile.userData.fullName || 'غير محدد'}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-text-muted mb-0.5 sm:mb-1">السن</p>
                <p className="text-xs sm:text-base font-medium text-text-primary">{profile.userData.age || 'غير محدد'}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-text-muted mb-0.5 sm:mb-1">المحافظة</p>
                <p className="text-xs sm:text-base font-medium text-text-primary">{profile.userData.city || 'غير محدد'}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-text-muted mb-0.5 sm:mb-1">المستوى التعليمي</p>
                <p className="text-xs sm:text-base font-medium text-text-primary">{profile.userData.educationLevel || 'غير محدد'}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-text-muted mb-0.5 sm:mb-1">رأس المال المتوفر</p>
                <p className="text-xs sm:text-base font-medium text-text-primary">{profile.userData.availableCapital || 'غير محدد'}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-text-muted mb-0.5 sm:mb-1">المهارات الأساسية</p>
                <p className="text-xs sm:text-base font-medium text-text-primary">{profile.userData.basicSkills || 'غير محدد'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs sm:text-sm text-text-muted mb-0.5 sm:mb-1">الحلم الأكبر</p>
                <p className="text-xs sm:text-base font-medium text-text-primary bg-background p-2.5 sm:p-3 rounded-lg border border-border">{profile.userData.ultimateDream || 'غير محدد'}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <p className="text-xs sm:text-sm text-text-secondary mb-3 sm:mb-4">لم تقم بإكمال الاستبيان بعد.</p>
              <button 
                onClick={onEditIdea}
                className="px-5 py-2 bg-primary text-white rounded-xl hover:bg-orange-600 transition-colors font-bold text-xs sm:text-sm shadow-soft shadow-primary/20"
              >
                ابدأ الاستبيان الآن
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
