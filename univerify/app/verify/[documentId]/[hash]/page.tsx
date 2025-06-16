"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, FileText, Clock } from "lucide-react"
import { verificationService, type VerificationResult } from "@/lib/verification"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function VerifyPage() {
  const params = useParams()
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyDocument = async () => {
      if (!params.documentId || !params.hash) return

      try {
        const verificationResult = await verificationService.verifyDocument(
          params.documentId as string,
          params.hash as string
        )
        setResult(verificationResult)
      } catch (error) {
        console.error("Verification error:", error)
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