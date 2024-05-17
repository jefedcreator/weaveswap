import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BorrowingTrackerModule from "./BorrowingTracker";
import TestToken1Module from "./TestToken1";

const LendingPoolModule = buildModule("lendingPool", (m) => {
  const { token1 } = m.useModule(TestToken1Module);
  const { borrowingTracker } = m.useModule(BorrowingTrackerModule);
  const pool = m.contract("Pool", [token1, borrowingTracker]);
  return { pool };
});

export default LendingPoolModule;
