import axios from 'axios';
import { Document, DocumentChange, User, UserType } from '@/types';

// This is a dummy implementation. Replace with actual API endpoints later.
const API_BASE_URL = '/api';

// Mock data for dummy API responses
const mockUsers: User[] = [
  {
    id: '1',
    type: 'individual',
    name: 'John Doe',
    email: 'john@example.com',
    walletAddress: '0x123456789abcdef',
    createdAt: new Date().toISOString(),
  },
];

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Resume.pdf',
    description: 'My professional resume',
    ipfsHash: 'QmT78zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff5o',
    uploadedBy: '1',
    uploadedAt: new Date().toISOString(),
    size: 1024 * 1024 * 2, // 2MB
    mimeType: 'application/pdf',
    isVerified: true,
    verificationStatus: 'verified',
  },
  {
    id: '2',
    name: 'Certificate.pdf',
    description: 'University degree certificate',
    ipfsHash: 'QmT78zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff5p',
    uploadedBy: '1',
    uploadedAt: new Date().toISOString(),
    size: 1024 * 1024 * 1.5, // 1.5MB
    mimeType: 'application/pdf',
    isVerified: true,
    verificationStatus: 'verified',
  },
];

const mockChanges: DocumentChange[] = [
  {
    id: '1',
    documentId: '1',
    changedBy: '1',
    changeType: 'upload',
    timestamp: new Date().toISOString(),
    details: 'Initial upload',
  },
];

// Auth API
export const authAPI = {
  registerUser: async (userType: UserType, userData: Partial<User>): Promise<User> => {
    // In a real implementation, this would call the backend API
    console.log('Registering user:', userType, userData);
    
    // Return a mock user for now
    const newUser: User = {
      id: String(mockUsers.length + 1),
      type: userType,
      name: userData.name || '',
      email: userData.email || '',
      walletAddress: userData.walletAddress || '',
      createdAt: new Date().toISOString(),
    };
    
    mockUsers.push(newUser);
    return newUser;
  },
  
  loginUser: async (walletAddress: string): Promise<User | null> => {
    // In a real implementation, this would call the backend API
    console.log('Logging in user with wallet:', walletAddress);
    
    // Find user by wallet address
    const user = mockUsers.find(u => u.walletAddress === walletAddress);
    return user || null;
  },
};

// Document API
export const documentAPI = {
  getAllDocuments: async (userId: string): Promise<Document[]> => {
    // In a real implementation, this would call the backend API
    console.log('Getting documents for user:', userId);
    
    // Return mock documents for now
    return mockDocuments.filter(doc => doc.uploadedBy === userId);
  },
  
  uploadDocument: async (userId: string, file: File, description?: string): Promise<Document> => {
    // In a real implementation, this would upload to IPFS via the backend
    console.log('Uploading document for user:', userId, file);
    
    // Create a mock document
    const newDoc: Document = {
      id: String(mockDocuments.length + 1),
      name: file.name,
      description,
      ipfsHash: `QmT78zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff${mockDocuments.length + 1}`,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      size: file.size,
      mimeType: file.type,
      isVerified: true,
      verificationStatus: 'verified',
    };
    
    // Add to mock documents
    mockDocuments.push(newDoc);
    
    // Create a change record
    mockChanges.push({
      id: String(mockChanges.length + 1),
      documentId: newDoc.id,
      changedBy: userId,
      changeType: 'upload',
      timestamp: new Date().toISOString(),
      details: 'Initial upload',
    });
    
    return newDoc;
  },
  
  getDocumentById: async (documentId: string): Promise<Document | null> => {
    // In a real implementation, this would call the backend API
    console.log('Getting document:', documentId);
    
    // Find document by ID
    const doc = mockDocuments.find(d => d.id === documentId);
    return doc || null;
  },
  
  shareDocument: async (documentId: string, sharedBy: string, sharedWith: string): Promise<string> => {
    // In a real implementation, this would call the backend API
    console.log('Sharing document:', documentId, 'from', sharedBy, 'to', sharedWith);
    
    // Create a mock share link
    const shareLink = `https://univerify.com/share/${documentId}/${Date.now()}`;
    
    // Create a change record
    mockChanges.push({
      id: String(mockChanges.length + 1),
      documentId,
      changedBy: sharedBy,
      changeType: 'share',
      timestamp: new Date().toISOString(),
      details: `Shared with ${sharedWith}`,
    });
    
    return shareLink;
  },
  
  getDocumentChanges: async (documentId: string): Promise<DocumentChange[]> => {
    // In a real implementation, this would call the backend API
    console.log('Getting changes for document:', documentId);
    
    // Return mock changes for the document
    return mockChanges.filter(change => change.documentId === documentId);
  },
}; 