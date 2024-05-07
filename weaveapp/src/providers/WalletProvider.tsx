"use client";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  zora,
  bscTestnet,
} from "wagmi/chains";
import { usePathname } from "next/navigation";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  rainbowWallet,
  walletConnectWallet,
  phantomWallet,
  metaMaskWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig } from "wagmi";
import { Toaster } from "sonner";

// const config = getDefaultConfig({
//   projectId: "9d5577b590aa046985d5b2659120032b",
//   appName: "My RainbowKit App",
//   chains: [mainnet, polygon, optimism, arbitrum, base, zora, bscTestnet],
//   ssr: true,
// });

const config = getDefaultConfig({
  appName: "RainbowKit demo",
  projectId: "9d5577b590aa046985d5b2659120032b",
  chains: [bscTestnet],
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
