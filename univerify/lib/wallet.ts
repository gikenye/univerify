import { ethers } from 'ethers';
import { serverApiService, APIError } from './server-api';
import { UploadResponse, TransactionResponse, DeleteResponse, HealthResponse, UploadProgress } from './types';
// Interface for Ethereum window object
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
      on?: (event: string, handler: (...args: any[]) => void) => void;
      removeListener?: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''; // Utility functions
export const utils = {
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  },

  validateFile(
    file: File,
    options: {
      maxSize?: number;
      allowedTypes?: string[];
    } = {}
  ): { valid: boolean; error?: string } {
    const { maxSize = 10 * 1024 * 1024, allowedTypes } = options;

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${utils.formatFileSize(maxSize)}`,
      };
    }

    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  },

  getFileCategory(fileType: string): string {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.startsWith('audio/')) return 'audio';
    if (fileType.includes('pdf')) return 'pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'document';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'spreadsheet';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'presentation';
    return 'other';
  },
};

class WalletService {
  private provider: ethers.BrowserProvider | null = null;
  private authToken: string | null = null;

  // Check if MetaMask is installed
  isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
  }

  // Utility functions
  utils = {
    formatFileSize(bytes: number): string {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    validateFile(file: File, options: { maxSize: number; allowedTypes: string[] }): { valid: boolean; error?: string } {
      if (file.size > options.maxSize) {
        return {
          valid: false,
          error: `File size exceeds maximum allowed size of ${this.formatFileSize(options.maxSize)}`
        };
      }

      if (!options.allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`
        };
      }

      return { valid: true };
    }
  };

  async connectWallet(): Promise<string | null> {
    try {
      // Check if MetaMask is installed
      if (typeof window !== 'undefined' && window.ethereum) {
        // Request account access
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts && accounts.length > 0) {
          this.provider = new ethers.BrowserProvider(window.ethereum);
          return accounts[0];
        }
      } else {
        console.warn('MetaMask is not installed. Please install MetaMask to use this feature.');
        // You might want to show a modal or notification to the user here
      }
      return null;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return null;
    }
  }

  async getConnectedAccount(): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });
        return accounts && accounts.length > 0 ? accounts[0] : null;
      }
      return null;
    } catch (error) {
      console.error('Error getting connected account:', error);
      return null;
    }
  }

  async getProvider(): Promise<ethers.BrowserProvider | null> {
    if (!this.provider && typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
    return this.provider;
  }

  // Sign a message to verify ownership of the wallet
  async signMessage(message: string): Promise<string | null> {
    try {
      const provider = await this.getProvider();
      if (!provider) return null;

      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);
      
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      return null;
    }
  }

  // Server API Integration

  // Set authentication token
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  // Clear authentication token
  clearAuthToken(): void {
    this.authToken = null;
  }

  // Generic API request method
  async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0
      );
    }
  }

  // Health check endpoint
  async checkServerHealth(): Promise<HealthResponse> {
    return this.makeRequest<HealthResponse>('/health');
  }

  // Sign up user with MetaMask
  async signupUser(userData: { name: string; email: string }): Promise<{ success: boolean; token?: string }> {
    try {
      const provider = await this.getProvider();
      if (!provider) return { success: false };

      // Get wallet address
      const accounts = await provider.send('eth_accounts', []);
      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet address found');
      }
      const walletAddress = accounts[0];

      // Sign a message to verify wallet ownership
      const signer = await provider.getSigner();
      const message = `Sign this message to verify your wallet ownership for UniVerify signup. Wallet: ${walletAddress}`;
      const signature = await signer.signMessage(message);

      // Send signup request to server
      const response = await serverApiService.signup({
        walletAddress,
        signature,
        message,
        name: userData.name,
        email: userData.email,
      });

      if (response.success && response.data.token) {
        serverApiService.setAuthToken(response.data.token);
      }

      return { success: response.success, token: response.data.token };
    } catch (error) {
      console.error('Error signing up user:', error);
      return { success: false };
    }
  }

  // Upload single file
  async uploadFile(
    file: File,
    options: {
      folder?: string;
      description?: string;
      onProgress?: (progress: UploadProgress) => void;
    } = {}
  ): Promise<UploadResponse> {
    if (!this.authToken) {
      throw new APIError('Authentication token is required for file upload', 401);
    }

    const { onProgress, ...uploadOptions } = options;

    try {
      // Phase 1: Validate file
      onProgress?.({
        phase: 'uploading',
        progress: 10,
        message: 'Validating file...',
      });

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new APIError(
          `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (10MB)`,
          400
        );
      }

      // Phase 2: Upload file
      onProgress?.({
        phase: 'uploading',
        progress: 30,
        message: 'Uploading file...',
      });

      const formData = new FormData();
      formData.append('file', file);
      
      if (uploadOptions.folder) {
        formData.append('folder', uploadOptions.folder);
      }
      
      if (uploadOptions.description) {
        formData.append('description', uploadOptions.description);
      }

      const result = await this.makeRequest<UploadResponse>('/api/upload/single', {
        method: 'POST',
        body: formData,
      });

      // Phase 3: Wait for transaction confirmation
      onProgress?.({
        phase: 'confirming',
        progress: 60,
        message: 'Confirming blockchain transaction...',
        transactionHash: result.data.blockchain.transaction_hash,
      });

      // Phase 4: Complete
      onProgress?.({
        phase: 'completed',
        progress: 100,
        message: 'Upload complete!',
      });

      return result;
    } catch (error) {
      onProgress?.({
        phase: 'error',
        progress: 0,
        message: 'Upload failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // Get transaction details
  async getTransaction(transactionHash: string): Promise<TransactionResponse> {
    return this.makeRequest<TransactionResponse>(`/api/upload/transaction/${transactionHash}`);
  }

  // Delete file
  async deleteFile(publicId: string): Promise<DeleteResponse> {
    if (!this.authToken) {
      throw new APIError('Authentication token is required for file deletion', 401);
    }

    return this.makeRequest<DeleteResponse>(`/api/upload/file/${publicId}`, {
      method: 'DELETE',
    });
  }

  // Wait for transaction confirmation
  async waitForTransactionConfirmation(
    transactionHash: string,
    maxRetries: number = 10,
    delayMs: number = 2000
  ): Promise<TransactionResponse> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const transaction = await this.getTransaction(transactionHash);
        
        if (transaction.data.transaction.status === '0x1') {
          return transaction;
        }
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    throw new APIError('Transaction confirmation timeout', 408);
  }

  // Verify transaction status
  async verifyTransaction(transactionHash: string): Promise<boolean> {
    try {
      const response = await this.getTransaction(transactionHash);
      return response.data.transaction.status === '0x1';
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return false;
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(
    files: File[],
    options: {
      folder?: string;
      description?: string;
      onProgress?: (progress: UploadProgress) => void;
    } = {}
  ): Promise<UploadResponse[]> {
    const uploadPromises = files.map(file => 
      this.uploadFile(file, options)
    );

    return Promise.all(uploadPromises);
  }
}

export const walletService = new WalletService(); 