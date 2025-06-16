import { useState, useCallback, useEffect } from 'react';
import { UploadResponse, TransactionResponse, DeleteResponse, UploadProgress } from '../lib/types';

// API configuration
const API_BASE_URL = 'http://localhost:5000';

// Custom hook for server API integration
export const useServerAPI = (authToken?: string) => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    phase: 'idle',
    progress: 0,
    message: '',
  });

  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null);

  // Generic API request function
  const makeRequest = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }, [authToken]);

  // Health check
  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await makeRequest<{ status: string }>('/health');
      const healthy = response.status === 'ok';
      setIsServerHealthy(healthy);
      return healthy;
    } catch (error) {
      console.error('Health check failed:', error);
      setIsServerHealthy(false);
      return false;
    }
  }, [makeRequest]);

  // Upload single file
  const uploadFile = useCallback(async (
    file: File,
    options: {
      folder?: string;
      description?: string;
    } = {}
  ): Promise<UploadResponse> => {
    if (!authToken) {
      throw new Error('Authentication token is required for file upload');
    }

    setUploadProgress({
      phase: 'uploading',
      progress: 10,
      message: 'Uploading file...',
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      
      if (options.description) {
        formData.append('description', options.description);
      }

      const result = await makeRequest<UploadResponse>('/api/upload/single', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress({
        phase: 'confirming',
        progress: 60,
        message: 'Confirming blockchain transaction...',
        transactionHash: result.data.blockchain.transaction_hash,
      });

      // Wait for transaction confirmation
      await waitForTransactionConfirmation(result.data.blockchain.transaction_hash);

      setUploadProgress({
        phase: 'completed',
        progress: 100,
        message: 'File uploaded successfully!',
        transactionHash: result.data.blockchain.transaction_hash,
      });

      return result;
    } catch (error) {
      setUploadProgress({
        phase: 'error',
        progress: 0,
        message: 'Upload failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }, [authToken, makeRequest]);

  // Get transaction details
  const getTransaction = useCallback(async (transactionHash: string): Promise<TransactionResponse> => {
    return makeRequest<TransactionResponse>(`/api/upload/transaction/${transactionHash}`);
  }, [makeRequest]);

  // Delete file
  const deleteFile = useCallback(async (publicId: string): Promise<DeleteResponse> => {
    if (!authToken) {
      throw new Error('Authentication token is required for file deletion');
    }

    return makeRequest<DeleteResponse>(`/api/upload/file/${publicId}`, {
      method: 'DELETE',
    });
  }, [authToken, makeRequest]);

  // Wait for transaction confirmation with retries
  const waitForTransactionConfirmation = useCallback(async (
    transactionHash: string,
    maxRetries: number = 10,
    delayMs: number = 2000
  ): Promise<TransactionResponse> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const transaction = await getTransaction(transactionHash);
        
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
    
    throw new Error('Transaction confirmation timeout');
  }, [getTransaction]);

  // Verify transaction status
  const verifyTransaction = useCallback(async (transactionHash: string): Promise<boolean> => {
    try {
      const response = await getTransaction(transactionHash);
      return response.data.transaction.status === '0x1';
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return false;
    }
  }, [getTransaction]);

  // Upload multiple files
  const uploadMultipleFiles = useCallback(async (
    files: File[],
    options: {
      folder?: string;
      description?: string;
    } = {}
  ): Promise<UploadResponse[]> => {
    const uploadPromises = files.map(file => uploadFile(file, options));
    return Promise.all(uploadPromises);
  }, [uploadFile]);

  // Reset upload progress
  const resetUploadProgress = useCallback(() => {
    setUploadProgress({
      phase: 'idle',
      progress: 0,
      message: '',
    });
  }, []);

  // Check server health on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    // State
    uploadProgress,
    isServerHealthy,

    // Actions
    uploadFile,
    deleteFile,
    getTransaction,
    verifyTransaction,
    uploadMultipleFiles,
    checkHealth,
    resetUploadProgress,
    waitForTransactionConfirmation,
  };
};

// Utility functions
export const serverAPIUtils = {
  // Validate file before upload
  validateFile: (
    file: File,
    options: {
      maxSize?: number; // in bytes
      allowedTypes?: string[];
    } = {}
  ): { valid: boolean; error?: string } => {
    const { maxSize = 10 * 1024 * 1024, allowedTypes } = options; // Default 10MB

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`,
      };
    }

    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    return { valid: true };
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

  // Get file extension
  getFileExtension: (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  },

  // Get file type category
  getFileCategory: (fileType: string): string => {
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