// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

// Importing necessary contracts and interfaces
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./Pool.sol";

// Custom error definitions for specific failure conditions
error lendingTracker_addressNotAllowed();
error lendingTracker_poolNotAvailable();
error lendingTracker_amountTooHigh();
error lendingTracker_receiptDoesntExist();
error lendingTracker_poolExists();

/**
 * @title LendingTracker
 * @dev Manages lending, borrowing, and collateral operations for a decentralized finance platform.
 * Utilizes external price feeds for valuation and includes functionality for yield farming.
 * This contract is responsible for tracking user interactions with lending pools and their collateralized positions.
 */
contract LendingTracker {
    // Events for logging various actions within the contract
    event userLended(
        address indexed user,
        address tokenAddress,
        uint256 tokenAmount
    );
    event userWithdrawnLendedTokens(
        address indexed user,
        address tokenAddress,
        uint256 tokenAmount
    );
    event userFarmedYield(
        address user,
        address tokenAddress,
        uint256 tokenAmount
    );

    // Owner of the contract, set at deployment
    address owner;

    // Borrowing contract
    address public borrowingContract;

    // Constructor sets the deploying address as the owner
    constructor() {
        owner = msg.sender;
    }

    // Struct to hold lending pool and its associated price feed information
    struct tokenPool {
        Pool poolAddress; // ERC-20 Token address
        address priceAddress; // Chainlink price feed
    }

    // Struct to track borrowing receipts for users
    struct borrowReceipt {
        address tokenAddress;
        uint256 amount;
        uint256 time;
        uint256 apy;
    }

    // Mappings to track lending pools, user interactions, and collateral
    mapping(address => tokenPool) public tokenToPool; // To find pool for specific ERC20 address
    address[] public availableTokens; // All available tokens to lend, borrow and collateralize

    mapping(address => mapping(address => uint256)) public userLendedAmount; // Lended amout of specific token for user
    mapping(address => address[]) public userLendedTokens; // All lended token addresses of user

    /**
     * @notice Adds a new token pool for lending and borrowing.
     * @dev Deploys a new Lending contract for the token and registers it along with its price feed.
     * @param tokenAddress Address of the token for the new lending pool.
     * @param priceAddress Address of the Chainlink price feed for the token.
     */
    function addTokenPool(address tokenAddress, address priceAddress) external {
        if (msg.sender != owner) {
            revert lendingTracker_addressNotAllowed();
        }
        if (address(tokenToPool[tokenAddress].poolAddress) != address(0)) {
            revert lendingTracker_poolExists();
        }
        Pool newPool = new Pool(tokenAddress, borrowingContract);
        tokenToPool[tokenAddress] = tokenPool(newPool, priceAddress);
        availableTokens.push(tokenAddress);
    }

    /**
     * @notice Changes the price feed for a given token.
     * @dev Allows the contract owner to update the price feed address in case of changes or migration.
     * @param tokenAddress Address of the token whose price feed is being updated.
     * @param priceAddress New address of the Chainlink price feed.
     */
    function changePriceFeed(
        address tokenAddress,
        address priceAddress
    ) external {
        // Checks if address is allowed to call this
        if (msg.sender != owner) {
            revert lendingTracker_addressNotAllowed();
        }
        // Checks if the pool exists
        if (address(tokenToPool[tokenAddress].poolAddress) == address(0)) {
            revert lendingTracker_poolNotAvailable();
        }
        tokenToPool[tokenAddress].priceAddress = priceAddress;
    }

    /**
     * @notice Updates the borrowing APY for a specified token pool.
     * @param tokenAddress Address of the token whose lending pool APY is to be changed.
     * @param newAPY The new annual percentage yield for borrowing.
     */
    function changeBorrowingAPY(address tokenAddress, uint256 newAPY) external {
        if (msg.sender != owner) {
            revert lendingTracker_addressNotAllowed();
        }
        tokenToPool[tokenAddress].poolAddress.setBorrowingAPY(newAPY);
    }

    /**
     * @notice Enables a user to lend tokens to a specific pool.
     * @dev Transfers tokens from the user to the lending pool contract and updates the tracking of lent amounts.
     * Requires token approval from the user to the LendingTracker contract.
     * @param tokenAddress The address of the token being lent.
     * @param tokenAmount The amount of tokens the user is lending.
     */
    function lendToken(address tokenAddress, uint256 tokenAmount) external {
        // Checks if pool exists
        if (address(tokenToPool[tokenAddress].poolAddress) == address(0)) {
            revert lendingTracker_poolNotAvailable();
        }
        // Transfer and approve tokens
        IERC20(tokenAddress).transferFrom(
            msg.sender,
            address(this),
            tokenAmount
        );
        IERC20(tokenAddress).approve(
            address(tokenToPool[tokenAddress].poolAddress),
            tokenAmount
        );
        // Maps the token address if needed
        if (
            newTokenChecker(userLendedTokens[msg.sender], tokenAddress) == true
        ) {
            userLendedTokens[msg.sender].push(tokenAddress);
        }
        // Add funds to mapping
        userLendedAmount[msg.sender][tokenAddress] += tokenAmount;
        tokenToPool[tokenAddress].poolAddress.lend(tokenAmount);

        // Event
        emit userLended(msg.sender, tokenAddress, tokenAmount);
    }

    /**
     * @notice Withdraws tokens previously lent to the lending pool by the user.
     * @dev Ensures the user cannot withdraw more than they have lent. Adjusts the user's lent amount record accordingly.
     * @param tokenAddress The address of the token to withdraw from the lending pool.
     * @param tokenAmount The amount of tokens to withdraw.
     */
    function withdrawLendedToken(
        address tokenAddress,
        uint256 tokenAmount
    ) external {
        // Checks if pool exists
        if (address(tokenToPool[tokenAddress].poolAddress) == address(0)) {
            revert lendingTracker_poolNotAvailable();
        }
        // Checks if there is enough tokens in the pool
        if (userLendedAmount[msg.sender][tokenAddress] < tokenAmount) {
            revert lendingTracker_amountTooHigh();
        }
        userLendedAmount[msg.sender][tokenAddress] -= tokenAmount;
        tokenToPool[tokenAddress].poolAddress.withdraw(tokenAmount);
        // Transfer tokens to user
        IERC20(tokenAddress).transfer(msg.sender, tokenAmount);

        // // Pop the lended token from the array
        if (userLendedAmount[msg.sender][tokenAddress] == 0) {
            for (uint256 i; i < userLendedTokens[msg.sender].length; i++) {
                if (userLendedTokens[msg.sender][i] == tokenAddress) {
                    userLendedTokens[msg.sender][i] ==
                        userLendedTokens[msg.sender][
                            userLendedTokens[msg.sender].length - 1
                        ];
                    userLendedTokens[msg.sender].pop();
                }
            }
        }
        // Event
        emit userWithdrawnLendedTokens(msg.sender, tokenAddress, tokenAmount);
    }

    /**
     * @notice Checks if a new token is not already tracked by the user's token array.
     * @dev Utility function to prevent duplicate entries in user token arrays.
     * @param userTokens Array of token addresses the user has interacted with.
     * @param token Address of the token to check.
     * @return bool True if the token is not in the array, false otherwise.
     */
    function newTokenChecker(
        address[] memory userTokens,
        address token
    ) internal pure returns (bool) {
        bool newToken = true;
        for (uint256 i; i < userTokens.length; i++) {
            if (token == userTokens[i]) {
                newToken = false;
            }
        }
        return newToken;
    }

    /**
     * @notice Claims yield for the user based on the tokens they have lent to the pool.
     * @dev Calculates the yield based on the amount lent and the time passed, then transfers the yield to the user.
     * @param tokenAddress The address of the token for which yield is being claimed.
     */
    function getYield(address tokenAddress) external {
        uint256 yield = tokenToPool[tokenAddress].poolAddress.getYield(
            msg.sender,
            userLendedAmount[msg.sender][tokenAddress]
        );
        // Event
        emit userFarmedYield(msg.sender, tokenAddress, yield);
    }

    /**
     * @notice Retrieves an array of all available tokens for lending and borrowing.
     * @dev Provides a list of token addresses that users can interact with within the lending platform.
     * @return An array containing the addresses of all available tokens.
     */
    function allAvailableTokens() external view returns (address[] memory) {
        return availableTokens;
    }

    /**
     * @notice Sets the address of the borrowing contract.
     * @dev Allows the owner to define the contract responsible for borrowing functionality.
     * @param newBorrowingContract The address of the new borrowing contract.
     */
    function addBorrowingContract(address newBorrowingContract) external {
        borrowingContract = newBorrowingContract;
    }

    /**
     * @notice Retrieves an array of tokens that a user has lent to the lending pools.
     * @dev Provides insight into the tokens a specific user has contributed for lending.
     * @param user The address of the user whose lent tokens are being queried.
     * @return An array containing the addresses of tokens lent by the user.
     */
    function getLoanedTokens(
        address user
    ) external view returns (address[] memory) {
        return userLendedTokens[user];
    }
}
