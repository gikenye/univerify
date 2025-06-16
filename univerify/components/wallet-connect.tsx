"use client"

import { useState } from "react"
import { Wallet, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WalletConnectProps {
  onConnect: (address: string) => void
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectWallet = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })

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

      <Button onClick={connectWallet} disabled={isConnecting} className="w-full" size="lg">
        <Wallet className="mr-2 h-5 w-5" />
        {isConnecting ? "Connecting..." : "Connect Account"}
      </Button>

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
