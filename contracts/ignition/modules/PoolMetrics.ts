import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import PoolTrackerModule from "./PoolTracker";
import SwapRouterModule from "./SwapRouter";

const zkBridge = "0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7";

const PoolMetricsModule = buildModule("poolMetrics", (m) => {
  const bridge = m.getParameter("zkBridge", zkBridge);
  const { swapRouter } = m.useModule(SwapRouterModule);
  const { poolTracker } = m.useModule(PoolTrackerModule);

  const poolMetrics = m.contract("PoolMetrics", [
    poolTracker,
    bridge,
    swapRouter,
  ]);

  return { poolMetrics };
});

export default PoolMetricsModule;
