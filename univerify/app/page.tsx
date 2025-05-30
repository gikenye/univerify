"use client"

import { useState } from "react"
import { Layout } from "@/components/layout"
import { AuthScreen } from "@/components/auth-screen"
import { Dashboard } from "@/components/dashboard"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState<"individual" | "organization" | null>(null)
  const [user, setUser] = useState<{ address: string; name?: string; email?: string } | null>(null)

  const handleAuthentication = (
    authenticated: boolean,
    type: "individual" | "organization" | null,
    userData: { address: string; name?: string; email?: string } | null,
  ) => {
    setIsAuthenticated(authenticated)
    setUserType(type)
    setUser(userData)
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
