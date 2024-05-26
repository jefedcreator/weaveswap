import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const decimalVal = 8;
const priceVal1 = BigInt(5000000000);
const priceVal2 = BigInt(3000000000);
const priceVal3 = BigInt(1500000000);

const PriceAggregatorTrackerModule = buildModule("priceAggregator", (m) => {
  const price1 = m.getParameter("price", priceVal1);
  const price2 = m.getParameter("price", priceVal2);
  const price3 = m.getParameter("price", priceVal3);
  const decimal = m.getParameter("decimal", decimalVal);

  const priceAggregator1 = m.contract("MockV3Aggregator", [decimal, price1], {
    id: "priceAggregator1",
  });
  const priceAggregator2 = m.contract("MockV3Aggregator", [decimal, price2], {
    id: "priceAggregator2",
  });
  const priceAggregator3 = m.contract("MockV3Aggregator", [decimal, price3], {
    id: "priceAggregator3",
  });
  return { priceAggregator1, priceAggregator2, priceAggregator3 };
});

export default PriceAggregatorTrackerModule;
