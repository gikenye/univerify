import { ServerAPIService } from './server-api';
import { User, UserType } from '@/types';

const serverApi = new ServerAPIService();

export const authAPI = {
  loginUser: async (walletAddress: string): Promise<User | null> => {
    try {
      const response = await serverApi.login({ walletAddress, signature: '', message: '' });
      if (response.success && response.data.token) {
        serverApi.setAuthToken(response.data.token);
        return {
          id: response.data.user.id,
          type: 'individual' as UserType,
          name: response.data.user.name,
          email: response.data.user.email,
          walletAddress: response.data.user.wallet_address,
          createdAt: new Date().toISOString()
        };
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },

  registerUser: async (userType: UserType, userData: Partial<User>): Promise<User | null> => {
    try {
      const response = await serverApi.signup({
        walletAddress: userData.walletAddress || '',
        signature: '',
        message: '',
        name: userData.name || '',
        email: userData.email || ''
      });
      if (response.success && response.data.token) {
        serverApi.setAuthToken(response.data.token);
        return {
          id: response.data.user.id,
          type: userType,
          name: response.data.user.name,
          email: response.data.user.email,
          walletAddress: response.data.user.wallet_address,
          createdAt: new Date().toISOString()
        };
      }
      return null;
    } catch (error) {
      console.error('Registration error:', error);
      return null;
    }
  }
}; 