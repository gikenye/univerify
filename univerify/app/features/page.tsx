"use client"

import { FileCheck, Shield, Lock, Share2, Clock, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function FeaturesPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <FileCheck className="h-16 w-16 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Features</h1>
          <p className="text-xl text-gray-600">
            Discover how UniVerify is transforming document verification
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-6 w-6 mr-2 text-emerald-600" />
                Blockchain Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Every document is verified and stored on the blockchain, ensuring immutability and 
                providing a permanent record of authenticity. Our advanced verification system 
                detects any modifications to documents.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-6 w-6 mr-2 text-emerald-600" />
                Secure Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Your documents are encrypted and securely stored using industry-leading security 
                protocols. We use advanced encryption methods to ensure your data remains private 
                and protected.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Share2 className="h-6 w-6 mr-2 text-emerald-600" />
                Easy Sharing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Share verified documents with anyone using secure, unique verification links. 
                Recipients can instantly verify the authenticity of shared documents without 
                needing an account.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-6 w-6 mr-2 text-emerald-600" />
                Instant Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Verify documents instantly with our real-time verification system. No more waiting 
                for manual verification processes or dealing with paper-based systems.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2 text-emerald-600" />
                  Time Saving
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Reduce verification time from days to seconds with our automated blockchain-based 
                  verification system.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2 text-emerald-600" />
                  Cost Effective
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Eliminate the costs associated with manual verification processes and paper-based 
                  document management.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2 text-emerald-600" />
                  Environmentally Friendly
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Reduce paper usage and carbon footprint by moving to a completely digital 
                  verification system.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 