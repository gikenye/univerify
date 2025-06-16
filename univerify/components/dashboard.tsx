"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentUpload } from "@/components/document-upload"
import { DocumentList } from "@/components/document-list"
import { DocumentSharing } from "@/components/document-sharing"
import { serverApiService, uploadUtils } from "@/lib/server-api"
import { Document } from "@/types"
import { toast } from "sonner"

interface DashboardProps {
  userType: "individual" | "organization" | null
  user: { address: string; name?: string; email?: string } | null
}

export function Dashboard({ userType, user }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("my-documents")
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])

  const handleDocumentUpload = async (newDocument: Document) => {
    try {
      // Add the new document to the state
      setDocuments(prevDocuments => [...prevDocuments, newDocument])
      
      // Switch to the documents tab to show the uploaded file
      setActiveTab("my-documents")
    } catch (error) {
      console.error("Error handling document upload:", error)
      toast.error("Failed to process uploaded document")
    }
  }

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document)
    setActiveTab("share")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || "User"}</h1>
          <p className="text-gray-600">
            {userType === "individual" ? "Manage your personal documents" : "Manage your organization's documents"}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>
            Connected as {user?.address?.substring(0, 6)}...{user?.address?.substring(user.address.length - 4)}
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="my-documents">My Documents</TabsTrigger>
          <TabsTrigger value="upload">Upload Document</TabsTrigger>
          <TabsTrigger value="share">Share & Verify</TabsTrigger>
        </TabsList>

        <TabsContent value="my-documents" className="space-y-4">
          <DocumentList documents={documents} onDocumentSelect={handleDocumentSelect} />
        </TabsContent>

        <TabsContent value="upload">
          <DocumentUpload onDocumentUpload={handleDocumentUpload} userType={userType} />
        </TabsContent>

        <TabsContent value="share">
          <DocumentSharing document={selectedDocument} userType={userType} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
