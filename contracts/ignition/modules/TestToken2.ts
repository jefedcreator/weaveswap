import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TestToken2Module = buildModule("TestToken2", (m) => {
  const token2 = m.contract("TestToken2");
  return { token2 };
});

export default TestToken2Module;
