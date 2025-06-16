import { ethers } from 'ethers';

// Interface for Ethereum window object
declare global {
  interface Window {
    ethereum?: any;
  }
}

export const walletService = {
  isMetaMaskInstalled: (): boolean => {
    return typeof window !== 'undefined' && !!window.ethereum;
  },

  getProvider: (): ethers.BrowserProvider | null => {
    if (!walletService.isMetaMaskInstalled()) {
      return null;
    }
    return new ethers.BrowserProvider(window.ethereum);
  },

  connectWallet: async (): Promise<string | null> => {
    try {
      if (!walletService.isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed');
      }

      const provider = walletService.getProvider();
      if (!provider) return null;

      // Request account access
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts && accounts.length > 0) {
        return accounts[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      return null;
    }
  },

  getConnectedAccount: async (): Promise<string | null> => {
    try {
      if (!walletService.isMetaMaskInstalled()) {
        return null;
      }

      const provider = walletService.getProvider();
      if (!provider) return null;

      const accounts = await provider.send('eth_accounts', []);
      
      if (accounts && accounts.length > 0) {
        return accounts[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error getting connected account:', error);
      return null;
    }
  },

  // Sign a message to verify ownership of the wallet
  signMessage: async (message: string): Promise<string | null> => {
    try {
      if (!walletService.isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed');
      }

      const provider = walletService.getProvider();
      if (!provider) return null;

      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);
      
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      return null;
    }
  },
}; 