'use client'

import { User, UserType } from '@/types';
import { createContext, useContext, useEffect, useState } from 'react';
import { ServerAPIService } from './server-api';
import { useWallet } from './wallet-context';

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
  const { isConnected, address, connect: connectWalletProvider } = useWallet();
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem(USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session when wallet connection changes
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        setIsLoading(true);
        
        // Check for stored token and user
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);
        
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Verify the stored user matches the connected wallet
          if (isConnected && address && parsedUser.walletAddress === address) {
            serverApiService.setAuthToken(storedToken);
            setUser(parsedUser);
            setIsLoading(false);
            return;
          } else if (!isConnected) {
            // Wallet disconnected, clear auth data
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            serverApiService.clearAuthToken();
            setUser(null);
          }
        }

        // If wallet is connected but no valid session, try to login
        if (isConnected && address) {
          try {
            const response = await serverApiService.login({ 
              walletAddress: address, 
              signature: '', 
              message: '' 
            });
            
            if (response.success && response.data.user) {
              const transformedUser: User = {
                id: response.data.user.id || '',
                type: 'individual',
                name: response.data.user.name || '',
                email: response.data.user.email || '',
                walletAddress: response.data.user.wallet_address,
                createdAt: new Date().toISOString()
              };
              setUser(transformedUser);
              localStorage.setItem(USER_KEY, JSON.stringify(transformedUser));
              
              if (response.data.token) {
                localStorage.setItem(TOKEN_KEY, response.data.token);
                serverApiService.setAuthToken(response.data.token);
              }
            }
          } catch (loginError) {
            console.log('Auto-login failed, user may need to register:', loginError);
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
  }, [isConnected, address]);

  // Connect wallet and authenticate
  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the wallet context to connect
      await connectWalletProvider();
      
      // The useEffect above will handle the authentication once wallet is connected
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
      
      // Ensure we have a wallet address from the wallet context
      if (!isConnected || !address) {
        setError('Wallet not connected');
        setIsLoading(false);
        return;
      }
      
      // Register the user
      const response = await serverApiService.signup({
        walletAddress: address,
        signature: '',
        message: '',
        name: userData.name || '',
        email: userData.email || ''
      });
      
      if (response.success && response.data.user) {
        const transformedUser: User = {
          id: response.data.user.id || '',
          type: userType,
          name: response.data.user.name || '',
          email: response.data.user.email || '',
          walletAddress: response.data.user.wallet_address,
          createdAt: new Date().toISOString()
        };
        setUser(transformedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(transformedUser));
        
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
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('user_type');
    // Clear server API token
    serverApiService.clearAuthToken();
    // Note: We don't disconnect the wallet here as that should be user's choice
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