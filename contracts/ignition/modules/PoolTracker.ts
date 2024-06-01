import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";
import TestToken1Module from "./TestToken1";
import TestToken2Module from "./TestToken2";
import TestToken3Module from "./TestToken3";
import YieldCalculatorModule from "./YieldCalculator";
import PriceAggregatorTrackerModule from "./PriceAggregator";

const mintAmount = BigInt(100);

const PoolTrackerModule = buildModule("poolTracker", (m) => {
  const mint = m.getParameter("mintAmount", mintAmount);

  const { yieldCalculator } = m.useModule(YieldCalculatorModule);
  const { token1 } = m.useModule(TestToken1Module);
  const { token2 } = m.useModule(TestToken2Module);
  const { token3 } = m.useModule(TestToken3Module);
  const { priceAggregator1, priceAggregator2, priceAggregator3 } = m.useModule(
    PriceAggregatorTrackerModule
  );

  const poolTracker = m.contract("PoolTracker", [yieldCalculator]);

  const approve1 = m.call(
    token1,
    "approve",
    [poolTracker, parseEther("1000")],
    {
      id: "approve1",
    }
  );
  const approve2 = m.call(
    token2,
    "approve",
    [poolTracker, parseEther("1000")],
    {
      id: "approve2",
    }
  );
  const approve3 = m.call(
    token3,
    "approve",
    [poolTracker, parseEther("1000")],
    {
      id: "approve3",
    }
  );

  const createPool1 = m.call(
    poolTracker,
    "createPool",
    [token1, token3, mint, mint],
    {
      id: "createPool1",
      after: [approve1],
    }
  );

  const createPool2 = m.call(
    poolTracker,
    "createPool",
    [token2, token3, mint, mint],
    {
      id: "createPool2",
      after: [approve2],
    }
  );

  const createPool3 = m.call(
    poolTracker,
    "createPool",
    [token1, token2, mintAmount, mintAmount],
    {
      id: "createPool3",
      after: [approve3],
    }
  );

  m.call(poolTracker, "addRoutingAddress", [token1, priceAggregator1], {
    id: "addRoutingAddress1",
    after: [createPool1],
  });

  m.call(poolTracker, "addRoutingAddress", [token2, priceAggregator2], {
    id: "addRoutingAddress2",
    after: [createPool2],
  });

  m.call(poolTracker, "addRoutingAddress", [token3, priceAggregator3], {
    id: "addRoutingAddress3",
    after: [createPool3],
  });

  return { poolTracker };
});

export default PoolTrackerModule;
