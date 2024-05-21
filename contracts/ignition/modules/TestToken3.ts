import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TestToken3Module = buildModule("TestToken3", (m) => {
  const token3 = m.contract("TestToken3");
  return { token3 };
});

export default TestToken3Module;
