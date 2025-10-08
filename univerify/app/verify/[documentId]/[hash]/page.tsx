"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, FileText, Clock, Download } from "lucide-react"
import { verificationService, type VerificationResult } from "@/lib/verification"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { serverApiService } from "@/lib/server-api"

export default function VerifyPage() {
  const params = useParams()
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyDocument = async () => {
      if (!params.documentId || !params.hash) return

      try {
        // Use the txId (hash parameter) directly with the server API
        const response = await serverApiService.verifyDocument(params.hash as string)
        
        if (response.success) {
          setResult({
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
          })
        } else {
          setResult({
            isValid: false,
            document: null,
            error: response.data?.message || 'Verification failed'
          })
        }
      } catch (error) {
        console.error("Verification error:", error)
        setResult({
          isValid: false,
          document: null,
          error: error instanceof Error ? error.message : 'Failed to verify document'
        })
        toast.error("Failed to verify document")
      } finally {
        setLoading(false)
      }
    }

    verifyDocument()
  }, [params.documentId, params.hash])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 mx-auto text-gray-400 animate-spin" />
          <h2 className="mt-4 text-xl font-semibold">Verifying document...</h2>
          <p className="mt-2 text-gray-500">Please wait while we verify the document's authenticity</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Document Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result?.isValid ? (
              <div className="space-y-6">
                <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <AlertDescription>This document is authentic and verified</AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-12 w-12 text-emerald-600" />
                      <div>
                        <h3 className="text-lg font-medium">{result.document?.filename}</h3>
                        <p className="text-sm text-gray-500">
                          Uploaded on{" "}
                          {new Date(result.document?.uploadedAt || "").toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => window.open(result.document?.cloudinaryData?.url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Document Owner</h4>
                      <p className="text-sm font-mono">{result.document?.owner?.walletAddress}</p>
                      {result.document?.owner?.name && (
                        <p className="text-sm text-gray-600">{result.document.owner.name}</p>
                      )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Document Status</h4>
                      <div className="flex items-center space-x-2">
                        {result.document?.hasChanged ? (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-600">Document has been modified</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm text-emerald-600">Document is unchanged</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Version Information</h4>
                      <p className="text-sm text-gray-600">
                        Version: {result.document?.blockchainData?.blockNumber || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Last verified: {result.document?.lastVerified ? 
                          new Date(result.document.lastVerified).toLocaleString() : 'Never'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500">Transaction Hash</h4>
                      <p className="text-sm font-mono break-all">{result.document?.blockchainData?.transactionHash}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500">Block Number</h4>
                      <p className="text-sm">{result.document?.blockchainData?.blockNumber}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500">Block Hash</h4>
                      <p className="text-sm font-mono break-all">{result.document?.blockchainData?.blockHash}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500">Contract Address</h4>
                      <p className="text-sm font-mono break-all">{result.document?.blockchainData?.contractAddress}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Alert className="bg-red-50 text-red-800 border-red-200">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription>
                    {result?.error || "This document could not be verified"}
                  </AlertDescription>
                </Alert>

                <div className="text-center">
                  <p className="text-gray-600">
                    The document may have been modified or the verification link may be invalid.
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="mt-4"
                    style={{ backgroundColor: "#000", color: "#fff", borderColor: "#000", borderRadius: "10px", padding: "10px 20px", fontSize: "14px" }}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 