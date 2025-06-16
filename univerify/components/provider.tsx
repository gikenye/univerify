"use client";

import { Web3AuthProvider } from "@web3auth/modal/react";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import React from "react";
import type { Web3AuthContextConfig } from "@web3auth/modal/react";

// Use environment variable for client ID
const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ";

const queryClient = new QueryClient();

// Create Wagmi config
const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

// Create Web3Auth configuration object
const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET
  },
};

export default function Provider({ 
  children, 
  web3authInitialState 
}: { 
  children: React.ReactNode;
  web3authInitialState?: any;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <Web3AuthProvider config={web3AuthContextConfig} web3authInitialState={web3authInitialState}>
          {children}
        </Web3AuthProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}