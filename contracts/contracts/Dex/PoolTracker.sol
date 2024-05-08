// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

// Importing necessary contracts and interfaces
import "./LiquidityPool.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "../Bridge/InterfaceBridge.sol";

// Custom error definitions for specific failure conditions
error PoolTracker_pairAlreadyExists();
error PoolTracker_cantSwapSameToken();

/**
 * @title PoolTracker
 * @dev Manages the creation and tracking of liquidity pools within a decentralized finance ecosystem.
 * Utilizes Chainlink for accurate price feeds and OpenZeppelin's ERC20 for token interactions.
 * Implements reentrancy guards to mitigate potential security vulnerabilities in contract interactions.
 */
contract PoolTracker {
    // Tracker for created pools, will add to database
    event poolCreated(LiquidityPool pool, address assetOne, address assetTwo);

    // The owner of the PoolTracker contract, set to the deployer.
    address private owner;

    // Reentrancy Guard
    bool internal locked;

    // Hardcoded destination chain identifier and ZK Bridge address
    uint16 public destinationChain = 23;
    IZKBridge public zkBridge =
        IZKBridge(0xb20F0105f3598652a3bE569132F7b3F341106dDC);

    // Address of the yield calculator contract, for bridging computational parts.
    address public yieldCalculator;

    // Constructor: Sets the contract deployer as the owner.
    constructor(address _yieldCalculator) {
        owner = msg.sender;
        yieldCalculator = _yieldCalculator;
    }

    /**
     * @dev Modifier to prevent reentrancy attacks.
     */
    modifier noReentrancy() {
        require(!locked, "No re-entrancy");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert();
        }
        _;
    }

    // Mapping of pool Pairs, to store existing ones
    mapping(address => address[]) public poolPairs;

    // Mapping a pool to the contracts, in case we wont store it in the database
    mapping(address => mapping(address => LiquidityPool)) public pairToPool;

    // All the available tokens
    address[] public tokens;

    // All pools
    address[] public pools;

    struct poolWithTokens {
        address pool;
        address payable assetOneAddress;
        address payable assetTwoAddress;
    }

    /**
     * @dev Creates a liquidity pool for a given pair of ERC20 tokens. This function handles the initial
     * transfer of token amounts from the caller, sets up the liquidity pool, and updates internal mappings.
     * Emits a PoolCreated event upon successful creation.
     *
     * Requirements:
     * - The token pair must not already have an existing pool.
     * - The caller must have approved the contract to spend the necessary token amounts.
     *
     * @param _assetOneAddress The address of the first token in the pair.
     * @param _assetTwoAddress The address of the second token in the pair.
     * @param amountOne The amount of the first token to add to the pool.
     * @param amountTwo The amount of the second token to add to the pool.
     */
    function createPool(
        address _assetOneAddress,
        address _assetTwoAddress,
        uint256 amountOne,
        uint256 amountTwo
    ) external noReentrancy {
        if (
            exists(_assetOneAddress, _assetTwoAddress)
        ) // To prevent duplicate pools
        {
            revert PoolTracker_pairAlreadyExists();
        }
        // Transfer of tokens
        IERC20(_assetOneAddress).transferFrom(
            msg.sender,
            address(this),
            amountOne
        );
        IERC20(_assetTwoAddress).transferFrom(
            msg.sender,
            address(this),
            amountTwo
        );
        // Creation of pool
        LiquidityPool poolAddress = new LiquidityPool(
            _assetOneAddress,
            _assetTwoAddress
        );
        pools.push(address(poolAddress));
        // Approve
        IERC20(_assetOneAddress).approve(address(poolAddress), amountOne);
        IERC20(_assetTwoAddress).approve(address(poolAddress), amountTwo);
        // Add initial liquidity
        poolAddress.addInitialLiquidity(amountOne, amountTwo);
        // Update mappings
        poolPairs[_assetOneAddress].push(_assetTwoAddress);
        poolPairs[_assetTwoAddress].push(_assetOneAddress);
        pairToPool[_assetOneAddress][_assetTwoAddress] = poolAddress;
        pairToPool[_assetTwoAddress][_assetOneAddress] = poolAddress;

        if (tokenExists(_assetOneAddress) == false) {
            tokens.push(_assetOneAddress);
        }
        if (tokenExists(_assetTwoAddress) == false) {
            tokens.push(_assetTwoAddress);
        }
        // Emit the event
        emit poolCreated(poolAddress, _assetOneAddress, _assetTwoAddress);
    }

    /**
     * @dev Checks if a liquidity pool exists for a given pair of tokens.
     *
     * @param token1 The address of the first token.
     * @param token2 The address of the second token.
     * @return bool Returns true if the pool exists, false otherwise.
     */
    function exists(address token1, address token2) public view returns (bool) {
        bool exist;
        for (uint256 i; i < poolPairs[token1].length; i++) {
            if (poolPairs[token1][i] == token2) {
                exist = true;
            }
        }
        return exist;
    }

    /**
     * @dev Checks if a token is already tracked by the contract.
     *
     * @param tokenAddress The address of the token to check.
     * @return bool Returns true if the token is tracked, false otherwise.
     */
    function tokenExists(address tokenAddress) internal view returns (bool) {
        bool exist;
        for (uint256 i; i < tokens.length; i++) {
            if (tokenAddress == tokens[i]) {
                exist = true;
                break;
            }
        }
        return exist;
    }

    // Routing token
    struct routingAddress {
        address tokenAddress;
        address priceFeed;
    }

    // Array of routing Tokens
    routingAddress[] public routingAddresses;

    /**
     * @dev Allows the contract owner to add or update the routing address for a token.
     * This is used for token swaps and price feed lookups.
     *
     * @param tokenAddress The token for which to set the routing.
     * @param priceFeed The Chainlink price feed address for the token.
     */
    function addRoutingAddress(
        address tokenAddress,
        address priceFeed
    ) external onlyOwner {
        if (routingAddresses.length == 0) {
            routingAddresses.push(routingAddress(tokenAddress, priceFeed));
        } else {
            for (uint256 i = 0; i < routingAddresses.length; i++) {
                if (routingAddresses[i].tokenAddress == tokenAddress) {
                    routingAddresses[i] = routingAddress(
                        tokenAddress,
                        priceFeed
                    );
                    break;
                } else if (i == routingAddresses.length - 1) {
                    routingAddresses.push(
                        routingAddress(tokenAddress, priceFeed)
                    );
                }
            }
        }
    }

    /**
     * @dev Returns all array of all tradable tokens on the platform
     *
     * @return array Returns tokens array.
     */
    function tokenList() external view returns (address[] memory) {
        return tokens;
    }

    /**
     * @dev Returns length or routingAddresses array
     *
     * @return uint256 Returns length.
     */
    function getRoutingAddressesLength() external view returns (uint256) {
        return routingAddresses.length;
    }

    /**
     * @dev Returns length or poolPairs array
     *
     * @return uint256 Returns length.
     */
    function getPoolPairsLength(
        address tokenAddress
    ) external view returns (uint256) {
        return poolPairs[tokenAddress].length;
    }

    function getPoolPairs(
        address tokenAddress
    ) public view returns (address[] memory) {
        return poolPairs[tokenAddress];
    }

        function getAllPoolWithAssets() public view returns (poolWithTokens[] memory) {
        poolWithTokens[] memory poolsTokens;
        
        for (uint256 index = 0; index < pools.length; index++) {
            address payable assetOne = payable(LiquidityPool(payable(pools[index])).assetOneAddress());
            address payable assetTwo = payable(LiquidityPool(payable(pools[index])).assetTwoAddress());
            poolsTokens[index] = poolWithTokens(address(pools[index]), assetOne, assetTwo);
        }
        
        return poolsTokens;
    }

    /**
     * @dev Retrieve pool addresses
     *
     * @return array Returns pools array
     */
    function getPools() public view returns (address[] memory) {
        return pools;
    }

    /**
     * @dev owner can withdraw the fees to deposit to yield Calculator
     */
    function withdrawEther() external onlyOwner {
        (bool sent, ) = payable(msg.sender).call{value: address(this).balance}(
            ""
        );
        require(sent, "Failed to send Ether");
    }
}
