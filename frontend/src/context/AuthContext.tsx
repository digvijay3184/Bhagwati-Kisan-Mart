'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authStorage } from '../lib/api/storage';
import { authApi } from '../lib/api/auth';
import { UserRole } from '../lib/api/types';

interface AuthUser {
  id: string;
  phoneNumber: string;
  name: string | null;
  role: UserRole;
  isProfileComplete: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: (redirect?: string) => void;
  closeLoginModal: () => void;
  loginSuccess: (user: AuthUser) => void;
  logout: () => Promise<void>;
  revalidateSession: () => Promise<void>;
  redirectAfterLogin: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(null);

  const revalidateSession = async () => {
    try {
      const me = await authApi.getMe();
      const savedUser = authStorage.getUser();
      const updated: AuthUser = {
        id: me.id,
        phoneNumber: me.phoneNumber,
        name: me.name,
        role: me.role,
        isProfileComplete: savedUser?.isProfileComplete ?? false,
      };
      setUser(updated);
      localStorage.setItem('bkm_user', JSON.stringify(updated));
    } catch {
      authStorage.clear();
      setUser(null);
    }
  };

  useEffect(() => {
    const savedUser = authStorage.getUser();
    const token = authStorage.getAccessToken();

    if (savedUser && token) {
      setUser(savedUser);
      // Validate session in background
      revalidateSession().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const openLoginModal = (redirect?: string) => {
    if (redirect) setRedirectAfterLogin(redirect);
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setRedirectAfterLogin(null);
  };

  const loginSuccess = (newUser: AuthUser) => {
    setUser(newUser);
    closeLoginModal();
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        loginSuccess,
        logout,
        revalidateSession,
        redirectAfterLogin,
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
