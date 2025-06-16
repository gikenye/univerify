"use client"

import { useState, useEffect } from "react"
import { FileText, FileImage, File, Download, Share2, Search, CheckCircle } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Document } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { serverApiService } from "@/lib/server-api"
import { toast } from "react-hot-toast"
import { cn } from "@/lib/utils"

interface DocumentListProps {
  documents: Document[]
  onDocumentSelect: (document: Document) => void
}

export function DocumentList({ documents, onDocumentSelect }: DocumentListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "verified" | "shared">("all")
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = () => {
    window.location.reload()
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
    const isVerified = doc.lastVerified !== undefined
    const isShared = doc.arweaveData && Object.keys(doc.arweaveData).length > 0

    if (filter === "all") return matchesSearch
    if (filter === "verified") return matchesSearch && isVerified
    if (filter === "shared") return matchesSearch && isShared

    return matchesSearch
  })

  const getDocumentIcon = (contentType: string) => {
    if (contentType.includes("pdf")) {
      return <FileText className="h-10 w-10 text-red-500" />
    }
    if (contentType.includes("image")) {
      return <FileImage className="h-10 w-10 text-blue-500" />
    }
    if (contentType.includes("word") || contentType.includes("document")) {
      return <FileText className="h-10 w-10 text-blue-600" />
    }
    return <File className="h-10 w-10 text-gray-500" />
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateString))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            className={cn(buttonVariants({ 
              variant: filter === "all" ? "default" : "secondary",
              size: "sm"
            }))}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            className={cn(buttonVariants({ 
              variant: filter === "verified" ? "default" : "secondary",
              size: "sm"
            }))}
            onClick={() => setFilter("verified")}
          >
            Verified
          </Button>
          <Button 
            className={cn(buttonVariants({ 
              variant: filter === "shared" ? "default" : "secondary",
              size: "sm"
            }))}
            onClick={() => setFilter("shared")}
          >
            Shared
          </Button>
          <Button
            className={cn(buttonVariants({ 
              variant: "default",
              size: "sm"
            }))}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <File className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No documents found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? "Try a different search term" : "Upload your first document to get started"}
          </p>
          <Button
            className={cn(buttonVariants({ 
              variant: "default",
              size: "sm"
            }))}
            onClick={handleRefresh}
          >
            Refresh Documents
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-center p-4">
                  <div className="mr-4">{getDocumentIcon(document.contentType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">{document.filename}</h3>
                      {document.lastVerified && (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          <CheckCircle className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      )}
                      {document.arweaveData && Object.keys(document.arweaveData).length > 0 && (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                          <Share2 className="h-3 w-3 mr-1" /> Shared
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-sm text-gray-500">
                      <span>Uploaded: {formatDate(document.uploadedAt)}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{formatFileSize(document.size)}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 truncate">Owner: {document.owner.name}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button 
                      className={cn(buttonVariants({ 
                        variant: "secondary",
                        size: "sm"
                      }))}
                      onClick={() => window.open(document.cloudinaryData.url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      className={cn(buttonVariants({ 
                        variant: "default",
                        size: "sm"
                      }))}
                      onClick={() => onDocumentSelect(document)}
                    >
                      <Share2 className="h-4 w-4 mr-2" /> Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
