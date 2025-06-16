import React, { useState, useRef, useCallback, useEffect } from 'react';
import { walletService } from '../lib/wallet';
import { APIError } from '../lib/server-api';
import { UploadProgress } from '../lib/types';

// File upload component with wallet integration
export const FileUploadWithWallet: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    phase: 'idle',
    progress: 0,
    message: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [serverHealth, setServerHealth] = useState<boolean | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check server health
  const checkServerHealth = useCallback(async () => {
    try {
      const health = await walletService.checkServerHealth();
      setServerHealth(health.status === 'ok');
    } catch (error) {
      console.error('Health check failed:', error);
      setServerHealth(false);
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    try {
      const address = await walletService.connectWallet();
      if (address) {
        setWalletAddress(address);
        setIsConnected(true);
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
    walletService.clearAuthToken();
  }, []);

  // Upload file
  const uploadFile = useCallback(async (file: File) => {
    if (!authToken) {
      alert('Please authenticate first');
      return;
    }

    try {
      // Set auth token
      walletService.setAuthToken(authToken);

      // Upload file with progress tracking
      const result = await walletService.uploadFile(file, {
        folder: 'user-documents',
        description: `Uploaded by ${walletAddress}`,
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
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
      console.error('Error uploading file:', error);
      
      if (error instanceof APIError) {
        alert(`Upload failed: ${error.message}`);
      } else {
        alert('Error uploading file');
      }
    }
  }, [authToken, walletAddress]);

  // Delete file
  const deleteFile = useCallback(async (publicId: string) => {
    if (!authToken) {
      alert('Authentication required');
      return;
    }

    try {
      await walletService.deleteFile(publicId);
      
      // Remove from uploaded files list
      setUploadedFiles(prev => prev.filter(file => file.data.file.id !== publicId));
      
      alert('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file');
    }
  }, [authToken]);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file
      const validation = walletService.utils.validateFile(file, {
        maxSize: 10 * 1024 * 1024, // 10MB
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
        alert(validation.error);
        return;
      }

      uploadFile(file);
    }
  }, [uploadFile]);

  // Check health on mount
  useEffect(() => {
    checkServerHealth();
  }, [checkServerHealth]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">File Upload with Wallet Integration</h2>
      
      {/* Server Health Status */}
      <div className="mb-4 p-3 rounded-lg bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Server Status:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            serverHealth === null ? 'bg-gray-200 text-gray-600' :
            serverHealth ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {serverHealth === null ? 'Checking...' :
             serverHealth ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Wallet Connection */}
      <div className="mb-6">
        {!isConnected ? (
          <button
            onClick={connectWallet}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Connected Wallet:</p>
              <p className="text-sm text-gray-600">
                {walletAddress?.substring(0, 6)}...{walletAddress?.substring(walletAddress.length - 4)}
              </p>
            </div>
            <button
              onClick={disconnectWallet}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.txt,.doc,.docx"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!isConnected}
          className={`w-full py-2 px-4 rounded-lg transition-colors ${
            isConnected
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Select File to Upload
        </button>
      </div>

      {/* Upload Progress */}
      {uploadProgress.phase !== 'idle' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{uploadProgress.message}</span>
            <span className="text-sm text-gray-600">{uploadProgress.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Uploaded Files</h3>
          <div className="space-y-4">
            {uploadedFiles.map((file) => (
              <div
                key={file.data.file.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{file.data.file.original_name}</p>
                  <p className="text-sm text-gray-600">
                    {walletService.utils.formatFileSize(file.data.file.size)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={file.data.file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    View
                  </a>
                  <button
                    onClick={() => deleteFile(file.data.file.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
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

export default FileUploadWithWallet; 