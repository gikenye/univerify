"use client"

import { useState, useEffect } from "react"
import { Wallet, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WalletConnectProps {
  onConnect: (address: string) => void
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

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false)
  const [isPendingRequest, setIsPendingRequest] = useState(false)

  useEffect(() => {
    // Check if MetaMask is installed when component mounts
    setIsMetaMaskInstalled(typeof window !== "undefined" && !!window.ethereum?.isMetaMask)

    // Add event listeners for MetaMask state changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        onConnect(accounts[0])
      }
      setIsPendingRequest(false)
      setIsConnecting(false)
    }

    const handleChainChanged = () => {
      window.location.reload()
    }

    const ethereum = window.ethereum
    if (ethereum?.on) {
      ethereum.on('accountsChanged', handleAccountsChanged)
      ethereum.on('chainChanged', handleChainChanged)
    }

    // Cleanup function
    return () => {
      if (ethereum?.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged)
        ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [onConnect])

  const connectWallet = async () => {
    if (isConnecting || isPendingRequest) return
    
    setIsConnecting(true)
    setError(null)
    setIsPendingRequest(true)

    try {
      if (!isMetaMaskInstalled) {
        throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
      }

      if (!window.ethereum) {
        throw new Error("MetaMask provider not found. Please make sure MetaMask is properly installed.")
      }

      // Check if there's already a pending request
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      
      if (accounts && accounts.length > 0) {
        onConnect(accounts[0])
      } else {
        throw new Error("No accounts found. Please make sure you're logged into MetaMask.")
      }
    } catch (err: any) {
      console.error("Error connecting wallet:", err)
      if (err.code === -32002) {
        setError("A connection request is already pending. Please check your MetaMask extension.")
      } else {
        setError(err.message || "Failed to connect. Please try again.")
      }
    } finally {
      setIsConnecting(false)
      // Only reset pending request if it wasn't a pending request error
      if (!error?.includes("already pending")) {
        setIsPendingRequest(false)
      }
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
        disabled={isConnecting || !isMetaMaskInstalled || isPendingRequest} 
        className="w-full" 
        size="lg"
      >
        <Wallet className="mr-2 h-5 w-5" />
        {isConnecting ? "Connecting..." : isPendingRequest ? "Request Pending..." : isMetaMaskInstalled ? "Connect Account" : "MetaMask Not Found"}
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
