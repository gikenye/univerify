"use client"

import { useState, useEffect } from "react"
import { FileText, Eye, ExternalLink, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Document } from "@/lib/types"
import { serverApiService } from "@/lib/server-api"
import { toast } from "sonner"

interface SharedDocumentsProps {
  onDocumentSelect?: (document: Document) => void
}

export function SharedDocuments({ onDocumentSelect }: SharedDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  useEffect(() => {
    const fetchSharedDocuments = async () => {
      try {
        const response = await serverApiService.getSharedDocuments()
        if (response.success && response.data?.documents) {
          setDocuments(Array.isArray(response.data.documents) ? response.data.documents : [])
        } else {
          setDocuments([])
        }
      } catch (error) {
        console.error("Error fetching shared documents:", error)
        toast.error("Failed to fetch shared documents")
        setDocuments([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSharedDocuments()
  }, [])

  const handleViewDocument = (document: Document) => {
    setSelectedDoc(document)
  }

  const handleOpenDocument = (document: Document) => {
    if (document.cloudinaryData?.url || document.arweaveData?.url) {
      const url = document.cloudinaryData?.url || document.arweaveData?.url
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      toast.error("Document URL not available")
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading shared documents...</p>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No shared documents</h3>
        <p className="mt-1 text-sm text-gray-500">Documents shared with you will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {documents.map((document) => (
          <Card key={document.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <FileText className="h-10 w-10 text-emerald-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {document.filename}
                    </h3>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>Shared by {document.owner?.name || document.owner?.walletAddress?.slice(0, 8) + '...'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        Read-only
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(document)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{document.filename}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Owner:</span>
                            <p className="text-gray-600">{document.owner?.name || document.owner?.walletAddress}</p>
                          </div>
                          <div>
                            <span className="font-medium">Uploaded:</span>
                            <p className="text-gray-600">{new Date(document.uploadedAt).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="font-medium">Size:</span>
                            <p className="text-gray-600">{(document.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <div>
                            <span className="font-medium">Type:</span>
                            <p className="text-gray-600">{document.contentType}</p>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            onClick={() => handleOpenDocument(document)}
                            className="flex items-center space-x-1"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>Open Document</span>
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="sm"
                    onClick={() => handleOpenDocument(document)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}