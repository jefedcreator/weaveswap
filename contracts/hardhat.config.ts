import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

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
};

export default config;
