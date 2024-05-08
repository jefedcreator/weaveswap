// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

// Importing necessary contracts and interfaces
import "./InterfaceBridge.sol";
import "../Dex/LiquidityPool.sol";

/**
 * @title YieldCalculator
 * @dev Receives yield calculation requests from an external bridge, computes available yield, and sends it back.
 * This contract interacts with a LiquidityPool contract to calculate available yield for a user.
 * @notice we need to fund this contract so It can send the response from bridging. We get funding from getYield liquidity contract(funds the poolTracker)
 */
contract YieldCalculator is IZKBridgeReceiver {
    // Instance of the external bridge interface
    IZKBridge zkBridge;

    /**
     * @dev Constructor initializes the YieldCalculator with the address of the external bridge contract.
     * @param _zkBridge Address of the external bridge contract.
     */
    constructor(address _zkBridge) {
        zkBridge = IZKBridge(_zkBridge);
    }

    /**
     * @dev Implementation of the zkReceive function from the IZKBridgeReceiver interface.
     * Calculates available yield for a user based on data received from the external bridge.
     * Sends the available yield back to the source address.
     * @param srcChainId The chain ID of the source blockchain.
     * @param srcAddress The address of the source contract or user.
     * @param payload The payload containing user-specific data.
     */
    function zkReceive(
        uint16 srcChainId,
        address srcAddress,
        // uint64 nonce,
        bytes calldata payload
    ) external {
        address user = abi.decode(payload, (address));
        //TODO handle your business
        LiquidityPool pool = LiquidityPool(payable(srcAddress));
        uint256 yieldSoFar = pool.yieldTaken(user);
        uint256 userLiquidity = (pool.lpTokenQuantity(user) * 100) /
            pool.liquidity();
        uint256 availableYield = ((pool.yield() -
            ((yieldSoFar * 100) / userLiquidity)) * userLiquidity) / 100;
        //NOW SEND BACK THE AVAILABLE YIELD
        bytes memory newPayload = abi.encode(availableYield, user);
        uint256 fee = zkBridge.estimateFee(srcChainId);
        zkBridge.send{value: fee}(srcChainId, srcAddress, newPayload);
    }
}
