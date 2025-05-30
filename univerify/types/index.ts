export type UserType = 'individual' | 'organization';

export interface User {
  id: string;
  type: UserType;
  name: string;
  email: string;
  walletAddress: string;
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  description?: string;
  ipfsHash: string;
  uploadedBy: string;
  uploadedAt: string;
  size: number;
  mimeType: string;
  isVerified: boolean;
  verificationStatus: 'verified' | 'pending' | 'failed';
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