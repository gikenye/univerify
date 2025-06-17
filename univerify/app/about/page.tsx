"use client"

import { FileCheck, Shield, Globe, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <FileCheck className="h-16 w-16 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About UniVerify</h1>
          <p className="text-xl text-gray-600">
            Making document verification and sharing simple and trustworthy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-6 w-6 mr-2 text-emerald-600" />
                Project Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                UniVerify is a final year project that aims to create a simple and secure way to verify and share important documents. 
                Whether it's academic certificates, ID cards, or other important papers, this platform helps ensure they're 
                genuine and easy to share with others who need to verify them.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-6 w-6 mr-2 text-emerald-600" />
                Project Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                This project aims to make document verification and sharing as easy as sending a text message. No more waiting in long lines 
                or dealing with complicated paperwork. Just upload your document, and the platform helps you share it securely 
                with anyone who needs to verify or view it.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-6 w-6 mr-2 text-emerald-600" />
                Document Viewing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                When you share a document, recipients can not only verify its authenticity but also view the document directly in their browser. 
                This feature makes it easy to review documents without needing to download them or use special software. 
                The viewing experience is secure and user-friendly, ensuring that your documents are both accessible and protected.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 