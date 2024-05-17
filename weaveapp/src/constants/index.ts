import { IconType } from "@/components";
import {
  poolAbi,
  swapAbi,
  lendAbi,
  lendingPoolAbi,
  borrowAbi,
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

const lend = "0x5b4d332D6dfeBa4a460A4550c7DA8c050C84eb17";
const borrow = "0x8e2E68BBefCCFcbD4E15F2C5EF7650293437dA26";
const pool = "0x0E25e4BD335CF2BaA6f3853c3A642Fd9fA6a6090";
const tokenA = "0xc71a8be9b0d8d7997681625555095016e634c8E5";
const tokenB = "0x4C3bDBdaA99353f8d41E7b4a48ef5bb5F07b5659";
const tokenC = "0x26d02cA984Ae9d1f96238828672255d5409679df";
const swap = "0xE038650Ba72157cf09807283125cE9A6fDa4cc93";
const poolTracker = "0x0E25e4BD335CF2BaA6f3853c3A642Fd9fA6a6090";

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
  lend,
  pool,
  swap,
  tokenA,
  tokenB,
  tokenC,
  poolAbi,
  swapAbi,
  lendAbi,
  lendingPoolAbi,
  borrow,
  borrowAbi,
  tokenOptions,
  poolTracker,
  poolTrackerAbi,
};

export { type AssetName, type Tokens };
