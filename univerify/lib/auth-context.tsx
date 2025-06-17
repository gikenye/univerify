'use client'

import { User, UserType } from '@/types';
import { createContext, useContext, useEffect, useState } from 'react';
import { ServerAPIService } from './server-api';
import { walletService } from './wallet';

// Create a single instance of ServerAPIService
const serverApiService = new ServerAPIService();

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

// Token storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem(USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on component mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        setIsLoading(true);
        
        // Check for stored token
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);
        
        if (storedToken && storedUser) {
          // Restore token to API service
          serverApiService.setAuthToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsLoading(false);
          return;
        }

        // If no stored token, try wallet connection
        const walletAddress = await walletService.getConnectedAccount();
        
        if (walletAddress) {
          // Attempt to login with the connected wallet
          const response = await serverApiService.login({ 
            walletAddress, 
            signature: '', 
            message: '' 
          });
          if (response.success && response.data.user) {
            // Transform API response to match User type
            const transformedUser: User = {
              id: response.data.user.id || '', // Generate a unique ID if not provided
              type: 'individual', // Default to individual since API doesn't provide type
              name: response.data.user.name || '',
              email: response.data.user.email || '',
              walletAddress: response.data.user.wallet_address,
              createdAt: new Date().toISOString() // Use current timestamp since API doesn't provide it
            };
            setUser(transformedUser);
            // Store user data
            localStorage.setItem(USER_KEY, JSON.stringify(transformedUser));
            // Store token
            if (response.data.token) {
              localStorage.setItem(TOKEN_KEY, response.data.token);
              serverApiService.setAuthToken(response.data.token);
            }
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
      const response = await serverApiService.login({ 
        walletAddress, 
        signature: '', 
        message: '' 
      });
      
      if (response.success && response.data.user) {
        // Transform API response to match User type
        const transformedUser: User = {
          id: response.data.user.id || '', // Generate a unique ID if not provided
          type: 'individual', // Default to individual since API doesn't provide type
          name: response.data.user.name || '',
          email: response.data.user.email || '',
          walletAddress: response.data.user.wallet_address,
          createdAt: new Date().toISOString() // Use current timestamp since API doesn't provide it
        };
        setUser(transformedUser);
        // Store user data
        localStorage.setItem(USER_KEY, JSON.stringify(transformedUser));
        // Store token
        if (response.data.token) {
          localStorage.setItem(TOKEN_KEY, response.data.token);
          serverApiService.setAuthToken(response.data.token);
        }
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
      const response = await serverApiService.signup({
        walletAddress,
        signature: '',
        message: '',
        name: userData.name || '',
        email: userData.email || ''
      });
      
      if (response.success && response.data.user) {
        // Transform API response to match User type
        const transformedUser: User = {
          id: response.data.user.id || '', // Generate a unique ID if not provided
          type: 'individual', // Default to individual since API doesn't provide type
          name: response.data.user.name || '',
          email: response.data.user.email || '',
          walletAddress: response.data.user.wallet_address,
          createdAt: new Date().toISOString() // Use current timestamp since API doesn't provide it
        };
        setUser(transformedUser);
        // Store user data
        localStorage.setItem(USER_KEY, JSON.stringify(transformedUser));
        // Store token
        if (response.data.token) {
          localStorage.setItem(TOKEN_KEY, response.data.token);
          serverApiService.setAuthToken(response.data.token);
        }
      }
      
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
    setError(null);
    // Clear all stored data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user_type');
    // Clear server API token
    serverApiService.clearAuthToken();
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