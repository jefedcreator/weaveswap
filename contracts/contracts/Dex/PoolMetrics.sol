// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

// Importing necessary contracts and interfaces
import "./LiquidityPool.sol";
import "./PoolTracker.sol";
import "./WeaveSwap.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title PoolMetrics
 * @dev Smart contract for computing various on chain metrics related to liquidity pools and tokens.
 */
contract PoolMetrics {
    // State variables
    PoolTracker public poolTracker;
    SwapRouter public swapRouter;
    address public ethPriceFeed;

    /**
     * @dev Constructor function initializes the PoolTracker and ETH price feed addresses.
     * @param _poolTracker Address of the PoolTracker contract.
     * @param _ethPriceFeed Address of the ETH price feed contract.
     */
    constructor(
        address _poolTracker,
        address _ethPriceFeed,
        address _swapRouter
    ) {
        poolTracker = PoolTracker(_poolTracker);
        swapRouter = SwapRouter(payable(_swapRouter));
        ethPriceFeed = _ethPriceFeed;
    }

    /**
     * @dev Computes the market capitalization of a token.
     * @param tokenAddress Address of the token.
     * @return The market capitalization of the token.
     */
    function marketCap(address tokenAddress) public view returns (uint256) {
        return usdValue(tokenAddress, IERC20(tokenAddress).totalSupply());
    }

    /**
     * @dev Computes the combined market capitalization of two tokens.
     * @param tokenAddress Address of the first token.
     * @param tokenAddress2 Address of the second token.
     * @return The combined market capitalization of the two tokens.
     */
    function pairMarketCap(
        address tokenAddress,
        address tokenAddress2
    ) public view returns (uint256) {
        uint256 tokenAmount = IERC20(tokenAddress).totalSupply();
        uint256 tokenAmount2 = IERC20(tokenAddress2).totalSupply();
        uint256 totalMarketCap = usdValue(tokenAddress, tokenAmount) +
            usdValue(tokenAddress2, tokenAmount2);
        return totalMarketCap;
    }

    /**
     * @dev Computes the total value locked (TVL) in a liquidity pool for a given token.
     * @param tokenAddress Address of the token.
     * @return The TVL of the token.
     */
    function tvl(address tokenAddress) public view returns (uint256) {
        uint256 tokensLocked;
        uint256 poolPairLength = poolTracker.getPoolPairsLength(tokenAddress);
        for (uint256 i; i < poolPairLength; i++) {
            address tokenAddress2 = poolTracker.poolPairs(tokenAddress, i);
            LiquidityPool pool = poolTracker.pairToPool(
                tokenAddress,
                tokenAddress2
            );
            tokensLocked += IERC20(tokenAddress).balanceOf(address(pool));
        }
        return usdValue(tokenAddress, tokensLocked);
    }

    /**
     * @dev Computes the combined TVL of two tokens in a liquidity pool.
     * @param tokenAddress Address of the first token.
     * @param tokenAddress2 Address of the second token.
     * @return The combined TVL of the two tokens.
     */
    function pairTvl(
        address tokenAddress,
        address tokenAddress2
    ) public view returns (uint256) {
        LiquidityPool pool = poolTracker.pairToPool(
            tokenAddress,
            tokenAddress2
        );
        uint256 tokenAmount = IERC20(tokenAddress).balanceOf(address(pool));
        uint256 tokenAmount2 = IERC20(tokenAddress2).balanceOf(address(pool));
        uint256 totalTvl = usdValue(tokenAddress, tokenAmount) +
            usdValue(tokenAddress2, tokenAmount2);
        return totalTvl;
    }

    /**
     * @dev Computes the TVL ratio of a token, which is TVL divided by market capitalization.
     * @param tokenAddress Address of the token.
     * @return The TVL ratio of the token.
     */
    function tvlRatio(address tokenAddress) public view returns (uint256) {
        return (tvl(tokenAddress) * 100) / marketCap(tokenAddress);
    }

    /**
     * @dev Computes the TVL ratio of a pool, which is pair TVL divided by pair market capitalization.
     * @param tokenAddress Address of the token.
     * @return The TVL ratio of the token.
     */
    function pairTvlRatio(
        address tokenAddress,
        address tokenAddress2
    ) public view returns (uint256) {
        return
            (pairTvl(tokenAddress, tokenAddress2) * 100) /
            pairMarketCap(tokenAddress, tokenAddress2);
    }

    /**
     * @dev Computes the total return on investment (ROI) for a liquidity pool with two tokens.
     * @param tokenAddress Address of the first token.
     * @param tokenAddress2 Address of the second token.
     * @return The total ROI of the liquidity pool.
     */
    function totalRoi(
        address tokenAddress,
        address tokenAddress2
    ) public view returns (uint256) {
        LiquidityPool pool = poolTracker.pairToPool(
            tokenAddress,
            tokenAddress2
        );
        uint256 profit = pool.yield() * uint256(usdConverter(ethPriceFeed));
        uint256 tokenAmount = IERC20(tokenAddress).balanceOf(address(pool));
        uint256 tokenAmount2 = IERC20(tokenAddress2).balanceOf(address(pool));
        return
            ((profit * 100) * 10 ** 26) /
            (usdValue(tokenAddress, tokenAmount) +
                usdValue(tokenAddress2, tokenAmount2));
    }

    /**
     * @dev Computes the daily ROI for a liquidity pool with two tokens.
     * @param tokenAddress Address of the first token.
     * @param tokenAddress2 Address of the second token.
     * @return The daily ROI of the liquidity pool.
     */
    function dailyRoi(
        address tokenAddress,
        address tokenAddress2
    ) public view returns (uint256) {
        return
            (uint256(usdConverter(ethPriceFeed)) *
                dailyRate(tokenAddress, tokenAddress2) *
                1000000000000000000) / pairTvl(tokenAddress, tokenAddress2);
    }

    /**
     * @dev Computes the daily yield rate for a liquidity pool with two tokens.
     * @param tokenAddress Address of the first token.
     * @param tokenAddress2 Address of the second token.
     * @return The daily yield rate of the liquidity pool.
     */
    function dailyRate(
        address tokenAddress,
        address tokenAddress2
    ) public view returns (uint256) {
        LiquidityPool pool = poolTracker.pairToPool(
            tokenAddress,
            tokenAddress2
        );
        uint256 yield = pool.yield();
        uint256 deployTimeStamp = pool.initialLiquidityProvidedTime(
            pool.owner()
        );
        uint256 daysSinceDeployed = (block.timestamp - deployTimeStamp) /
            60 /
            24; // seconds / hours / days
        return yield / daysSinceDeployed;
    }

    /**
     * @dev Computes the USD value of a token based on its amount and price feed.
     * @param tokenAddress Address of the token.
     * @param tokenAmount Amount of the token.
     * @return The USD value of the token.
     */
    function usdValue(
        address tokenAddress,
        uint256 tokenAmount
    ) public view returns (uint256) {
        // If it is a routing token
        for (uint256 i; i < poolTracker.getRoutingAddressesLength(); i++) {
            (address routingAddress, address priceFeed) = poolTracker
                .routingAddresses(i);
            if (routingAddress == tokenAddress) {
                return uint256(usdConverter(priceFeed)) * tokenAmount;
            }
        }
        // If there is a direct pool with routing token
        for (uint256 i; i < poolTracker.getRoutingAddressesLength(); i++) {
            (address routingAddress, address priceFeed) = poolTracker
                .routingAddresses(i);
            if (
                address(poolTracker.pairToPool(tokenAddress, routingAddress)) !=
                address(0)
            ) {
                // Token value
                // uint256 tokenValue = swapRouter.getSwapAmount(
                //     tokenAddress,
                //     routingAddress,
                //     tokenAmount
                // );
                LiquidityPool pool = poolTracker.pairToPool(
                    tokenAddress,
                    routingAddress
                );
                uint256 tokenValue;
                if (pool.assetOneAddress() == tokenAddress) {
                    tokenValue =
                        (uint256(usdConverter(priceFeed)) *
                            tokenAmount *
                            pool.getAssetOne()) /
                        pool.getAssetTwo();
                } else {
                    tokenValue =
                        (uint256(usdConverter(priceFeed)) *
                            tokenAmount *
                            pool.getAssetTwo()) /
                        pool.getAssetOne();
                }
                return tokenValue;
            }
        }
        // If there is no possible USD conversion
        return 0;
    }

    /**
     * @dev Retrieves the latest TOKEN to USD conversion rate from the price feed.
     * @param priceAddress Address of the TOKEN price feed.
     * @return The latest TOKEN to USD conversion rate.
     */
    function usdConverter(address priceAddress) internal view returns (int) {
        (, int answer, , , ) = AggregatorV3Interface(priceAddress)
            .latestRoundData();
        return answer;
    }
}