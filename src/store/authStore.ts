import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '../types/types';

interface AuthStore {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  // Primitive setters — called by AuthProvider during the Supabase auth lifecycle
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  // Optimistic local update used by updateProfile in AuthContext
  updateProfileLocally: (data: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  updateProfileLocally: (data) =>
    set((state) => ({
      profile: state.profile ? ({ ...state.profile, ...data } as UserProfile) : null,
    })),
}));
