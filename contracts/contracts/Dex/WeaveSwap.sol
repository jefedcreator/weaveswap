// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

// Importing required contracts and interfaces
import "./PoolTracker.sol";
import "./LiquidityPool.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

error SwapRouter_tokensCantBeSwapped();
error SwapRouter_needToCallExistingFunction();

/**
 * @title SwapRouter
 * @dev This contract facilitates token swaps by interacting with liquidity pools.
 * It supports direct swaps between two tokens in a single pool, or routed swaps through an intermediary token.
 * Utilizes the PoolTracker contract to find liquidity pools and perform the necessary asset exchanges.
 */
contract SwapRouter {
    // Event emitted after successful token swaps, providing auditability and transparency of operations.
    event swap(
        address userAddress,
        address address1,
        address address2,
        uint256 address1Amount,
        uint256 address2Amount
    );

    // Reference to the PoolTracker contract for pool operations
    PoolTracker poolTracker;

    // Reentrancy Guard
    bool internal locked;

    /**
     * @dev Modifier to prevent reentrancy attacks.
     */
    modifier noReentrancy() {
        require(!locked, "No re-entrancy");
        locked = true;
        _;
        locked = false;
    }

    /**
     * @notice Constructs the SwapRouter and initializes the PoolTracker reference.
     * @param tracker The PoolTracker contract address.
     */
    constructor(address tracker) {
        poolTracker = PoolTracker(tracker);
    }

    /**
     * @notice Swaps `inputAmount` of `address1` tokens for `address2` tokens.
     * @dev This function supports direct swaps between tokens in a single pool or routed swaps through an intermediary token.
     * Uses PoolTracker to determine the best swap path and perform the exchange.
     * @param address1 The token being sold by the user.
     * @param address2 The token being purchased by the user.
     * @param inputAmount The amount of `address1` tokens to swap.
     */
    function swapAsset(
        address address1,
        address address2,
        uint256 inputAmount
    ) public payable noReentrancy {
        if (poolTracker.exists(address1, address2)) {
            // Direct swap scenario
            LiquidityPool pool = poolTracker.pairToPool(address1, address2);
            uint256 startingBalanceAddress2 = IERC20(address2).balanceOf(
                address(this)
            );
            if (pool.assetOneAddress() == address1) {
                IERC20(address1).transferFrom(
                    msg.sender,
                    address(this),
                    inputAmount
                );
                IERC20(address1).approve(address(pool), inputAmount);
                pool.sellAssetOne{value: pool.swapFee()}(inputAmount);
            } else {
                IERC20(address1).transferFrom(
                    msg.sender,
                    address(this),
                    inputAmount
                );
                IERC20(address1).approve(address(pool), inputAmount);
                pool.sellAssetTwo{value: pool.swapFee()}(inputAmount);
            }
            uint256 amountOutput = IERC20(address2).balanceOf(address(this)) -
                startingBalanceAddress2;
            IERC20(address2).transfer(msg.sender, amountOutput);
            // Unrequired fee
            uint256 unrequiredFee = msg.value - pool.swapFee(); // In case the msg.sender sent more value than it is required
            (bool sent, ) = payable(msg.sender).call{value: unrequiredFee}("");
            require(sent, "Failed to send Ether");
        } else if (tokenToRoute(address1, address2) != address(0)) {
            // Routed swap scenario
            address routingToken = tokenToRoute(address1, address2);
            LiquidityPool pool1 = poolTracker.pairToPool(
                address1,
                routingToken
            );
            LiquidityPool pool2 = poolTracker.pairToPool(
                address2,
                routingToken
            );
            uint256 routingTokenAmount;
            //SWAP 1, input token into routing  token
            IERC20(address1).transferFrom(
                msg.sender,
                address(this),
                inputAmount
            );
            IERC20(address1).approve(address(pool1), inputAmount);
            if (pool1.assetOneAddress() == address1) {
                routingTokenAmount = pool1.sellAssetOne{value: pool1.swapFee()}(
                    inputAmount
                );
            } else {
                routingTokenAmount = pool1.sellAssetTwo{value: pool1.swapFee()}(
                    inputAmount
                );
            }
            //SWAP 2, routing token into output token
            uint256 amountOutput;
            IERC20(routingToken).approve(address(pool2), routingTokenAmount);
            if (pool2.assetOneAddress() == routingToken) {
                amountOutput = pool2.sellAssetOne{value: pool2.swapFee()}(
                    routingTokenAmount
                );
            } else {
                amountOutput = pool2.sellAssetTwo{value: pool2.swapFee()}(
                    routingTokenAmount
                );
            }
            IERC20(address2).transfer(msg.sender, amountOutput);
            // Unrequired fee
            uint256 unrequiredFee = msg.value -
                pool1.swapFee() -
                pool2.swapFee(); // In case the msg.sender sent more value than it is required
            (bool sent, ) = payable(msg.sender).call{value: unrequiredFee}("");
            require(sent, "Failed to send Ether");
        } else {
            // Assets cant be swapped directly nor routed
            revert SwapRouter_tokensCantBeSwapped();
        }
    }

    /**
     * @notice Estimates the output amount for a swap from `address1` to `address2` given an `inputAmount` of `address1`.
     * @dev Considers direct swaps and routed swaps through an intermediary token, utilizing PoolTracker for calculations.
     * @param address1 The token being sold.
     * @param address2 The token being bought.
     * @param inputAmount The amount of `address1` tokens to swap.
     * @return output The estimated amount of `address2` tokens to be received.
     */
    function getSwapAmount(
        address address1,
        address address2,
        uint256 inputAmount
    ) public view returns (uint256) {
        uint256 output;
        if (poolTracker.exists(address1, address2)) {
            LiquidityPool pool = poolTracker.pairToPool(address1, address2);
            output = pool.getSwapQuantity(address1, inputAmount);
        } else if (tokenToRoute(address1, address2) != address(0)) {
            address routingToken = tokenToRoute(address1, address2);
            LiquidityPool pool1 = poolTracker.pairToPool(
                address1,
                routingToken
            );
            LiquidityPool pool2 = poolTracker.pairToPool(
                address2,
                routingToken
            );
            uint256 routingOutput = pool1.getSwapQuantity(
                address1,
                inputAmount
            );
            output = pool2.getSwapQuantity(routingToken, routingOutput);
        } else {
            // Assets cant be swapped directly nor routed
            revert SwapRouter_tokensCantBeSwapped();
        }
        return output;
    }

    /**
     * @notice Retrieves the swap fee required for a swap between `address1` and `address2`.
     * @dev Calculates the total swap fee, accounting for both direct and routed swaps, by querying the associated pools.
     * @param address1 The source token address.
     * @param address2 The destination token address.
     * @return fee The total swap fee for the transaction.
     */
    function getSwapFee(
        address address1,
        address address2
    ) public view returns (uint256) {
        uint256 fee;
        if (poolTracker.exists(address1, address2)) {
            LiquidityPool pool = poolTracker.pairToPool(address1, address2);
            fee += pool.swapFee();
        } else if (tokenToRoute(address1, address2) != address(0)) {
            address routingToken = tokenToRoute(address1, address2);
            LiquidityPool pool1 = poolTracker.pairToPool(
                address1,
                routingToken
            );
            LiquidityPool pool2 = poolTracker.pairToPool(
                address2,
                routingToken
            );
            fee += pool1.swapFee();
            fee += pool2.swapFee();
        } else {
            // Assets cant be swapped directly nor routed
            revert SwapRouter_tokensCantBeSwapped();
        }
        return fee;
    }

    /**
     * @dev Determines the optimal routing token for a swap between two tokens,
     * based on available liquidity and price feeds.
     *
     * @param address1 The address of the first token.
     * @param address2 The address of the second token.
     * @return address The address of the optimal routing token.
     */
    function tokenToRoute(
        address address1,
        address address2
    ) public view returns (address) {
        if (address1 == address2) {
            revert PoolTracker_cantSwapSameToken();
        }
        address[] memory token1pairs = poolTracker.getPoolPairs(address1);
        address[] memory token2pairs = poolTracker.getPoolPairs(address2);

        address routingToken;
        int routingTokenLiquidity;

        for (uint256 i; i < token1pairs.length; i++) {
            for (uint256 a; a < token2pairs.length; a++) {
                if (token1pairs[i] == token2pairs[a]) {
                    for (
                        uint256 b;
                        b < poolTracker.getRoutingAddressesLength();
                        b++
                    ) {
                        (address tokenAddress, address priceFeed) = poolTracker
                            .routingAddresses(b);
                        if (tokenAddress == token1pairs[i]) {
                            int liquidity;
                            LiquidityPool pool1 = poolTracker.pairToPool(
                                address1,
                                tokenAddress
                            );
                            LiquidityPool pool2 = poolTracker.pairToPool(
                                address2,
                                tokenAddress
                            );
                            uint256 balance1 = IERC20(tokenAddress).balanceOf(
                                address(pool1)
                            );
                            uint256 balance2 = IERC20(tokenAddress).balanceOf(
                                address(pool2)
                            );
                            liquidity =
                                (int(balance1) + int(balance2)) *
                                usdConverter(priceFeed);
                            if (liquidity > routingTokenLiquidity) {
                                // Best choice so far if the liquidity is bigger than previous best token
                                routingToken = tokenAddress;
                                routingTokenLiquidity = liquidity;
                            }
                        }
                    }
                }
            }
        }
        return routingToken;
    }

    function usdConverter(address priceFeed) internal view returns (int) {
        (, int answer, , , ) = AggregatorV3Interface(priceFeed)
            .latestRoundData();
        return answer;
    }

    /**
     * @dev Fallback function if address calls unexisting function, but contains msg.data
     */
    fallback() external payable {}

    /**
     * @dev Receive function if address calls unexisting function, without msg.data
     */
    receive() external payable {}
}
