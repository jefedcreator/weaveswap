import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import LendingTrackerrModule from "./LendingTracker";
import SwapRouterModule from "./SwapRouter";
const BorrowingTrackerModule = buildModule("BorrowingTracker", (m) => {
  const { swapRouter } = m.useModule(SwapRouterModule);
  const { lendingTracker } = m.useModule(LendingTrackerrModule);
  const borrowingTracker = m.contract("BorrowingTracker", [
    lendingTracker,
    swapRouter,
  ]);
  return { borrowingTracker };
});

export default BorrowingTrackerModule;
