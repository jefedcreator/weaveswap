import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import YieldCalculatorModule from "./YieldCalculator";

const PoolTrackerModule = buildModule("poolTracker", (m) => {
  const { yieldCalculator } = m.useModule(YieldCalculatorModule);

  const poolTracker = m.contract("PoolTracker", [yieldCalculator]);

  return { poolTracker };
});

export default PoolTrackerModule;
