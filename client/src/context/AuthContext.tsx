import React, { createContext, useContext, useEffect, useState } from 'react';
import type {
  AuthContextType,
  AuthUser,
  LoginData,
  RegisterData,
  UpdateProfileData,
} from '../types/auth';
import {
  clearStoredToken,
  getCurrentUser,
  getStoredToken,
  loginUser,
  logoutUser,
  registerUser,
  updateUserProfile as apiUpdateUserProfile,
} from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setToken(getStoredToken());
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (data: LoginData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loginUser(data);
      setUser(result.user);
      setToken(result.token);
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await registerUser(data);
      setUser(result.user);
      setToken(result.token);
    } catch (err: any) {
      const msg = err.message || 'Registration failed.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Logout warning:', err);
    } finally {
      setUser(null);
      setToken(null);
      clearStoredToken();
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: UpdateProfileData): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await apiUpdateUserProfile(data);
      setUser(updated);
      return updated;
    } catch (err: any) {
      const msg = err.message || 'Failed to update profile.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isLoading,
        error,
        login,
        register,
        logout,
        updateProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
