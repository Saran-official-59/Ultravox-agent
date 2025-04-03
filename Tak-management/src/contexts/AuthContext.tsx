import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

// Define types for user and auth context
type User = {
  id: string;
  name: string;
  email: string;
};

type AuthResponse = {
  id: string;
  name: string;
  email: string;
  token?: string;
  _id?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create AuthProvider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check for existing session on load
  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        
        if (token) {
          const response = await axios.get<AuthResponse>('http://localhost:5000/api/auth/user', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          setUser({
            id: response.data.id,
            name: response.data.name,
            email: response.data.email
          });
        }
      } catch (error) {
        console.error('Auth status check failed:', error);
        localStorage.removeItem('authToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post<{token: string, user: AuthResponse}>('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      
      const { token, user: userData } = response.data;
      
      localStorage.setItem('authToken', token);
      
      setUser({
        id: userData._id,
        name: userData.name,
        email: userData.email
      });
      
      toast.success('Logged in successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Signup function
  const signup = async (name: string, email: string, password: string) => {
    try {
      const response = await axios.post<{token: string, user: AuthResponse}>('http://localhost:5000/api/auth/signup', {
        name,
        email,
        password
      });
      
      const { token, user: userData } = response.data;
      
      localStorage.setItem('authToken', token);
      
      setUser({
        id: userData._id,
        name: userData.name,
        email: userData.email
      });
      
      toast.success('Account created successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    try {
      localStorage.removeItem('authToken');
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
