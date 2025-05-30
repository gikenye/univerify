"use client"

import type React from "react"

import { useState } from "react"
import { Share2, Copy, CheckCircle, FileText, User, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Document } from "@/components/dashboard"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DocumentSharingProps {
  document: Document | null
  userType: "individual" | "organization" | null
}

export function DocumentSharing({ document, userType }: DocumentSharingProps) {
  const [email, setEmail] = useState("")
  const [shareMethod, setShareMethod] = useState<"link" | "email">("link")
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)

  // Generate a sample verification link
  const verificationLink = document
    ? `https://univerify.example/verify/${document.hash}`
    : "https://univerify.example/verify/sample"

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    // Simulate sharing process
    setShared(true)
    setTimeout(() => setShared(false), 3000)
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
          <h2 className="text-xl font-semibold">{document.name}</h2>
          <p className="text-sm text-gray-500">
            Uploaded on{" "}
            {new Intl.DateTimeFormat("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(document.uploadDate)}
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
                    className="rounded-l-none"
                    variant={copied ? "default" : "secondary"}
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
              <Button onClick={handleShare} className="w-full">
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
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Verified
              </Badge>
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
                  <div className="space-y-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Document Uploaded</span>
                      <span className="text-xs text-gray-500">
                        {new Intl.DateTimeFormat("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        }).format(document.uploadDate)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {userType === "individual" ? (
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" /> Uploaded by you
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Building2 className="h-3 w-3 mr-1" /> Uploaded by your organization
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-3 flex flex-col items-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle className="h-3 w-3 text-emerald-600" />
                    </div>
                    <div className="h-full w-px bg-gray-200"></div>
                  </div>
                  <div className="space-y-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Document Verified</span>
                      <span className="text-xs text-gray-500">
                        {new Intl.DateTimeFormat("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        }).format(new Date(document.uploadDate.getTime() + 60000))}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Document hash verified and recorded securely</p>
                  </div>
                </div>

                {document.shared && (
                  <div className="flex">
                    <div className="mr-3 flex flex-col items-center">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                        <Share2 className="h-3 w-3 text-blue-600" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Document Shared</span>
                        <span className="text-xs text-gray-500">
                          {new Intl.DateTimeFormat("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                          }).format(new Date(document.uploadDate.getTime() + 120000))}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Shared with recipient@example.com</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Badge({
  children,
  variant,
  className,
}: {
  children: React.ReactNode
  variant?: "default" | "outline"
  className?: string
}) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}
