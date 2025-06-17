import React, { useState, useRef, useCallback } from 'react';
import { walletService } from '../lib/wallet';
import { UploadResponse, TransactionResponse, UploadProgress } from '../lib/types';

// File upload component
export const FileUpload: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    phase: 'idle',
    progress: 0,
    message: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadResponse[]>([]);
  const [serverHealth, setServerHealth] = useState<boolean | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_BASE_URL = ;

  // Connect wallet
  const connectWallet = useCallback(async () => {
    try {
      const address = await walletService.connectWallet();
      if (address) {
        setWalletAddress(address);
        setIsConnected(true);
        
        // In a real implementation, you would get the Web3Auth token here
        // For demo purposes, we'll simulate having a token
        // setAuthToken('your-web3auth-jwt-token-here');
        
        console.log('Connected to wallet:', address);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setWalletAddress(null);
    setAuthToken(null);
  }, []);

  // Check server health
  const checkServerHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      const healthy = data.status === 'ok';
      setServerHealth(healthy);
      return healthy;
    } catch (error) {
      console.error('Health check failed:', error);
      setServerHealth(false);
      return false;
    }
  }, []);

  // Make authenticated request
  const makeAuthenticatedRequest = useCallback(async <T extends unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    if (!authToken) {
      throw new Error('Authentication token required');
    }

    const config: RequestInit = {
      ...options,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }, [authToken]);

  // Get transaction details
  const getTransaction = useCallback(async (transactionHash: string): Promise<TransactionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/upload/transaction/${transactionHash}`);
    return await response.json();
  }, []);

  // Wait for transaction confirmation
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

  // Upload file
  const uploadFile = useCallback(async (file: File) => {
    if (!authToken) {
      alert('Please authenticate first. In a real app, you would connect with Web3Auth.');
      return;
    }

    setUploadProgress({
      phase: 'uploading',
      progress: 10,
      message: 'Uploading file...',
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'user-documents');
      formData.append('description', `Uploaded by ${walletAddress}`);

      const result = await makeAuthenticatedRequest<UploadResponse>('/api/upload/single', {
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

      // Add to uploaded files list
      setUploadedFiles(prev => [...prev, result]);

      // Reset progress after 3 seconds
      setTimeout(() => {
        setUploadProgress({
          phase: 'idle',
          progress: 0,
          message: '',
        });
      }, 3000);

    } catch (error) {
      setUploadProgress({
        phase: 'error',
        progress: 0,
        message: 'Upload failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [authToken, walletAddress, makeAuthenticatedRequest, waitForTransactionConfirmation]);

  // Delete file
  const deleteFile = useCallback(async (publicId: string) => {
    if (!authToken) {
      alert('Authentication required');
      return;
    }

    try {
      await makeAuthenticatedRequest(`/api/upload/file/${publicId}`, {
        method: 'DELETE',
      });

      // Remove from uploaded files list
      setUploadedFiles(prev => prev.filter(file => file.data.file.id !== publicId));
      
      alert('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file');
    }
  }, [authToken, makeAuthenticatedRequest]);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedMimeTypes.includes(file.type)) {
        alert('Invalid file type. Only PDF and Word documents are allowed.');
        return;
      }

      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 10MB limit`);
        return;
      }

      uploadFile(file);
    }
  }, [uploadFile]);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  }, []);

  // Check health on mount
  React.useEffect(() => {
    checkServerHealth();
  }, [checkServerHealth]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">File Upload with Blockchain Verification</h2>
      
      {/* Server Health Status */}
      <div className="mb-4 p-3 rounded-lg bg-gray-50">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${serverHealth === true ? 'bg-green-500' : serverHealth === false ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
          <span className="text-sm">
            Server Status: {serverHealth === true ? 'Healthy' : serverHealth === false ? 'Unhealthy' : 'Checking...'}
          </span>
          <button
            onClick={checkServerHealth}
            className="ml-auto text-blue-600 hover:text-blue-800 text-sm underline"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Wallet Connection */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Wallet Connection</h3>
        {!isConnected ? (
          <div>
            <button
              onClick={connectWallet}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Connect MetaMask Wallet
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Note: For file uploads, you would need Web3Auth authentication in production.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-green-600 mb-2">✓ Connected</p>
            <p className="text-sm text-gray-600 mb-3">Address: {walletAddress}</p>
            <button
              onClick={disconnectWallet}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Authentication Status */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Authentication Status</h3>
        {authToken ? (
          <p className="text-green-600">✓ Authenticated with Web3Auth</p>
        ) : (
          <div>
            <p className="text-red-600">✗ Not authenticated</p>
            <p className="text-sm text-gray-600 mt-2">
              In production, you would authenticate with Web3Auth to get a JWT token for file uploads.
            </p>
            <button
              onClick={() => setAuthToken('demo-token')}
              className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Simulate Authentication (Demo)
            </button>
          </div>
        )}
      </div>

      {/* File Upload */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">File Upload</h3>
        
        {uploadProgress.phase !== 'idle' && (
          <div className="mb-4 p-3 border rounded-lg bg-gray-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      uploadProgress.phase === 'error' ? 'bg-red-500' : 
                      uploadProgress.phase === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${uploadProgress.progress}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm text-gray-600">{uploadProgress.progress}%</span>
            </div>
            <p className="text-sm">{uploadProgress.message}</p>
            {uploadProgress.transactionHash && (
              <p className="text-xs text-gray-500 mt-1">
                TX: {uploadProgress.transactionHash}
              </p>
            )}
            {uploadProgress.error && (
              <p className="text-xs text-red-600 mt-1">
                Error: {uploadProgress.error}
              </p>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={!authToken || uploadProgress.phase === 'uploading' || uploadProgress.phase === 'confirming'}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="text-xs text-gray-500 mt-1">
          Maximum file size: 10MB. Supported formats: PDF, Images, Documents
        </p>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Uploaded Files</h3>
          <div className="space-y-3">
            {uploadedFiles.map((upload, index) => (
              <div key={index} className="p-3 border rounded-lg bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{upload.data.file.original_name}</h4>
                    <p className="text-sm text-gray-600">
                      Size: {formatFileSize(upload.data.file.size)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Uploaded: {formatTimestamp(upload.data.blockchain.timestamp)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      TX: {upload.data.blockchain.transaction_hash}
                    </p>
                    <a
                      href={upload.data.file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      View File
                    </a>
                  </div>
                  <button
                    onClick={() => deleteFile(upload.data.file.id)}
                    className="text-red-600 hover:text-red-800 text-sm underline ml-4"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 