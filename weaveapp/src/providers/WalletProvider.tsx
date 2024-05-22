"use client";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import {
  phantomWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { WagmiProvider } from "wagmi";
import { baseSepolia, bscTestnet } from "wagmi/chains";

// const config = getDefaultConfig({
//   projectId: "9d5577b590aa046985d5b2659120032b",
//   appName: "My RainbowKit App",
//   chains: [mainnet, polygon, optimism, arbitrum, base, zora, bscTestnet],
//   ssr: true,
// });

const config = getDefaultConfig({
  appName: "weaveswap",
  projectId: "9d5577b590aa046985d5b2659120032b",
  chains: [bscTestnet, baseSepolia],
  
  wallets: [
    {
      groupName: "Recommended",
      wallets: [rainbowWallet, walletConnectWallet, phantomWallet],
    },
  ],
});

const queryClient = new QueryClient();

const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Toaster richColors position="top-center" closeButton />
          {/* <main
            className={`p-5 ${path !== "/" ? "justify-between gap-10 bg-black" : " "} flex min-h-[100vh] flex-col `}
          >
          </main> */}
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default WalletProvider;
