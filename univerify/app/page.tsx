"use client"

import { useState, useEffect } from "react"
import { Layout } from "@/components/layout"
import { AuthScreen } from "@/components/auth-screen"
import { Dashboard } from "@/components/dashboard"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState<"individual" | "organization" | null>(null)
  const [user, setUser] = useState<{ address: string; name?: string; email?: string } | null>(null)
  const { user: authUser, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setIsAuthenticated(true)
        setUserType(userData.userType || 'individual')
        setUser({
          address: userData.walletAddress,
          name: userData.name,
          email: userData.email
        })
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        // Clear invalid data and logout
        logout()
        setIsAuthenticated(false)
        setUserType(null)
        setUser(null)
      }
    } else {
      // If no token or user data, ensure we're logged out
      setIsAuthenticated(false)
      setUserType(null)
      setUser(null)
    }
  }, [logout])

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
