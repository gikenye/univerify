import { walletService } from './wallet';
import { serverApiService, uploadUtils, APIError } from './server-api';
import { UploadResponse, TransactionResponse, UploadProgress } from './types';

// Configuration interface
interface IntegratedServiceConfig {
  web3AuthClientId: string;
  serverBaseUrl?: string;
  enableMetaMask?: boolean;
  enableWeb3Auth?: boolean;
}

// User session interface
interface UserSession {
  isAuthenticated: boolean;
  authMethod: 'metamask' | 'web3auth' | null;
  walletAddress: string | null;
  userInfo?: {
    email?: string;
    name?: string;
    provider?: string;
  };
}

// Main integrated service class
export class IntegratedService {
  private currentSession: UserSession = {
    isAuthenticated: false,
    authMethod: null,
    walletAddress: null,
  };

  constructor(private config: IntegratedServiceConfig) {
    // Set server base URL if provided
    if (config.serverBaseUrl) {
      // Note: You would need to update serverApiService to accept base URL changes
      console.log('Custom server URL:', config.serverBaseUrl);
    }
  }

  // Connect with MetaMask
  async connectWithMetaMask(): Promise<UserSession> {
    if (!this.config.enableMetaMask && this.config.enableMetaMask !== undefined) {
      throw new Error('MetaMask authentication is disabled');
    }

    try {
      const walletAddress = await walletService.connectWallet();
      
      if (walletAddress) {
        this.currentSession = {
          isAuthenticated: true,
          authMethod: 'metamask',
          walletAddress,
        };
      }

      return this.currentSession;
    } catch (error: unknown) {
      console.error('Error connecting with MetaMask:', error);
      throw error;
    }
  }

  // Disconnect from current authentication method
  async disconnect(): Promise<void> {
    try {
      this.currentSession = {
        isAuthenticated: false,
        authMethod: null,
        walletAddress: null,
      };
    } catch (error: unknown) {
      console.error('Error disconnecting:', error);
      throw error;
    }
  }

  // Get current session
  getCurrentSession(): UserSession {
    return { ...this.currentSession };
  }

  // Upload file with comprehensive progress tracking
  async uploadFile(
    file: File,
    options: {
      folder?: string;
      description?: string;
      onProgress?: (progress: UploadProgress) => void;
    } = {}
  ): Promise<UploadResponse> {
    const { onProgress, ...uploadOptions } = options;

    // Check authentication
    if (!this.currentSession.isAuthenticated) {
      throw new APIError('User not authenticated', 401);
    }

    try {
      const validation = uploadUtils.validateFile(file, {
        maxSize: 50 * 1024 * 1024, // 50MB limit
        allowedTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      });

      if (!validation.valid) {
        onProgress?.({
          phase: 'error',
          progress: 0,
          message: 'File validation failed',
          error: validation.error,
        });
        throw new APIError(validation.error || 'File validation failed', 400);
      }

      // Phase 2: Upload file
      onProgress?.({
        phase: 'uploading',
        progress: 25,
        message: 'Uploading file to server...',
      });

      const uploadResult = await serverApiService.uploadFile(file, uploadOptions);

      onProgress?.({
        phase: 'confirming',
        progress: 60,
        message: 'Confirming blockchain transaction...',
        transactionHash: uploadResult.data.blockchain.transaction_hash,
      });

      // Phase 3: Wait for transaction confirmation
      await serverApiService.waitForTransactionConfirmation(
        uploadResult.data.blockchain.transaction_hash
      );

      onProgress?.({
        phase: 'completed',
        progress: 100,
        message: 'File uploaded successfully!',
        transactionHash: uploadResult.data.blockchain.transaction_hash,
      });

      return uploadResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof APIError ? error.message : 'Unknown error occurred';
      
      onProgress?.({
        phase: 'error',
        progress: 0,
        message: 'Upload failed',
        error: errorMessage,
      });

      throw error;
    }
  }

  // Delete file
  async deleteFile(publicId: string): Promise<boolean> {
    if (!this.currentSession.isAuthenticated || this.currentSession.authMethod !== 'web3auth') {
      throw new APIError('Web3Auth authentication required for file deletion', 403);
    }

    try {
      const result = await serverApiService.deleteFile(publicId);
      return result.data.deleted;
    } catch (error: unknown) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Get transaction details
  async getTransactionDetails(transactionHash: string): Promise<TransactionResponse> {
    return serverApiService.getTransaction(transactionHash);
  }

  // Verify transaction
  async verifyTransaction(transactionHash: string): Promise<boolean> {
    return serverApiService.verifyTransaction(transactionHash);
  }

  // Sign message (works with both MetaMask and Web3Auth)
  async signMessage(message: string): Promise<string | null> {
    if (!this.currentSession.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      if (this.currentSession.authMethod === 'metamask') {
        return await walletService.signMessage(message);
      } else {
        return message;
      }
    } catch (error: unknown) {
      console.error('Error signing message:', error);
      return null;
    }
  }

  // Get available authentication methods
  getAvailableAuthMethods(): string[] {
    const methods: string[] = [];

    if (this.config.enableMetaMask !== false && walletService.isMetaMaskInstalled()) {
      methods.push('metamask');
    }
    return methods;
  }

  // Utility methods
  static formatFileSize = uploadUtils.formatFileSize;
  static formatTimestamp = uploadUtils.formatTimestamp;
  static validateFile = uploadUtils.validateFile;
}

// Export types
export type { UserSession, IntegratedServiceConfig }; 