// SPDX-License-Identifier:MIT

pragma solidity ^0.8.9;

// OpenZeppelin's ERC20 interface for interactions with ERC20 tokens.
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "hardhat/console.sol";

// Custom errors for specific failure conditions.
error lending_outOfReserve();
error lending_addressNotAllowed();
error lending_reserveNotAvailable();
error lending_notEnoughTimePassed();

/**
 * @title Lending
 * @dev Implements lending and yield farming functionalities for a specific ERC20 token.
 * This contract allows tokens to be lent out and borrowed, tracks yield farming activities,
 * and allows for the accumulation and withdrawal of yield based on predefined APY.
 */
contract Pool {
    // The ERC20 token used for lending and borrowing.
    IERC20 public token;

    // Address of the owner contract.
    address public ownerContract;
    address public borrowingContract;

    // Total amount of tokens lent out.
    uint256 public amoutLended;

    // Available reserve for borrowing.
    uint256 public reserve;

    // Annual Percentage Yield for borrowing.
    uint256 public borrowingAPY;

    // Total yield generated.
    uint256 public yield;

    // Yield already farmed.
    uint256 public farmedYield;

    // Mapping of addresses to their last yield farming timestamp.
    mapping(address => uint256) public lastYieldFarmedTime;

    // Mapping of addresses to the amount of yield they have taken.
    mapping(address => uint256) public yieldTaken;

    /**
     * @dev Ensures that only the owner contract can call the modified function.
     */
    modifier onlyOwner() {
        if (msg.sender != ownerContract && msg.sender != borrowingContract) {
            revert lending_addressNotAllowed();
        }
        _;
    }

    /**
     * @param _token The ERC20 token address for lending and borrowing.
     */
    constructor(address _token, address newBorrowingContract) {
        borrowingContract = newBorrowingContract;
        token = IERC20(_token);
        ownerContract = msg.sender;
    }

    /**
     * @notice Allows the owner to change borrow contract.
     * @param _newBorrowingContract The new borrow contract.
     */

    function addBorrowContract(address _newBorrowingContract) external onlyOwner {
        borrowingContract = _newBorrowingContract;
    }
    
    function borrow(uint256 amount) external onlyOwner {
        if (reserve - amount < 0) {
            revert lending_outOfReserve();
        }
        token.transfer(msg.sender, amount);
    }

    /**
     * @notice Allows the owner to lend tokens to the contract.
     * @param amount The amount of tokens to lend.
     */
    function lend(uint256 amount) external onlyOwner {
        token.transferFrom(msg.sender, address(this), amount);
        reserve += amount;
    }

    /**
     * @notice Sets the borrowing APY.
     * @param newAPY The new APY value.
     */
    function setBorrowingAPY(uint256 newAPY) external onlyOwner {
        borrowingAPY = newAPY;
    }

    /**
     * @notice Checks if enough time has passed for a user to farm yield again.
     * @param user The address of the user.
     * @return bool True if enough time has passed, false otherwise.
     */
    function isTime(address user) internal view returns (bool) {
        lastYieldFarmedTime[user];
        uint256 currentStamp = block.timestamp;
        if ((lastYieldFarmedTime[user] + 1 days) < currentStamp) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @notice Withdraws tokens from the reserve.
     * This function allows the owner to withdraw tokens from the available reserve, reducing the reserve balance.
     * @param amount The amount of tokens to withdraw from the reserve.
     */
    function withdraw(uint256 amount) external onlyOwner {
        if (reserve - amount < 0) {
            revert lending_reserveNotAvailable();
        }
        token.transfer(msg.sender, amount);
        reserve -= amount;
    }

    /**
     * @notice Calculates and returns the available yield for a user.
     * This function updates the yield taken and farmed yield accordingly.
     * @param user The address of the user farming yield.
     * @param tokenAmount The amount of tokens used for calculating the user's share of the yield.
     * @return uint256 The amount of yield available for the user.
     */
    function getYield(
        address user,
        uint256 tokenAmount
    ) external onlyOwner returns (uint256) {
        if (isTime(user) == false) {
            revert lending_notEnoughTimePassed();
        }
        lastYieldFarmedTime[user] = block.timestamp; // Reentrancy guard
        uint256 yieldSoFar = yieldTaken[user];
        uint256 userLiquidity = (tokenAmount * 100) / amoutLended;
        uint256 availableYield = ((yield -
            ((yieldSoFar * 100) / userLiquidity)) * userLiquidity) / 100;

        if (availableYield > yield - farmedYield) {
            revert lending_notEnoughTimePassed(); // IN CASE THERE IS A LOT OF PEOPLE GETTING YIELD AT ONCE AND RATIOS GET CHANGED TOO MUCH
        }
        yieldTaken[msg.sender] += availableYield;
        farmedYield += availableYield;
        token.transfer(user, yield);
        return availableYield;
    }

    // To book how much yield came to the contract
    function bookYield(uint256 _yield) external onlyOwner {
        yield += _yield;
    }
}
