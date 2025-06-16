// API Response Types
export interface UploadResponse {
  success: boolean;
  data: {
    file: {
      id: string;
      original_name: string;
      size: number;
      url: string;
      uploaded_by: string;
      user_info: {
        email: string;
        name: string;
        provider: string;
      };
    };
    blockchain: {
      transaction_hash: string;
      block_number: number;
      status: string;
      timestamp: number;
    };
  };
}

export interface TransactionResponse {
  success: boolean;
  data: {
    transaction: {
      hash: string;
      blockNumber: number;
      status: string;
      timestamp: number;
    };
  };
}

export interface DeleteResponse {
  success: boolean;
  data: {
    deleted: boolean;
    public_id: string;
  };
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: number;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      wallet_address: string;
    };
  };
}

// Upload Progress Types
export interface UploadProgress {
  phase: 'idle' | 'validating' | 'uploading' | 'confirming' | 'completed' | 'error';
  progress: number;
  message: string;
  transactionHash?: string;
  error?: string;
}

// Document interfaces
export interface CloudinaryData {
  publicId: string;
  url: string;
  resourceType: string;
  folder: string;
  tags: string[];
  etag: string;
  uploadedAt: string;
}

export interface BlockchainData {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  contractAddress: string;
  gasUsed: number;
  status: string;
  confirmations: number;
  timestamp: number;
}

export interface VerificationHistory {
  verifiedAt: string;
  hash: string;
  hasChanged: boolean;
  verifiedBy: string;
  _id: string;
}

export interface Document {
  id: string;
  txId: string;
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  hasChanged: boolean;
  lastVerified: string;
  owner: {
    _id: string;
    walletAddress: string;
    name: string;
    email: string;
  };
  cloudinaryData: CloudinaryData;
  blockchainData: BlockchainData;
  arweaveData: Record<string, any>;
  isOwner: boolean;
}

export interface DocumentsResponse {
  success: boolean;
  data: {
    userAddress: string;
    documents: Document[];
    totalDocuments: number;
  };
  message?: string;
}

// Verification response interfaces
export interface DocumentOwner {
  address: string;
  name: string;
  email: string;
}

export interface VerificationDocument {
  filename: string;
  contentType: string;
  size: number;
  owner: DocumentOwner;
  uploadedAt: string;
  hasChanged: boolean;
  lastVerified: string;
}

export interface VerificationData {
  hash: string;
  hasChanged: boolean;
  verifiedAt: string;
}

export interface VerificationResponse {
  success: boolean;
  data: {
    txId: string;
    document: VerificationDocument;
    arweave: Record<string, any>;
    blockchain: BlockchainData;
    verification: VerificationData;
    message: string;
  };
} 