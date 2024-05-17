import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const YieldCalculatorModule = buildModule("yieldCalculator", (m) => {
  const zkBridge = "0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7";
  const yieldCalculator = m.contract("YieldCalculator", [zkBridge]);
  return { yieldCalculator };
});

export default YieldCalculatorModule;
