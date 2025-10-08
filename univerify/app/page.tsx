"use client"

import { useState, useEffect } from "react"
import { Layout } from "@/components/layout"
import { AuthScreen } from "@/components/auth-screen"
import { Dashboard } from "@/components/dashboard"
import { useAuth } from "@/lib/auth-context"
import { useWallet } from "@/lib/wallet-context"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState<"individual" | "organization" | null>(null)
  const [user, setUser] = useState<{ address: string; name?: string; email?: string } | null>(null)
  const { user: authUser, isLoading } = useAuth()
  const { isConnected, address } = useWallet()

  // Use auth context to determine authentication state
  useEffect(() => {
    if (authUser) {
      setIsAuthenticated(true)
      setUserType(authUser.type)
      setUser({
        address: authUser.walletAddress,
        name: authUser.name,
        email: authUser.email
      })
    } else {
      setIsAuthenticated(false)
      setUserType(null)
      setUser(null)
    }
  }, [authUser])

  const handleAuthentication = (
    authenticated: boolean,
    type: "individual" | "organization" | null,
    userData: { address: string; name?: string; email?: string } | null,
  ) => {
    setIsAuthenticated(authenticated)
    setUserType(type)
    setUser(userData)
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {!isAuthenticated ? (
        <AuthScreen onAuthenticate={handleAuthentication} />
      ) : (
        <Dashboard userType={userType} user={user} />
      )}
    </Layout>
  )
}
