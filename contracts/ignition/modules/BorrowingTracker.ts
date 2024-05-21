import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import LendingTrackerModule from "./LendingTracker";
import PriceAggregatorTrackerModule from "./PriceAggregator";
import SwapRouterModule from "./SwapRouter";
import TestToken1Module from "./TestToken1";
import TestToken2Module from "./TestToken2";
import TestToken3Module from "./TestToken3";

const BorrowingTrackerModule = buildModule("borrowingTracker", (m) => {
  const { swapRouter } = m.useModule(SwapRouterModule);
  const { lendingTracker } = m.useModule(LendingTrackerModule);
  const { priceAggregator } = m.useModule(PriceAggregatorTrackerModule);
  const { token1 } = m.useModule(TestToken1Module);
  const { token2 } = m.useModule(TestToken2Module);
  const { token3 } = m.useModule(TestToken3Module);

  const borrowingTracker = m.contract("BorrowingTracker", [
    lendingTracker,
    swapRouter,
  ]);

  const addBorrowingContract = m.call(
    lendingTracker,
    "addBorrowingContract",
    [borrowingTracker],
    {
      id: "addborrow",
    }
  );

  m.call(lendingTracker, "addTokenPool", [token1, priceAggregator], {
    id: "addtoken1id",
    after: [addBorrowingContract],
  });

  m.call(lendingTracker, "addTokenPool", [token2, priceAggregator], {
    id: "addtoken2id",
    after: [addBorrowingContract],
  });

  m.call(lendingTracker, "addTokenPool", [token3, priceAggregator], {
    id: "addtoken3id",
    after: [addBorrowingContract],
  });

  return { borrowingTracker };
});

export default BorrowingTrackerModule;
