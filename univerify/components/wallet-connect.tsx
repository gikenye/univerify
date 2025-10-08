"use client"

import { useEffect } from "react"
import { Wallet, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWallet } from "@/lib/wallet-context"

interface WalletConnectProps {
  onConnect?: (address: string) => void
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const { isConnected, address, isConnecting, error, connect } = useWallet()

  // Call onConnect when wallet connects
  useEffect(() => {
    if (isConnected && address && onConnect) {
      onConnect(address)
    }
  }, [isConnected, address, onConnect])

  const handleConnect = async () => {
    await connect()
  }

  if (isConnected && address) {
    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Connected to {address.slice(0, 6)}...{address.slice(-4)}
          </AlertDescription>
        </Alert>
        <p className="text-xs text-gray-500 text-center">
          Your wallet is connected and ready to use.
        </p>
      </div>
    )
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
        onClick={handleConnect} 
        disabled={isConnecting} 
        className="w-full" 
        size="lg"
      >
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
