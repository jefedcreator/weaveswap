import "@nomicfoundation/hardhat-toolbox-viem";
import { HardhatUserConfig, vars } from "hardhat/config";

const BSCTEST_RPC_URL = vars.get("BSCTEST_RPC_URL");

const PRIVATE_KEY = vars.get("PRIVATE_KEY");

const BSCSCAN_API_KEY = vars.get("BSCSCAN_API_KEY");

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.9",
      },
      {
        version: "0.4.24",
      },
      {
        version: "0.8.7",
      },
      {
        version: "0.8.20",
      },
      {
        version: "0.8.24",
      },
    ],
  },
  networks: {
    bnbtestnet: {
      url: `https://api.zan.top/node/v1/bsc/testnet/public`,
      accounts: [PRIVATE_KEY],
      gasPrice: 8000000000,
    },
    basesepolia: {
      url: `https://base-sepolia.g.alchemy.com/v2/i05mxegOuaU4goDLCHtRCleHfK1TevYU`,
      accounts: [PRIVATE_KEY],
      gasPrice: 8000000000,
    },
  },
  etherscan: {
    apiKey: `AA2YKW2GKYJYCBMTCQHJMXB4J1HRXASSIN`,
    customChains: [
      {
        network: "basesepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "	https://sepolia-explorer.base.org"
        }
      }
    ]
  },
  
  ignition: {
    requiredConfirmations: 1,
  },
};

export default config;
