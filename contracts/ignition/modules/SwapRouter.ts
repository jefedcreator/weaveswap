import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import PoolTrackerModule from "./PoolTracker";

const SwapRouterModule = buildModule("swapRouter", (m) => {
  const { poolTracker } = m.useModule(PoolTrackerModule);
  const swapRouter = m.contract("SwapRouter", [poolTracker]);
  return { swapRouter };
});

export default SwapRouterModule;
