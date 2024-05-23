import { IconType } from "@/components";
import {
  poolAbi,
  swapAbi,
  lendingTrackerAbi,
  lendingPoolAbi,
  borrowTrackerAbi,
  poolTrackerAbi,
} from "./abis";

// const lend = "0x15D7BdFc3Afc61544c6D9085dC4235f15B85a4C4";
// const borrow = "0xf95269C39EBaF3D75d3Fa67E2cCeDcB791507D28";
// const pool = "0x2eF926F54f7D767cbb7369d21A342DdB033D2024";
// const tokenA = "0x1F06aB1B322AcF25D52f9210c227692B8Bfac58F";
// const tokenB = "0xFcf351591C7A9D081D5b9c37Bbec3062EE03E235";
// const tokenC = "0x18c9504c02d97D41d518f6bF91faa9A8Fe8071D1";
// const swap = "0x3dfBF4C76f99Cc64BF69BAd9ed27DF567d488956";
// const poolTracker = "0x603D1517726A1b3A4BFA097eaBdB8A2d9F633Cf1";

const lendingTracker = "0xdc201b4A7fdc6DF8f2eFbdBB5AE8B51B0D6b1c5e";
const borrowingTracker = "0xE8C51886c3A6a9E363FeA4D719bcb6c5c9c0997d";
const pool = "0x76cC174Ba7BDa4D64C25695920cF2Ce3eac45272";
const tokenA = "0xE2BC56cF8df2Bfa0Cef383Ba459ab96b27566975";
const tokenB = "0xE013143Cd358063bD60151F15149FD54fb698067";
const tokenC = "0x53A1a3c974743f1A4549e86C9A9A51A5D94dF6A7";
const swap = "0x199b60088642AFEaeA2310cA5776a57CfDa56adE";
const poolTracker = "0xEa940e83c064b97B86c9E7959DB49dC4537d1934";

const assetName = ["Token A", "Token B", "Token C"] as const;
type AssetName = (typeof assetName)[number];
const tokens = [tokenA, tokenB, tokenC] as const;
type Tokens = (typeof tokens)[number];

interface ItokenOptions {
  label: string;
  value: string;
  icon: {
    1: IconType;
  };
}

const tokenOptions: ItokenOptions[] = [
  {
    label: "Token A",
    value: tokenA,
    icon: {
      1: "blylogo",
    },
  },
  {
    label: "Token B",
    value: tokenB,
    icon: {
      1: "clylogo",
    },
  },
  {
    label: "Token C",
    value: tokenC,
    icon: {
      1: "dotlogo",
    },
  },
];

export {
  borrowingTracker,
  pool,
  swap,
  tokenA,
  tokenB,
  tokenC,
  poolAbi,
  swapAbi,
  lendingTrackerAbi,
  lendingPoolAbi,
  lendingTracker,
  borrowTrackerAbi,
  tokenOptions,
  poolTracker,
  poolTrackerAbi,
  tokens
};

export { type AssetName, type Tokens };
