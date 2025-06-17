"use client"

import { useState, useEffect } from "react"
import { Wallet, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WalletConnectProps {
  onConnect: (address: string) => void
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false)

  useEffect(() => {
    // Check if MetaMask is installed when component mounts
    setIsMetaMaskInstalled(typeof window !== "undefined" && !!window.ethereum?.isMetaMask)
  }, [])

  const connectWallet = async () => {
    if (isConnecting) return // Prevent multiple simultaneous connection attempts
    
    setIsConnecting(true)
    setError(null)

    try {
      // Check if MetaMask is installed
      if (!isMetaMaskInstalled) {
        throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
      }

      // Check if window.ethereum is available
      if (!window.ethereum) {
        throw new Error("MetaMask provider not found. Please make sure MetaMask is properly installed.")
      }

      // Request account access with a timeout
      const accounts = await Promise.race([
        window.ethereum.request({ method: "eth_requestAccounts" }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Connection request timed out")), 10000)
        )
      ])

      if (accounts && accounts.length > 0) {
        onConnect(accounts[0])
      } else {
        throw new Error("No accounts found. Please make sure you're logged into MetaMask.")
      }
    } catch (err: any) {
      console.error("Error connecting wallet:", err)
      setError(err.message || "Failed to connect. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button 
        onClick={connectWallet} 
        disabled={isConnecting || !isMetaMaskInstalled} 
        className="w-full" 
        size="lg"
      >
        <Wallet className="mr-2 h-5 w-5" />
        {isConnecting ? "Connecting..." : isMetaMaskInstalled ? "Connect Account" : "MetaMask Not Found"}
      </Button>

      {!isMetaMaskInstalled && (
        <p className="text-sm text-yellow-600 text-center">
          Please install MetaMask to connect your wallet
        </p>
      )}

      <p className="text-xs text-gray-500 text-center mt-2">
        We use secure technology to protect your information and documents. Your data remains private and under your
        control.
      </p>
    </div>
  )
}

// Add TypeScript interface for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      isMetaMask?: boolean
      on?: (event: string, handler: (...args: any[]) => void) => void
      removeListener?: (event: string, handler: (...args: any[]) => void) => void
    }
  }
}
