import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Researcher, UserRequest, VerificationCodeRequest, TokenResponse, MessageResponse } from '../types';
import { AuthService } from '../services/authService';
import { ResearcherService } from '../services/researcherService';

interface AuthContextType {
  user: User | null;
  researcher: Researcher | null;
  loading: boolean;
  register: (credentials: UserRequest) => Promise<MessageResponse>;
  verifyEmail: (body: VerificationCodeRequest) => Promise<MessageResponse>;
  login: (credentials: UserRequest) => Promise<MessageResponse>;
  verifyLoginCode: (body: VerificationCodeRequest) => Promise<TokenResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [researcher, setResearcher] = useState<Researcher | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const currentRes = await ResearcherService.getByUserId(currentUser.user_id);
        setResearcher(currentRes);
      } else {
        setResearcher(null);
      }
    } catch (err) {
      console.error("Error refreshing session state:", err);
      setUser(null);
      setResearcher(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const handleRegister = async (credentials: UserRequest): Promise<MessageResponse> => {
    setLoading(true);
    try {
      return await AuthService.register(credentials);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (body: VerificationCodeRequest): Promise<MessageResponse> => {
    setLoading(true);
    try {
      return await AuthService.verifyEmail(body);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (credentials: UserRequest): Promise<MessageResponse> => {
    setLoading(true);
    try {
      return await AuthService.login(credentials);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginCode = async (body: VerificationCodeRequest): Promise<TokenResponse> => {
    setLoading(true);
    try {
      const response = await AuthService.verifyLoginCode(body);
      await refreshUser();
      return response;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    setLoading(true);
    try {
      await AuthService.logout({ refresh_token: localStorage.getItem("scn_refresh_token") || "" });
      setUser(null);
      setResearcher(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      researcher,
      loading,
      register: handleRegister,
      verifyEmail: handleVerifyEmail,
      login: handleLogin,
      verifyLoginCode: handleVerifyLoginCode,
      logout: handleLogout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
