import { supabase, isSupabaseConfigured } from './supabaseClient';
import { apiClient } from './apiClient';
import { User } from '../types';

export const authService = {
  async signup(email: string, password: string):Promise<{ user: User | null; session: unknown }> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      if (data.session) {
        apiClient.setToken(data.session.access_token);
      }
      return { user: data.user as unknown as User, session: data.session };
    } else {
      // Demo / Local development mode
      const mockToken = `dev-user-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
      apiClient.setToken(mockToken);
      localStorage.setItem('hlm_mock_email', email);
      return {
        user: { id: '00000000-0000-0000-0000-000000000001', email, created_at: new Date().toISOString() },
        session: { access_token: mockToken },
      };
    }
  },

  async login(email: string, password: string): Promise<{ user: User | null; session: unknown }> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.session) {
        apiClient.setToken(data.session.access_token);
      }
      return { user: data.user as unknown as User, session: data.session };
    } else {
      const mockToken = `dev-user-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
      apiClient.setToken(mockToken);
      localStorage.setItem('hlm_mock_email', email);
      return {
        user: { id: '00000000-0000-0000-0000-000000000001', email, created_at: new Date().toISOString() },
        session: { access_token: mockToken },
      };
    }
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    apiClient.setToken(null);
    localStorage.removeItem('hlm_mock_email');
    localStorage.removeItem('hlm_cached_profile');
  },

  async getSessionToken(): Promise<string | null> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    }
    return apiClient.getToken();
  },
};
