import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TestToken1Module = buildModule("TestToken1", (m) => {
  const token1 = m.contract("TestToken1");
  return { token1 };
});

export default TestToken1Module;
