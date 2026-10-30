import React, { createContext, useContext, useState } from 'react';
import type { UserProfile, UserRole } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Demo / Initial authenticated user so app works immediately
  const [user, setUser] = useState<UserProfile | null>({
    id: 'demo-admin-uuid',
    display_name: 'Ward 81 Election Officer',
    role: 'admin',
    active: true,
    created_at: new Date().toISOString()
  });

  const login = async (email: string, selectedRole: UserRole = 'admin'): Promise<boolean> => {
    setUser({
      id: `user-${Date.now()}`,
      display_name: email.split('@')[0],
      role: selectedRole,
      active: true,
      created_at: new Date().toISOString(),
    });
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
