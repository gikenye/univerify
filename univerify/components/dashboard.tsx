"use client"

import { useState, useEffect } from "react"
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
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const fetchDocuments = async () => {
      if (activeTab === "my-documents" && isClient) {
        setIsLoading(true)
        try {
          const response = await serverApiService.getUserDocuments()
          if (response.success && response.data?.documents) {
            // Access the nested documents array
            setDocuments(Array.isArray(response.data.documents) ? response.data.documents : [])
          } else {
            toast.error("Failed to fetch documents")
            setDocuments([])
          }
        } catch (error) {
          console.error("Error fetching documents:", error)
          toast.error("Failed to fetch documents")
          setDocuments([])
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchDocuments()
  }, [activeTab, isClient])

  const handleDocumentUpload = async (newDocument: Document) => {
    try {
      setDocuments(prevDocuments => [...prevDocuments, newDocument])
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

  // Don't render anything during SSR
  if (!isClient) {
    return null
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
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading documents...</p>
            </div>
          ) : (
            <DocumentList documents={documents} onDocumentSelect={handleDocumentSelect} />
          )}
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
