import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LendingTrackerModule = buildModule("lendingTracker", (m) => {
  const lendingTracker = m.contract("LendingTracker");
  return { lendingTracker };
});

export default LendingTrackerModule;
