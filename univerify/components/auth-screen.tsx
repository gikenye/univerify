"use client"

import { useState } from "react"
import { FileCheck, User, Building2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { IndividualSignup } from "@/components/individual-signup"
import { OrganizationSignup } from "@/components/organization-signup"
import { WalletConnect } from "@/components/wallet-connect"

interface AuthScreenProps {
  onAuthenticate: (
    authenticated: boolean,
    type: "individual" | "organization" | null,
    userData: { address: string; name?: string; email?: string } | null,
  ) => void
}

export function AuthScreen({ onAuthenticate }: AuthScreenProps) {
  const [step, setStep] = useState<"select" | "connect" | "signup">("select")
  const [userType, setUserType] = useState<"individual" | "organization" | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  const handleTypeSelect = (type: "individual" | "organization") => {
    setUserType(type)
    setStep("connect")
  }

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address)
    setStep("signup")
  }

  const handleSignupComplete = (userData: { name?: string; email?: string }) => {
    if (walletAddress) {
      onAuthenticate(true, userType, { address: walletAddress, ...userData })
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <FileCheck className="h-16 w-16 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to UniVerify</h1>
        <p className="text-lg text-gray-600">Secure document verification and storage for everyone</p>
      </div>

      {step === "select" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" /> Individual
              </CardTitle>
              <CardDescription>For students, professionals, and personal use</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Upload and verify your personal documents securely. Share them with organizations or other individuals
                with complete control.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleTypeSelect("individual")} className="w-full">
                Continue as Individual <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" /> Organization
              </CardTitle>
              <CardDescription>For businesses, universities, and institutions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Manage, verify, and share official documents with enhanced security features and organizational
                controls.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleTypeSelect("organization")} className="w-full">
                Continue as Organization <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {step === "connect" && userType && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Connect Your Account</CardTitle>
            <CardDescription>
              {userType === "individual"
                ? "Connect your account to securely manage your documents"
                : "Connect your organization's account for document management"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalletConnect onConnect={handleWalletConnect} />
          </CardContent>
        </Card>
      )}

      {step === "signup" && userType && walletAddress && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{userType === "individual" ? "Complete Your Profile" : "Register Your Organization"}</CardTitle>
            <CardDescription>
              {userType === "individual"
                ? "Provide your information to complete your account setup"
                : "Provide your organization's details to complete registration"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userType === "individual" ? (
              <IndividualSignup onComplete={handleSignupComplete} />
            ) : (
              <OrganizationSignup onComplete={handleSignupComplete} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
