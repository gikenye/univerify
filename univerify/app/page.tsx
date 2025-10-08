"use client"

import { Layout } from "@/components/layout"
import { AuthScreen } from "@/components/auth-screen"
import { Dashboard } from "@/components/dashboard"
import { useAuth } from "@/lib/auth-context"

export default function Home() {
  const { user, isLoading } = useAuth()

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
      {!user ? (
        <AuthScreen />
      ) : (
        <Dashboard 
          userType={user.type} 
          user={{
            address: user.walletAddress,
            name: user.name,
            email: user.email
          }} 
        />
      )}
    </Layout>
  )
}
