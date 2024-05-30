import { IconType } from "@/components";
import {
  poolAbi,
  swapAbi,
  lendingTrackerAbi,
  lendingPoolAbi,
  borrowTrackerAbi,
  poolTrackerAbi,
  poolMetricsAbi,
} from "./abis";

// const lend = "0x15D7BdFc3Afc61544c6D9085dC4235f15B85a4C4";
// const borrow = "0xf95269C39EBaF3D75d3Fa67E2cCeDcB791507D28";
// const pool = "0x2eF926F54f7D767cbb7369d21A342DdB033D2024";
// const tokenA = "0x1F06aB1B322AcF25D52f9210c227692B8Bfac58F";
// const tokenB = "0xFcf351591C7A9D081D5b9c37Bbec3062EE03E235";
// const tokenC = "0x18c9504c02d97D41d518f6bF91faa9A8Fe8071D1";
// const swap = "0x3dfBF4C76f99Cc64BF69BAd9ed27DF567d488956";
// const poolTracker = "0x603D1517726A1b3A4BFA097eaBdB8A2d9F633Cf1";

const lendingTracker: `0x${string}` =
  "0x5d388100E1830c09490c729b4189BC37A32A75a1";
const borrowingTracker: `0x${string}` =
  "0xE048C50805738ceb84F0B1450b7308Ef414818E0";
const pool: `0x${string}` = "0x76cC174Ba7BDa4D64C25695920cF2Ce3eac45272";
const tokenA: `0x${string}` = "0x73De41a12B9D7081518da74B00DBBD755775aA92";
const tokenB: `0x${string}` = "0x4448ff619f022d0774Ad89bBCeb8CB91af373f12";
const tokenC: `0x${string}` = "0x8fA6730322ca2bfaA150AeC3467ecCc2f14e515F";
const swap: `0x${string}` = "0x1B835fADad526de898979a339B50a3064B609e2E";
const poolTracker: `0x${string}` = "0x2D29c5A4b7a8d0149f9256871158e9737D880D6a";
const poolMetrics: `0x${string}` = "0x5A785E1a6c3C923bBb0F4Ad9eaE24fCc170d0637";

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
  tokens,
  poolMetrics,
  poolMetricsAbi,
};

export { type AssetName, type Tokens };
