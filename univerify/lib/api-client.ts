/**
 * API Client for Uniserver MVP - File Upload & Blockchain API
 * Based on server-apis.json specification
 */

import { UploadResponse, TransactionResponse, DeleteResponse, HealthResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ;

/**
 * API Client Class
 */
export class APIClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Set Web3Auth JWT token
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  // Clear auth token
  clearAuth(): void {
    this.authToken = null;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
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
        throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Health Check - GET /health
   * Check if server is running
   */
  async healthCheck(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  /**
   * Upload File - POST /api/upload/single
   * Upload file with blockchain transaction simulation
   */
  async uploadFile(
    file: File,
    options: {
      folder?: string;
      description?: string;
    } = {}
  ): Promise<UploadResponse> {
    if (!this.authToken) {
      throw new Error('Authentication required. Please set Web3Auth token.');
    }

    const formData = new FormData();
    formData.append('file', file);
    
    if (options.folder) {
      formData.append('folder', options.folder);
    }
    
    if (options.description) {
      formData.append('description', options.description);
    }

    return this.request<UploadResponse>('/api/upload/single', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Get Transaction - GET /api/upload/transaction/{hash}
   * Get blockchain transaction details
   */
  async getTransaction(transactionHash: string): Promise<TransactionResponse> {
    return this.request<TransactionResponse>(`/api/upload/transaction/${transactionHash}`);
  }

  /**
   * Delete File - DELETE /api/upload/file/{publicId}
   * Delete uploaded file
   */
  async deleteFile(publicId: string): Promise<DeleteResponse> {
    if (!this.authToken) {
      throw new Error('Authentication required. Please set Web3Auth token.');
    }

    return this.request<DeleteResponse>(`/api/upload/file/${publicId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Upload Multiple Files
   * Batch upload multiple files
   */
  async uploadMultipleFiles(
    files: File[],
    options: {
      folder?: string;
      description?: string;
    } = {}
  ): Promise<UploadResponse[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Verify Transaction Status
   * Check if transaction is confirmed (status = "0x1")
   */
  async verifyTransaction(transactionHash: string): Promise<boolean> {
    try {
      const response = await this.getTransaction(transactionHash);
      return response.data.transaction.status === '0x1';
    } catch (error) {
      console.error('Transaction verification failed:', error);
      return false;
    }
  }

  /**
   * Wait for Transaction Confirmation
   * Poll transaction status until confirmed or timeout
   */
  async waitForConfirmation(
    transactionHash: string,
    maxRetries: number = 10,
    delayMs: number = 2000
  ): Promise<TransactionResponse> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const transaction = await this.getTransaction(transactionHash);
        
        // Check if transaction is confirmed
        if (transaction.data.transaction.status === '0x1') {
          return transaction;
        }
        
        // Wait before next retry (except on last iteration)
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        // If it's the last retry, throw the error
        if (i === maxRetries - 1) {
          throw error;
        }
        // Otherwise, wait and retry
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    throw new Error('Transaction confirmation timeout');
  }
}

/**
 * Utility Functions
 */
export const utils = {
  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  },

  // Format timestamp
  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  },

  // Validate file
  validateFile(
    file: File,
    options: {
      maxSize?: number; // bytes
      allowedTypes?: string[];
    } = {}
  ): { valid: boolean; error?: string } {
    const { maxSize = 10 * 1024 * 1024, allowedTypes } = options; // Default 10MB

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(maxSize)})`,
      };
    }

    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  },

  // Get file type category
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

/**
 * Default API Client Instance
 */
export const apiClient = new APIClient();

/**
 * Complete Upload Workflow Example
 * Based on server-apis.json complete_example
 */
export const completeUploadWorkflow = async (
  file: File,
  authToken: string,
  options: {
    folder?: string;
    description?: string;
    onProgress?: (message: string, progress: number) => void;
  } = {}
): Promise<UploadResponse> => {
  const { onProgress, ...uploadOptions } = options;
  
  try {
    // Step 1: Set authentication
    onProgress?.('Setting up authentication...', 10);
    apiClient.setAuthToken(authToken);

    // Step 2: Validate file
    onProgress?.('Validating file...', 20);
    const validation = utils.validateFile(file, {
      maxSize: 50 * 1024 * 1024, // 50MB
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
      throw new Error(validation.error);
    }

    // Step 3: Upload file
    onProgress?.('Uploading file...', 40);
    const uploadResult = await apiClient.uploadFile(file, uploadOptions);

    // Step 4: Wait for blockchain confirmation
    onProgress?.('Confirming blockchain transaction...', 70);
    await apiClient.waitForConfirmation(uploadResult.data.blockchain.transaction_hash);

    // Step 5: Complete
    onProgress?.('Upload completed successfully!', 100);
    return uploadResult;

  } catch (error) {
    onProgress?.(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
    throw error;
  }
};

// Export all types
export type {
  UploadResponse,
  TransactionResponse,
  DeleteResponse,
  HealthResponse,
}; 