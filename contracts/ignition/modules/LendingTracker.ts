import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LendingTrackerrModule = buildModule("lendingTracker", (m) => {
  const lendingTracker = m.contract("LendingTracker");
  return { lendingTracker };
});

export default LendingTrackerrModule;
