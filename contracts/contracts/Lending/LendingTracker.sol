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

contract LendingTracker {
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

    // Mappings to track lending pools, user interactions, and collateral
    mapping(address => tokenPool) public tokenToPool; // To find pool for specific ERC20 address
    address[] public availableTokens; // All available tokens to lend, borrow and collateralize

    mapping(address => mapping(address => uint256)) public userLendedAmount; // Lended amount of specific token for user
    mapping(address => address[]) public userLendedTokens; // All lended token addresses of user
    mapping(address => uint256) public totalLent; // Total lent amount of the user

    // Events for logging various actions within the contract
    event userLended(address indexed user, address tokenAddress, uint256 tokenAmount);
    event userWithdrawnLendedTokens(address indexed user, address tokenAddress, uint256 tokenAmount);
    event userFarmedYield(address user, address tokenAddress, uint256 tokenAmount);

    function addTokenPool(address tokenAddress, address priceAddress) external {
        if (msg.sender != owner) {
            revert lendingTracker_addressNotAllowed();
        }
        if (address(tokenToPool[tokenAddress].poolAddress) != address(0)) {
            revert lendingTracker_poolExists();
        }
        Pool newPool = new Pool(tokenAddress, address(borrowingContract));
        tokenToPool[tokenAddress] = tokenPool(newPool, priceAddress);
        availableTokens.push(tokenAddress);
    }

    function changePriceFeed(address tokenAddress, address priceAddress) external {
        if (msg.sender != owner) {
            revert lendingTracker_addressNotAllowed();
        }
        if (address(tokenToPool[tokenAddress].poolAddress) == address(0)) {
            revert lendingTracker_poolNotAvailable();
        }
        tokenToPool[tokenAddress].priceAddress = priceAddress;
    }

    function changeBorrowingAPY(address tokenAddress, uint256 newAPY) external {
        if (msg.sender != owner) {
            revert lendingTracker_addressNotAllowed();
        }
        tokenToPool[tokenAddress].poolAddress.setBorrowingAPY(newAPY);
    }

    function lendToken(address tokenAddress, uint256 tokenAmount) external {

        if (address(tokenToPool[tokenAddress].poolAddress) == address(0)) {
            revert lendingTracker_poolNotAvailable();
        }
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), tokenAmount);
        IERC20(tokenAddress).approve(address(tokenToPool[tokenAddress].poolAddress), tokenAmount);

        if (newTokenChecker(userLendedTokens[msg.sender], tokenAddress)) {
            userLendedTokens[msg.sender].push(tokenAddress);
        }

        userLendedAmount[msg.sender][tokenAddress] += tokenAmount;
        tokenToPool[tokenAddress].poolAddress.lend(tokenAmount);
        int conversion = getTokenPrice(tokenAddress);
        require(conversion >= 0, "Conversion must be non-negative");
        uint256 conversionUint = uint256(conversion);
        uint256 borrowedAmount = conversionUint * tokenAmount;
        totalLent[msg.sender] += borrowedAmount;

        emit userLended(msg.sender, tokenAddress, tokenAmount);
    }

    function withdrawLendedToken(address tokenAddress, uint256 tokenAmount) external {
        if (address(tokenToPool[tokenAddress].poolAddress) == address(0)) {
            revert lendingTracker_poolNotAvailable();
        }
        if (userLendedAmount[msg.sender][tokenAddress] < tokenAmount) {
            revert lendingTracker_amountTooHigh();
        }
        userLendedAmount[msg.sender][tokenAddress] -= tokenAmount;
        tokenToPool[tokenAddress].poolAddress.withdraw(tokenAmount);
        IERC20(tokenAddress).transfer(msg.sender, tokenAmount);

        if (userLendedAmount[msg.sender][tokenAddress] == 0) {
            for (uint256 i; i < userLendedTokens[msg.sender].length; i++) {
                if (userLendedTokens[msg.sender][i] == tokenAddress) {
                    userLendedTokens[msg.sender][i] = userLendedTokens[msg.sender][userLendedTokens[msg.sender].length - 1];
                    userLendedTokens[msg.sender].pop();
                    break;
                }
            }
        }
        int conversion = getTokenPrice(tokenAddress);
        require(conversion >= 0, "Conversion must be non-negative");
        uint256 conversionUint = uint256(conversion);
        uint256 borrowedAmount = conversionUint * tokenAmount;
        totalLent[msg.sender] -= borrowedAmount;
        emit userWithdrawnLendedTokens(msg.sender, tokenAddress, tokenAmount);
    }

    function newTokenChecker(address[] memory userTokens, address token) internal pure returns (bool) {
        for (uint256 i; i < userTokens.length; i++) {
            if (token == userTokens[i]) {
                return false;
            }
        }
        return true;
    }

    function getYield(address tokenAddress) external {
        uint256 yield = tokenToPool[tokenAddress].poolAddress.getYield(msg.sender, userLendedAmount[msg.sender][tokenAddress]);
        emit userFarmedYield(msg.sender, tokenAddress, yield);
    }
 
    function allAvailableTokens() external view returns (address[] memory) {
        return availableTokens;
    }

    function addBorrowingContract(address newBorrowingContract) external {
        borrowingContract = newBorrowingContract;
    }

    function getLoanedTokens(address user) external view returns (address[] memory) {
        return userLendedTokens[user];
    }

    function getTokenPrice(address _tokenAddress) public view returns (int) {
        address priceAddress = address(tokenToPool[_tokenAddress].priceAddress);
        if (priceAddress == address(0)) {
            revert lendingTracker_poolNotAvailable();
        }
        (, int answer, , , ) = AggregatorV3Interface(priceAddress).latestRoundData();
        return answer;
    }
}
