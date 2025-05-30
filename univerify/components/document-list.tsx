"use client"

import { useState } from "react"
import { FileText, FileImage, File, Download, Share2, Search, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Document } from "@/components/dashboard"
import { Badge } from "@/components/ui/badge"

interface DocumentListProps {
  documents: Document[]
  onDocumentSelect: (document: Document) => void
}

export function DocumentList({ documents, onDocumentSelect }: DocumentListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "verified" | "shared">("all")

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())

    if (filter === "all") return matchesSearch
    if (filter === "verified") return matchesSearch && doc.verified
    if (filter === "shared") return matchesSearch && doc.shared

    return matchesSearch
  })

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-10 w-10 text-red-500" />
      case "jpg":
      case "jpeg":
      case "png":
        return <FileImage className="h-10 w-10 text-blue-500" />
      case "doc":
      case "docx":
        return <FileText className="h-10 w-10 text-blue-600" />
      default:
        return <File className="h-10 w-10 text-gray-500" />
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
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
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            All
          </Button>
          <Button
            variant={filter === "verified" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("verified")}
          >
            Verified
          </Button>
          <Button variant={filter === "shared" ? "default" : "outline"} size="sm" onClick={() => setFilter("shared")}>
            Shared
          </Button>
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <File className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No documents found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? "Try a different search term" : "Upload your first document to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-center p-4">
                  <div className="mr-4">{getDocumentIcon(document.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">{document.name}</h3>
                      {document.verified && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          <CheckCircle className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      )}
                      {document.shared && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Share2 className="h-3 w-3 mr-1" /> Shared
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-sm text-gray-500">
                      <span>Uploaded: {formatDate(document.uploadDate)}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{formatFileSize(document.size)}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 truncate">Hash: {document.hash}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => onDocumentSelect(document)}>
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
