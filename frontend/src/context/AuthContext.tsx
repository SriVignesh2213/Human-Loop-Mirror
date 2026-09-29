import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserProfile } from '../types';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { apiClient } from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile> & { email?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      const fullUser = await profileService.getProfile();
      setUser(fullUser);
      setProfile(fullUser.profile || null);
    } catch (err) {
      console.warn('Could not fetch user profile:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await authService.getSessionToken();
        if (token) {
          apiClient.setToken(token);
          await refreshProfile();
        }
      } catch (err) {
        console.warn('Failed to restore authentication session:', err);
        apiClient.setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleSessionExpired = () => {
      setUser(null);
      setProfile(null);
    };

    window.addEventListener('auth:session_expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session_expired', handleSessionExpired);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authService.login(email, password);
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authService.signup(email, password);
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile> & { email?: string }) => {
    await profileService.updateProfile(updates);
    await refreshProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthenticated: Boolean(user || apiClient.getToken()),
        login,
        signup,
        logout,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
