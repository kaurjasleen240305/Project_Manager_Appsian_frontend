import React, { createContext, useContext, useState, useEffect } from 'react';
import {  AuthResponse, LoginCredentials, RegisterCredentials } from '@/types';
import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/config/api';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await apiClient<AuthResponse>(
        API_ENDPOINTS.auth.login,
        {
          method: 'POST',
          body: JSON.stringify(credentials),
        }
      );

      localStorage.setItem('token', response.token);
      localStorage.setItem('username', JSON.stringify(response.username));
      setUser(response.username);
      
      toast({
        title: 'Welcome back!',
        description: 'Successfully logged in.',
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      const response = await apiClient<AuthResponse>(
        API_ENDPOINTS.auth.register,
        {
          method: 'POST',
          body: JSON.stringify(credentials),
        }
      );

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.username));
      setUser(response.username);
      
      toast({
        title: 'Account created!',
        description: 'Welcome to Project Manager.',
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message || 'Could not create account',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser("");
    navigate('/auth');
    toast({
      title: 'Logged out',
      description: 'See you next time!',
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
