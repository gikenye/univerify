'use client'

import { User, UserType } from '@/types';
import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from './api';
import { walletService } from './wallet';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  registerUser: (userType: UserType, userData: Partial<User>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  connectWallet: async () => {},
  registerUser: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on component mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        setIsLoading(true);
        const walletAddress = await walletService.getConnectedAccount();
        
        if (walletAddress) {
          // Attempt to login with the connected wallet
          const user = await authAPI.loginUser(walletAddress);
          if (user) {
            setUser(user);
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to check existing session:', err);
        setError('Failed to check existing session');
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  // Connect wallet and authenticate
  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const walletAddress = await walletService.connectWallet();
      
      if (!walletAddress) {
        setError('Failed to connect wallet');
        setIsLoading(false);
        return;
      }
      
      // Check if user exists
      const existingUser = await authAPI.loginUser(walletAddress);
      
      if (existingUser) {
        setUser(existingUser);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect to wallet');
      setIsLoading(false);
    }
  };

  // Register new user
  const registerUser = async (userType: UserType, userData: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure we have a wallet address
      let walletAddress = userData.walletAddress;
      
      if (!walletAddress) {
        const connectedAddress = await walletService.getConnectedAccount();
        
        if (!connectedAddress) {
          setError('Wallet not connected');
          setIsLoading(false);
          return;
        }
        
        walletAddress = connectedAddress;
      }
      
      // Register the user
      const newUser = await authAPI.registerUser(userType, {
        ...userData,
        walletAddress,
      });
      
      setUser(newUser);
      setIsLoading(false);
    } catch (err) {
      console.error('Error registering user:', err);
      setError('Failed to register user');
      setIsLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        connectWallet,
        registerUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 