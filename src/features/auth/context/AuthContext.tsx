import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../../services/supabase';
import { UserProfile } from '../../../types/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch & upsert profile from Supabase
  const fetchOrCreateProfile = async (currentUser: User) => {
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', fetchError);
        setLoading(false);
        return;
      }

      if (!existingProfile) {
        // Create new profile — use snake_case keys for Supabase
        const newProfileDb = {
          id: currentUser.id,
          email: currentUser.email || '',
          display_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '',
          photo_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || '',
          subscription_plan: 'FREE',
          tokens: 0,
          daily_generations: 0,
          last_generation_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        const { data: inserted, error: insertError } = await supabase
          .from('users')
          .insert(newProfileDb)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user profile:', insertError);
        } else {
          setProfile(mapDbToProfile(inserted));
        }
      } else {
        // Migrate missing fields
        const updates: any = {};
        // Note: 'uid' is not a DB column — 'id' is the PK, no migration needed for it
        if (!existingProfile.email) updates.email = currentUser.email || '';
        if (!existingProfile.display_name && currentUser.user_metadata?.full_name) {
          updates.display_name = currentUser.user_metadata.full_name;
        }
        if (!existingProfile.photo_url && currentUser.user_metadata?.avatar_url) {
          updates.photo_url = currentUser.user_metadata.avatar_url;
        }
        if (!existingProfile.subscription_plan) updates.subscription_plan = 'FREE';
        if (existingProfile.tokens === undefined || existingProfile.tokens === null) updates.tokens = 0;
        if (existingProfile.daily_generations === undefined) updates.daily_generations = 0;
        if (!existingProfile.last_generation_date) updates.last_generation_date = new Date().toISOString();

        if (Object.keys(updates).length > 0) {
          await supabase.from('users').update(updates).eq('id', currentUser.id);
          const { data: updated } = await supabase.from('users').select('*').eq('id', currentUser.id).single();
          setProfile(mapDbToProfile(updated));
        } else {
          setProfile(mapDbToProfile(existingProfile));
        }
      }
    } catch (err) {
      console.error('Error in fetchOrCreateProfile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        setLoading(true);
        await fetchOrCreateProfile(currentUser);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Load initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchOrCreateProfile(currentUser);
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    // Optimistic update
    setProfile(prev => prev ? { ...prev, ...data } as UserProfile : null);

    const dbData = mapProfileToDb(data);
    dbData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('users')
      .update(dbData)
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        dbData: JSON.stringify(dbData).substring(0, 500)
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// ---- Mapping helpers: DB (snake_case) <-> App (camelCase) ----

function mapDbToProfile(row: any): UserProfile {
  return {
    uid: row.id || row.uid,
    email: row.email,
    displayName: row.display_name || '',
    photoURL: row.photo_url || '',
    subscriptionPlan: row.subscription_plan || 'FREE',
    tokens: row.tokens ?? 0,
    dailyGenerations: row.daily_generations ?? 0,
    lastGenerationDate: row.last_generation_date || new Date().toISOString(),
    createdAt: row.created_at,
    userData: row.user_data || null,
    formStatus: row.form_status,
    banned: row.banned || false,
  };
}

function mapProfileToDb(profile: Partial<UserProfile>): any {
  const result: any = {};
  if (profile.email !== undefined) result.email = profile.email;
  if (profile.displayName !== undefined) result.display_name = profile.displayName;
  if (profile.photoURL !== undefined) result.photo_url = profile.photoURL;
  if (profile.subscriptionPlan !== undefined) result.subscription_plan = profile.subscriptionPlan;
  if (profile.tokens !== undefined) result.tokens = profile.tokens;
  if (profile.dailyGenerations !== undefined) result.daily_generations = profile.dailyGenerations;
  if (profile.lastGenerationDate !== undefined) result.last_generation_date = profile.lastGenerationDate;
  if (profile.userData !== undefined) result.user_data = profile.userData;
  if (profile.formStatus !== undefined) result.form_status = profile.formStatus;
  if ((profile as any).lastFormUpdateAt !== undefined) result.last_form_update_at = (profile as any).lastFormUpdateAt;
  if ((profile as any).reminderEmailSent !== undefined) result.reminder_email_sent = (profile as any).reminderEmailSent;
  if ((profile as any).reminderEmailSentAt !== undefined) result.reminder_email_sent_at = (profile as any).reminderEmailSentAt;
  return result;
}
