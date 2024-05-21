import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const decimalVal = 8;
const priceVal = BigInt(5000000000);

const PriceAggregatorTrackerModule = buildModule("priceAggregator", (m) => {
  const price = m.getParameter("price", priceVal);
  const decimal = m.getParameter("decimal", decimalVal);

  const priceAggregator = m.contract("MockV3Aggregator", [decimal, price]);
  return { priceAggregator };
});

export default PriceAggregatorTrackerModule;
