"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import React from "react";
import { AuthProvider } from "@/lib/auth-context";

const queryClient = new QueryClient();

// Create Wagmi config
const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

export default function Provider({ 
  children
}: { 
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}