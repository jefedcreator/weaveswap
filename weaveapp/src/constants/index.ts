import { IconType } from "@/components";
import {
  poolAbi,
  swapAbi,
  lendAbi,
  lendingPoolAbi,
  borrowAbi,
  poolTrackerAbi,
} from "./abis";

const lend = "0x15D7BdFc3Afc61544c6D9085dC4235f15B85a4C4";
const borrow = "0xf95269C39EBaF3D75d3Fa67E2cCeDcB791507D28";
const pool = "0x2eF926F54f7D767cbb7369d21A342DdB033D2024";
const tokenA = "0x1F06aB1B322AcF25D52f9210c227692B8Bfac58F";
const tokenB = "0xFcf351591C7A9D081D5b9c37Bbec3062EE03E235";
const tokenC = "0x18c9504c02d97D41d518f6bF91faa9A8Fe8071D1";
const swap = "0x3dfBF4C76f99Cc64BF69BAd9ed27DF567d488956";
const poolTracker = "0x603D1517726A1b3A4BFA097eaBdB8A2d9F633Cf1";

const assetName = ["Token A", "Token B", "Token C"] as const;
type AssetName = (typeof assetName)[number];
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

export { type AssetName };
