"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Document } from "@/components/dashboard"

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

    // Check file size (10MB limit for example)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit")
      return
    }

    setFile(file)
  }

  const uploadFile = () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    // Simulate file upload with progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 5
      })
    }, 200)

    // Simulate API call to upload file
    setTimeout(() => {
      clearInterval(interval)
      setUploadProgress(100)
      setUploading(false)
      setUploadComplete(true)

      // Create a new document object
      const newDocument: Document = {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        uploadDate: new Date(),
        size: file.size,
        hash: `QmX${Math.random().toString(36).substring(2, 40)}`,
        verified: true,
        shared: false,
        type: file.name.split(".").pop() || "",
        changelog: [
          {
            action: "Upload",
            timestamp: new Date(),
            user: userType === "individual" ? "You" : "Your Organization",
          },
        ],
      }

      onDocumentUpload(newDocument)
    }, 4000)
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
                  {!uploading && !uploadComplete && <Button onClick={uploadFile}>Upload</Button>}
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
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
