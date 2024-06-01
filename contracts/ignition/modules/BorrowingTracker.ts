import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import LendingTrackerModule from "./LendingTracker";
import PriceAggregatorTrackerModule from "./PriceAggregator";
import SwapRouterModule from "./SwapRouter";
import TestToken1Module from "./TestToken1";
import TestToken2Module from "./TestToken2";
import TestToken3Module from "./TestToken3";
import PoolTrackerModule from "./PoolTracker";

const zkBridge = "0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7";

const BorrowingTrackerModule = buildModule("borrowingTracker", (m) => {
  const { swapRouter } = m.useModule(SwapRouterModule);
  const { lendingTracker } = m.useModule(LendingTrackerModule);
  const { priceAggregator1, priceAggregator2, priceAggregator3 } = m.useModule(
    PriceAggregatorTrackerModule
  );
  const { token1 } = m.useModule(TestToken1Module);
  const { token2 } = m.useModule(TestToken2Module);
  const { token3 } = m.useModule(TestToken3Module);
  const bridge = m.getParameter("zkBridge", zkBridge);
  const { poolTracker } = m.useModule(PoolTrackerModule);

  const borrowingTracker = m.contract("BorrowingTracker", [
    lendingTracker,
    swapRouter,
  ]);

  // const poolMetrics = m.contract("PoolMetrics", [
  //   poolTracker,
  //   bridge,
  //   swapRouter,
  // ]);

  // m.contract("PoolMetrics", [poolTracker, bridge, swapRouter]);

  const addBorrowingContract = m.call(
    lendingTracker,
    "addBorrowingContract",
    [borrowingTracker],
    {
      id: "addborrow",
    }
  );

  const addtoken1id = m.call(
    lendingTracker,
    "addTokenPool",
    [token1, priceAggregator1],
    {
      id: "addtoken1id",
      after: [addBorrowingContract],
    }
  );

  m.call(lendingTracker, "changeBorrowingAPY", [token1, 1], {
    id: "changeBorrowingAPY1",
    after: [addtoken1id],
  });

  const addtoken2id = m.call(
    lendingTracker,
    "addTokenPool",
    [token2, priceAggregator2],
    {
      id: "addtoken2id",
      after: [addBorrowingContract],
    }
  );

  m.call(lendingTracker, "changeBorrowingAPY", [token2, 2], {
    id: "changeBorrowingAPY2",
    after: [addtoken2id],
  });

  const addtoken3id = m.call(
    lendingTracker,
    "addTokenPool",
    [token3, priceAggregator3],
    {
      id: "addtoken3id",
      after: [addBorrowingContract],
    }
  );

  m.call(lendingTracker, "changeBorrowingAPY", [token3, 3], {
    id: "changeBorrowingAPY3",
    after: [addtoken3id],
  });

  return { borrowingTracker };
});

export default BorrowingTrackerModule;
