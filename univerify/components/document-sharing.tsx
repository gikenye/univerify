"use client"

import type React from "react"

import { useState } from "react"
import { Share2, Copy, CheckCircle, FileText, User, Building2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Document } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge as UIBadge } from "@/components/ui/badge"
import { verificationService } from "@/lib/verification"
import { serverApiService } from "@/lib/server-api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface DocumentSharingProps {
  document: Document | null
  userType: "individual" | "organization" | null
}

export function DocumentSharing({ document, userType }: DocumentSharingProps) {
  const [email, setEmail] = useState("")
  const [shareMethod, setShareMethod] = useState<"link" | "email">("link")
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Generate verification link using the service
  const verificationLink = document
    ? verificationService.generateVerificationLink(document.id, document.txId)
    : ""

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationLink)
    setCopied(true)
    toast.success("Verification link copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (!document || !email) return

    try {
      const response = await serverApiService.shareDocument(document.id, email)
      if (response.success) {
        setShared(true)
        toast.success("Document shared successfully")
        setTimeout(() => setShared(false), 3000)
      } else {
        toast.error(response.message || "Failed to share document")
      }
    } catch (error) {
      toast.error("Failed to share document. Please try again.")
      console.error("Share error:", error)
    }
  }

  const handleVerify = async () => {
    if (!document) return

    setIsVerifying(true)
    try {
      const result = await verificationService.verifyDocument(document.id, document.txId)
      if (result.isValid) {
        toast.success("Document verified successfully")
      } else {
        toast.error(result.error || "Document verification failed")
      }
    } catch (error) {
      toast.error("Failed to verify document. Please try again.")
      console.error("Verification error:", error)
    } finally {
      setIsVerifying(false)
    }
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <Share2 className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No document selected</h3>
        <p className="mt-1 text-sm text-gray-500">Select a document from your list to share or verify</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <FileText className="h-10 w-10 text-emerald-600" />
        <div>
          <h2 className="text-xl font-semibold">{document.filename}</h2>
          <p className="text-sm text-gray-500">
            Uploaded on{" "}
            {new Intl.DateTimeFormat("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(new Date(document.uploadedAt))}
          </p>
        </div>
      </div>

      {shared && (
        <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <AlertDescription>Document shared successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Share Document</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="link" onValueChange={(value) => setShareMethod(value as "link" | "email")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="link">Share via Link</TabsTrigger>
              <TabsTrigger value="email">Share via Email</TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link">Verification Link</Label>
                <div className="flex">
                  <Input id="link" value={verificationLink} readOnly className="flex-1 rounded-r-none" />
                  <Button
                    onClick={handleCopyLink}
                    className={cn(buttonVariants({ 
                      variant: copied ? "default" : "secondary",
                      size: "default"
                    }), "rounded-l-none")}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" /> Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">Anyone with this link can verify this document's authenticity</p>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Recipient's Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter recipient's email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleShare} 
                className={cn(buttonVariants({ 
                  variant: "default",
                  size: "default"
                }), "w-full")}
              >
                <Share2 className="h-4 w-4 mr-2" /> Share Document
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span className="font-medium">Verification Status</span>
              </div>
              <UIBadge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {document.lastVerified ? "Verified" : "Not Verified"}
              </UIBadge>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Document History</h3>
              <div className="space-y-3">
                <div className="flex">
                  <div className="mr-3 flex flex-col items-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle className="h-3 w-3 text-emerald-600" />
                    </div>
                    <div className="h-full w-px bg-gray-200"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Document Uploaded</span>
                      <span className="text-xs text-gray-500">
                        {new Intl.DateTimeFormat("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }).format(new Date(document.uploadedAt))}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Document was uploaded and stored on the blockchain</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
