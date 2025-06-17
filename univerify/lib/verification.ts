import { serverApiService } from "./server-api"
import { Document } from "./types"

export interface VerificationResult {
  isValid: boolean
  document: Document | null
  error?: string
}

export const verificationService = {
  generateVerificationLink: (documentId: string, hash: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://univerify.vercel.app'
    return `${baseUrl}/verify/${documentId}/${hash}`
  },

  verifyDocument: async (documentId: string, hash: string): Promise<VerificationResult> => {
    try {
      const response = await serverApiService.verifyDocument(documentId)
      
      if (response.success) {
        return {
          isValid: true,
          document: {
            id: response.data.txId,
            txId: response.data.txId,
            filename: response.data.document.filename,
            contentType: response.data.document.contentType,
            size: response.data.document.size,
            owner: {
              _id: response.data.txId,
              walletAddress: response.data.document.owner.address,
              name: response.data.document.owner.name,
              email: response.data.document.owner.email
            },
            cloudinaryData: {
              publicId: response.data.txId,
              url: response.data.arweave.url,
              resourceType: response.data.document.contentType.split('/')[0],
              folder: 'documents',
              tags: [],
              etag: '',
              uploadedAt: response.data.document.uploadedAt
            },
            blockchainData: response.data.blockchain,
            hasChanged: response.data.verification.hasChanged,
            uploadedAt: response.data.document.uploadedAt,
            lastVerified: response.data.verification.verifiedAt,
            arweaveData: response.data.arweave,
            isOwner: true
          }
        }
      }

      return {
        isValid: false,
        document: null,
        error: 'Verification failed'
      }
    } catch (error) {
      return {
        isValid: false,
        document: null,
        error: error instanceof Error ? error.message : 'Failed to verify document'
      }
    }
  }
} 