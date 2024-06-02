import WalletProvider from "./WalletProvider";
import { createConfig, http } from "@wagmi/core";
import { baseSepolia } from "@wagmi/core/chains";

const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
});

export { WalletProvider, config };
