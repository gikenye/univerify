"use client"

import { useState, useEffect } from "react"
import { FileCheck, User, Building2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { IndividualSignup } from "@/components/individual-signup"
import { OrganizationSignup } from "@/components/organization-signup"
import { WalletConnect } from "@/components/wallet-connect"
import { toast } from "react-toastify"
import { serverApiService } from "@/lib/server-api"
import { useWallet } from "@/lib/wallet-context"

interface AuthScreenProps {
  onAuthenticate: (
    authenticated: boolean,
    type: "individual" | "organization" | null,
    userData: { address: string; name?: string; email?: string } | null,
  ) => void
}

export function AuthScreen({ onAuthenticate }: AuthScreenProps) {
  const [step, setStep] = useState<"select" | "connect" | "signup" | "login">("select")
  const [userType, setUserType] = useState<"individual" | "organization" | null>(null)
  const { isConnected, address } = useWallet()

  const handleTypeSelect = (type: "individual" | "organization") => {
    setUserType(type)
    setStep("connect")
  }

  // Handle wallet connection changes
  useEffect(() => {
    if (isConnected && address && userType && step === "connect") {
      handleWalletConnect(address)
    }
  }, [isConnected, address, userType, step])

  const handleWalletConnect = async (walletAddress: string) => {
    try {
      // Try to login first
      if (typeof window !== "undefined" && window.ethereum) {
        const message = `Sign this message to login to UniVerify with address ${walletAddress}`
        const signature = await window.ethereum.request({
          method: "personal_sign",
          params: [message, walletAddress],
        })

        const loginResponse = await serverApiService.login({
          walletAddress,
          signature,
          message,
        })

        if (loginResponse.success) {
          serverApiService.setAuthToken(loginResponse.data.token)
          // Store token and user data in localStorage
          localStorage.setItem('auth_token', loginResponse.data.token)
          localStorage.setItem('auth_user', JSON.stringify({
            ...loginResponse.data.user,
            userType: userType
          }))
          onAuthenticate(true, userType, {
            address: walletAddress,
            name: loginResponse.data.user.name,
            email: loginResponse.data.user.email,
          })
          toast.success("Successfully logged in!")
          return
        }
      } else {
        toast.error("MetaMask is not available.")
      }
    } catch (error) {
      console.log("Login failed:", error)
      toast.error("Login failed. Please try again.")
    }

    // If login fails, proceed to signup
    setStep("signup")
  }

  const handleSignupComplete = async (userData: { name: string; email: string }) => {
    if (!address) return

    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const message = `Sign this message to signup to UniVerify with address ${address}`
        const signature = await window.ethereum.request({
          method: "personal_sign",
          params: [message, address],
        })

        const signupResponse = await serverApiService.signup({
          walletAddress: address,
          signature,
          message,
          name: userData.name,
          email: userData.email,
        })

        if (signupResponse.success) {
          serverApiService.setAuthToken(signupResponse.data.token)
          // Store token and user data in localStorage
          localStorage.setItem('auth_token', signupResponse.data.token)
          localStorage.setItem('auth_user', JSON.stringify({
            ...signupResponse.data.user,
            userType: userType
          }))
          onAuthenticate(true, userType, {
            address: address,
            name: signupResponse.data.user.name,
            email: signupResponse.data.user.email,
          })
          toast.success("Successfully signed up!")
        }
      } else {
        toast.error("MetaMask is not available.")
      }
    } catch (error) {
      toast.error("Failed to complete signup. Please try again.")
      console.error("Signup failed:", error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
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
              <p className="text-sm text-gray-600">
                Upload and verify your personal documents securely. Share them with organizations or other individuals
                with complete control.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleTypeSelect("individual")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
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
              <p className="text-sm text-gray-600">
                Manage, verify, and share official documents with enhanced security features and organizational
                controls.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleTypeSelect("organization")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
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
            <WalletConnect />
          </CardContent>
        </Card>
      )}

      {step === "signup" && userType && address && (
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