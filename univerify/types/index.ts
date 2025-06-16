export type UserType = 'individual' | 'organization';

export interface User {
  id: string;
  type: UserType;
  name: string;
  email: string;
  walletAddress: string;
  createdAt: string;
}

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
  _id: string;
  txId: string;
  filename: string;
  contentType: string;
  size: number;
  originalHash: string;
  currentHash: string;
  owner: string;
  ownerAddress: string;
  cloudinaryData: CloudinaryData;
  blockchainData: BlockchainData;
  hasChanged: boolean;
  uploadedAt: string;
  verificationHistory: VerificationHistory[];
  shares: any[];
  lastVerified: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChange {
  id: string;
  documentId: string;
  changedBy: string;
  changeType: 'upload' | 'modification' | 'share';
  timestamp: string;
  details?: string;
}

export interface ShareInfo {
  id: string;
  documentId: string;
  sharedBy: string;
  sharedWith: string;
  sharedAt: string;
  accessType: 'view' | 'download';
} 