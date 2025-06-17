import { UploadResponse, TransactionResponse, DeleteResponse, HealthResponse, AuthResponse, UploadProgress, VerificationResponse, DocumentsResponse } from './types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''; 
// API Error types
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// API Service class
export class ServerAPIService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // Only access localStorage on the client side
    if (typeof window !== 'undefined') {
      this.authToken = localStorage.getItem('auth_token');
    }
  }

  // Set Web3Auth JWT token and persist to localStorage
  setAuthToken(token: string) {
    this.authToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  // Clear auth token from memory and localStorage
  clearAuthToken() {
    this.authToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Get auth token
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Get auth headers
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    return headers;
  }

  // Generic API request method
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = new Headers();
    
    // Add auth headers
    const authHeaders = this.getAuthHeaders();
    Object.entries(authHeaders).forEach(([key, value]) => {
      headers.append(key, value);
    });
    
    // Add Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      headers.append('Content-Type', 'application/json');
    }
    
    // Add any additional headers from options
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers.append(key, value);
      });
    }
    
    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
      mode: 'cors',
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
  async healthCheck(): Promise<HealthResponse> {
    return this.makeRequest<HealthResponse>('/health');
  }

  // Verify document by transaction ID
  async verifyDocument(txId: string): Promise<VerificationResponse> {
    if (!txId) {
      throw new APIError('Transaction ID is required for document verification', 400);
    }

    try {
      const response = await this.makeRequest<VerificationResponse>(`/api/arweave/verify/${txId}`);
      
      if (!response.success) {
        throw new APIError(
          response.data?.message || 'Document verification failed',
          400,
          response
        );
      }

      return response;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        `Failed to verify document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  // Upload single file
  async uploadFile(
    file: File,
    options: {
      folder?: string;
      description?: string;
    } = {}
  ): Promise<UploadResponse> {
    if (!this.authToken) {
      throw new APIError('Authentication token is required for file upload', 401);
    }

    // Get the current wallet address
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new APIError('MetaMask is not available', 400);
    }

    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (!accounts || accounts.length === 0) {
      throw new APIError('No wallet connected', 400);
    }

    const walletAddress = accounts[0];
    const message = `Sign this message to upload a file to UniVerify with address ${walletAddress}`;
    
    // Get signature from MetaMask
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, walletAddress],
    });

    // Create FormData and append all fields
    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', signature);
    formData.append('message', message);
    formData.append('walletAddress', walletAddress);
    
    if (options.folder) {
      formData.append('folder', options.folder);
    }
    
    if (options.description) {
      formData.append('description', options.description);
    }

    // Log the FormData contents for debugging
    console.log('FormData contents:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value instanceof File ? value.name : value}`);
    }

    return this.makeRequest<UploadResponse>('/api/upload/single', {
      method: 'POST',
      body: formData,
    });
  }

  // Get transaction details
  async getTransaction(transactionHash: string): Promise<TransactionResponse> {
    if (!this.authToken) {
      throw new APIError('Authentication token is required for transaction details', 401);
    }
    return this.makeRequest<TransactionResponse>(`/api/upload/transaction/${transactionHash}`);
  }

  // Delete file
  async deleteFile(publicId: string): Promise<DeleteResponse> {
    if (!this.authToken) {
      throw new APIError('Authentication token is required for file deletion', 401);
    }

    return this.makeRequest<DeleteResponse>(`/api/upload/file/${publicId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  // Batch upload multiple files
  async uploadMultipleFiles(
    files: File[],
    options: {
      folder?: string;
      description?: string;
    } = {}
  ): Promise<UploadResponse[]> {
    if (!this.authToken) {
      throw new APIError('Authentication token is required for file upload', 401);
    }

    const uploadPromises = files.map(file => 
      this.uploadFile(file, options)
    );

    return Promise.all(uploadPromises);
  }

  // Verify transaction status
  async verifyTransaction(transactionHash: string): Promise<boolean> {
    if (!this.authToken) {
      throw new APIError('Authentication token is required for transaction verification', 401);
    }

    try {
      const response = await this.getTransaction(transactionHash);
      return response.data.transaction.status === '0x1';
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return false;
    }
  }

  // Get file upload status with retries
  async waitForTransactionConfirmation(
    transactionHash: string,
    maxRetries: number = 10,
    delayMs: number = 2000
  ): Promise<TransactionResponse> {
    if (!this.authToken) {
      throw new APIError('Authentication token is required for transaction confirmation', 401);
    }

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

  // Login endpoint
  async login(params: {
    walletAddress: string;
    signature: string;
    message: string;
  }): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Signup endpoint
  async signup(params: {
    walletAddress: string;
    signature: string;
    message: string;
    name: string;
    email: string;
  }): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Logout method
  logout() {
    this.clearAuthToken();
  }

  // Get user documents
  async getUserDocuments(): Promise<DocumentsResponse> {
    if (!this.authToken) {
      throw new APIError('Authentication token is required to fetch documents', 401);
    }

    // Only access localStorage on the client side
    if (typeof window === 'undefined') {
      throw new APIError('This method can only be called on the client side', 400);
    }

    const userData = localStorage.getItem('auth_user');
    if (!userData) {
      throw new APIError('User data not found', 401);
    }

    const { walletAddress } = JSON.parse(userData);
    if (!walletAddress) {
      throw new APIError('Wallet address not found', 401);
    }

    return this.makeRequest<DocumentsResponse>(`/api/arweave/documents/${walletAddress}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async shareDocument(documentId: string, email: string): Promise<{ success: boolean; message?: string }> {
    if (!this.authToken) {
      throw new APIError('Authentication token is required for document sharing', 401);
    }

    // First verify the document
    const verificationResponse = await this.verifyDocument(documentId);
    
    if (!verificationResponse.success) {
      throw new APIError(
        verificationResponse.data?.message || 'Document verification failed',
        400,
        verificationResponse
      );
    }

    // Then share the document
    return this.makeRequest<{ success: boolean; message?: string }>('/api/arweave/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        documentId, 
        email,
        txId: verificationResponse.data.txId,
        verificationHash: verificationResponse.data.verification.hash
      }),
    });
  }
}

// Create default API service instance
export const serverApiService = new ServerAPIService();

// Upload utilities
export const uploadUtils = {
  validateFile(file: File, options: { maxSize: number; allowedTypes: string[] }) {
    if (file.size > options.maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${options.maxSize / 1024 / 1024}MB limit`,
      };
    }

    if (!options.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported',
      };
    }

    return { valid: true };
  },

  async uploadWithProgress(
    file: File,
    options: {
      onProgress?: (progress: number) => void;
      onTransactionHash?: (hash: string) => void;
      folder?: string;
      description?: string;
    } = {}
  ) {
    try {
      const result = await serverApiService.uploadFile(file, {
        folder: options.folder,
        description: options.description,
      });

      if (result.success && result.data.blockchain.transaction_hash) {
        options.onTransactionHash?.(result.data.blockchain.transaction_hash);
        
        // Wait for transaction confirmation
        await serverApiService.waitForTransactionConfirmation(
          result.data.blockchain.transaction_hash
        );
      }

      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  },

  // Format file size for display
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Format timestamp
  formatTimestamp: (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  },
};

// Export types for external use
export type { UploadResponse, TransactionResponse, DeleteResponse, HealthResponse, AuthResponse };

// Create and export the authAPI instance
export const authAPI = {
  loginUser: async (walletAddress: string) => {
    const serverApi = new ServerAPIService();
    try {
      const response = await serverApi.login({ walletAddress, signature: '', message: '' });
      if (response.success && response.data.token) {
        serverApi.setAuthToken(response.data.token);
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },

  registerUser: async (userType: string, userData: any) => {
    const serverApi = new ServerAPIService();
    try {
      const response = await serverApi.signup({
        walletAddress: userData.walletAddress,
        signature: '',
        message: '',
        name: userData.name || '',
        email: userData.email || ''
      });
      if (response.success && response.data.token) {
        serverApi.setAuthToken(response.data.token);
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Registration error:', error);
      return null;
    }
  }
};