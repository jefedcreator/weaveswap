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

const lendingTracker = "0x3cF7D9D147f5e466a752Eb779BaCCc82100A6430";
const borrowingTracker = "0xFaC4a86efa1Ce75E5Ff549061620a7Df84c17771";
const pool = "0x76cC174Ba7BDa4D64C25695920cF2Ce3eac45272";
const tokenA = "0x54C345814e63c7E3aB6a6AFE158ab141e8b47f98";
const tokenB = "0x64646d24Dc891ed2660dD3cbF88471Aa088F041f";
const tokenC = "0x57e6943F216D31a7b1E57D8a3Aa59FD7d977C753";
const swap = "0x2F27d52D5201542066321B8B48769aFd65aEE8a3";
const poolTracker = "0x4673Ac016dea03e8444B85B1fe57a3CD085A48E4";

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
};

export { type AssetName, type Tokens };
