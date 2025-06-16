"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Document } from "@/types"
import { serverApiService, uploadUtils } from "@/lib/server-api"
import { toast } from "sonner"

interface DocumentUploadProps {
  onDocumentUpload: (document: Document) => void
  userType: "individual" | "organization" | null
}

export function DocumentUpload({ onDocumentUpload, userType }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    // Reset states
    setError(null)
    setUploadComplete(false)

    // Validate file
    const validation = uploadUtils.validateFile(file, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
      ]
    })

    if (!validation.valid) {
      setError(validation.error || "Invalid file")
      return
    }

    setFile(file)
  }

  const uploadFile = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Check if we have a valid token
      const token = serverApiService.getAuthToken()
      if (!token) {
        throw new Error('Authentication token is required for file upload')
      }

      const result = await uploadUtils.uploadWithProgress(file, {
        onProgress: (progress) => {
          setUploadProgress(progress)
        },
        onTransactionHash: (hash) => {
          console.log('Transaction hash:', hash)
        }
      })

      // Create a new document object from the API response
      const newDocument: Document = {
        _id: result.data.file.id,
        txId: result.data.blockchain.transaction_hash,
        filename: result.data.file.original_name,
        contentType: file.type,
        size: result.data.file.size,
        originalHash: result.data.blockchain.transaction_hash,
        currentHash: result.data.blockchain.transaction_hash,
        owner: result.data.file.user_info.name,
        ownerAddress: result.data.file.uploaded_by,
        cloudinaryData: {
          publicId: result.data.file.id,
          url: result.data.file.url,
          resourceType: file.type.split('/')[0],
          folder: 'documents',
          tags: [],
          etag: '',
          uploadedAt: new Date().toISOString()
        },
        blockchainData: {
          transactionHash: result.data.blockchain.transaction_hash,
          blockNumber: result.data.blockchain.block_number,
          blockHash: '',
          contractAddress: '',
          gasUsed: 0,
          status: result.data.blockchain.status,
          confirmations: 0,
          timestamp: result.data.blockchain.timestamp
        },
        hasChanged: false,
        uploadedAt: new Date().toISOString(),
        verificationHistory: [],
        shares: [],
        lastVerified: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setUploadComplete(true)
      onDocumentUpload(newDocument)
      toast.success("Document uploaded successfully!")
    } catch (error) {
      console.error("Upload error:", error)
      setError(error instanceof Error ? error.message : "Failed to upload document")
      toast.error("Failed to upload document. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Upload a New Document</h2>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {uploadComplete && (
          <Alert className="mb-4 bg-emerald-50 text-emerald-800 border-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <AlertDescription>Document uploaded and verified successfully!</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                isDragging ? "border-emerald-500 bg-emerald-50" : "border-gray-300"
              } transition-colors duration-200`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <Upload className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium">Drag and drop your document here</p>
                  <p className="text-sm text-gray-500 mt-1">or</p>
                </div>
                <Button onClick={triggerFileInput} variant="outline" type="button">
                  Browse Files
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInput}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-gray-500">Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
              </div>
            </div>

            {file && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-emerald-600" />
                  <div className="flex-1">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  {!uploading && !uploadComplete && <Button onClick={uploadFile} variant="default">Upload</Button>}
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-gray-500 text-center">
                      {uploadProgress === 100 ? "Finalizing..." : `Uploading... ${uploadProgress}%`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">What happens when you upload?</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
            <li>Your document is securely uploaded and encrypted</li>
            <li>A unique verification record is created</li>
            <li>You maintain full control over who can access your document</li>
            <li>The document can be verified by recipients without compromising security</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
