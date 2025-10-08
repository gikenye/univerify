'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface WalletContextType {
  isConnected: boolean
  address: string | null
  isConnecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  address: null,
  isConnecting: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
})

export const useWallet = () => useContext(WalletContext)

const WALLET_STORAGE_KEY = 'wallet_connected'
const WALLET_ADDRESS_KEY = 'wallet_address'

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask
  }, [])

  // Handle account changes
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected
      setIsConnected(false)
      setAddress(null)
      localStorage.removeItem(WALLET_STORAGE_KEY)
      localStorage.removeItem(WALLET_ADDRESS_KEY)
    } else {
      // User switched accounts
      const newAddress = accounts[0]
      setAddress(newAddress)
      setIsConnected(true)
      localStorage.setItem(WALLET_STORAGE_KEY, 'true')
      localStorage.setItem(WALLET_ADDRESS_KEY, newAddress)
    }
  }, [])

  // Handle chain changes
  const handleChainChanged = useCallback(() => {
    // Reload the page when chain changes to avoid issues
    window.location.reload()
  }, [])

  // Connect to MetaMask
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.')
      return
    }

    if (isConnecting) return

    setIsConnecting(true)
    setError(null)

    try {
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts',
      })

      if (accounts && accounts.length > 0) {
        const walletAddress = accounts[0]
        setAddress(walletAddress)
        setIsConnected(true)
        localStorage.setItem(WALLET_STORAGE_KEY, 'true')
        localStorage.setItem(WALLET_ADDRESS_KEY, walletAddress)
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err)
      if (err.code === 4001) {
        setError('Connection rejected by user')
      } else if (err.code === -32002) {
        setError('Connection request already pending. Please check MetaMask.')
      } else {
        setError('Failed to connect wallet. Please try again.')
      }
    } finally {
      setIsConnecting(false)
    }
  }, [isMetaMaskInstalled, isConnecting])

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setIsConnected(false)
    setAddress(null)
    setError(null)
    localStorage.removeItem(WALLET_STORAGE_KEY)
    localStorage.removeItem(WALLET_ADDRESS_KEY)
  }, [])

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) return

      try {
        // Check if user was previously connected
        const wasConnected = localStorage.getItem(WALLET_STORAGE_KEY) === 'true'
        const storedAddress = localStorage.getItem(WALLET_ADDRESS_KEY)

        if (wasConnected && storedAddress) {
          // Check if MetaMask still has accounts connected
          const accounts = await window.ethereum!.request({
            method: 'eth_accounts',
          })

          if (accounts && accounts.length > 0 && accounts[0] === storedAddress) {
            setAddress(storedAddress)
            setIsConnected(true)
          } else {
            // Clear stale data
            localStorage.removeItem(WALLET_STORAGE_KEY)
            localStorage.removeItem(WALLET_ADDRESS_KEY)
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
        // Clear potentially corrupted data
        localStorage.removeItem(WALLET_STORAGE_KEY)
        localStorage.removeItem(WALLET_ADDRESS_KEY)
      }
    }

    checkConnection()
  }, [isMetaMaskInstalled])

  // Set up event listeners
  useEffect(() => {
    if (!isMetaMaskInstalled()) return

    const ethereum = window.ethereum!

    // Add event listeners
    ethereum.on?.('accountsChanged', handleAccountsChanged)
    ethereum.on?.('chainChanged', handleChainChanged)

    // Cleanup function
    return () => {
      ethereum.removeListener?.('accountsChanged', handleAccountsChanged)
      ethereum.removeListener?.('chainChanged', handleChainChanged)
    }
  }, [isMetaMaskInstalled, handleAccountsChanged, handleChainChanged])

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        isConnecting,
        error,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}