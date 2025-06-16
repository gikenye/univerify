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
    blockchain: {
      transactionHash: string;
      blockNumber: number;
      blockHash: string;
      contractAddress: string;
      gasUsed: number;
      status: string;
      confirmations: number;
      timestamp: number;
    };
    verification: VerificationData;
    message: string;
  };
} 