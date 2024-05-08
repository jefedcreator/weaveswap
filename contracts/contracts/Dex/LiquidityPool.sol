// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

// Importing necessary contracts and interfaces
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "../Bridge/InterfaceBridge.sol";
import "./PoolTracker.sol";

// Custom errors for more descriptive and gas-efficient failure handling.
error assetNotCorrect();
error notEnoughTokens();
error notEnoughGas();
error notEnoughTimePassed();
error initialLiquidityAlreadyProvided();
error addressNotCorrect();
error amountTooBig();
error needToCallExistingFunction();

/**
 * @title LiquidityPool
 * @notice Manages liquidity provision, asset swapping, and yield generation in a decentralized manner.
 * @dev Implements IZKBridgeReceiver interface for cross-chain interactions and yield farming computations.
 */
contract LiquidityPool {
    // Events
    event priceChanged(address _asset, uint256 price);
    event liquidityAdded(
        address indexed _address,
        uint256 _assetOneAmount,
        uint256 _assetTwoAmount
    );
    event liquidityRemoved(
        address indexed _address,
        uint256 _assetOneAmount,
        uint256 _assetTwoAmount
    );
    event yieldFarmed(address indexed _address, uint256 _amount);

    // State variables
    address public assetOneAddress;
    address public assetTwoAddress;
    uint256 public initialLiquidity;
    uint256 public liquidity;
    uint256 public yield;
    uint256 public swapFee = 1000000000000000;
    address public owner;

    // Reentrancy Guard
    bool internal locked;

    // TRACK THE LP TOKEN QUANTITY, INITIAL LIQUIDITY
    mapping(address => uint256) public lpTokenQuantity;

    // Daily yield tracking
    mapping(address => uint256) public yieldTaken;

    // Timestamp mapping for yield farming
    mapping(address => uint256) public lastYieldFarmedTime;
    mapping(address => uint256) public initialLiquidityProvidedTime;

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
     * @dev Modifier to restrict functions only to the owner.
     */
    modifier onlyOwner() {
        msg.sender == owner;
        _;
    }

    /**
     * @dev Constructor to initialize the liquidity pool with two asset addresses.
     * @param _assetOneAddress The address of the first asset.
     * @param _assetTwoAddress The address of the second asset.
     */
    constructor(address _assetOneAddress, address _assetTwoAddress) {
        assetOneAddress = _assetOneAddress;
        assetTwoAddress = _assetTwoAddress;
        owner = msg.sender;
        swapFee = 1000000000000000; // 0.001 ether
    }

    /**
     * @dev Function to add initial liquidity to the pool. Only callable by the owner.
     * @dev Needs the ERC-20 approval for transferFrom.
     * @param _assetOneAmount The amount of the first asset to add.
     * @param _assetTwoAmount The amount of the second asset to add.
     */
    function addInitialLiquidity(
        uint256 _assetOneAmount,
        uint256 _assetTwoAmount
    ) public onlyOwner {
        if (initialLiquidityProvidedTime[owner] > 0) {
            revert initialLiquidityAlreadyProvided();
        }
        initialLiquidityProvidedTime[msg.sender] = block.timestamp;

        // SENDS THE TOKENS TO THE LIQUIDITY POOL
        IERC20(assetOneAddress).transferFrom(
            msg.sender,
            address(this),
            _assetOneAmount
        );
        IERC20(assetTwoAddress).transferFrom(
            msg.sender,
            address(this),
            _assetTwoAmount
        );

        // SET THE INITIAL LIQUIDITY
        initialLiquidity = _assetOneAmount * _assetTwoAmount;
        liquidity = initialLiquidity;

        // GIVE LP TOKENS TO THE INITIAL LIQUIDITY PROVIDER
        lpTokenQuantity[msg.sender] = initialLiquidity;

        // EMIT EVENT
        emit liquidityAdded(msg.sender, _assetOneAmount, _assetTwoAmount);
    }

    /**
     * @dev Function to add additional liquidity to the pool.
     * @dev Needs the ERC-20 approval for transferFrom.
     * @param _asset The address of the first asset.
     * @param _secondAsset The address of the second asset.
     * @param _amount The amount of the first asset to add.
     */
    function addLiquidity(
        address _asset,
        address _secondAsset,
        uint256 _amount
    ) external noReentrancy {
        // SET THE RATIO, require token balance provided in ERC20, reverted if too low
        IERC20(_secondAsset).transferFrom(
            msg.sender,
            address(this),
            amountOfOppositeTokenNeeded(_asset, _amount)
        );
        IERC20(_asset).transferFrom(msg.sender, address(this), _amount);

        // give lp tokens to new liquidity provider
        lpTokenQuantity[msg.sender] += (_amount *
            amountOfOppositeTokenNeeded(_asset, _amount));
        liquidity += (_amount * amountOfOppositeTokenNeeded(_asset, _amount));

        // EMIT EVENT
        emit liquidityAdded(
            msg.sender,
            amountOfOppositeTokenNeeded(_asset, _amount),
            _amount
        );
    }

    /**
     * @dev Function to remove liquidity from the pool.
     * @param _amount The percentage of liquidity to withdraw(10 -> 10%).
     */
    function removeLiquidity(uint256 _amount) external noReentrancy {
        uint256 userLpTokens = lpTokenQuantity[msg.sender];
        uint256 percentageOfLiquidity = (userLpTokens * 1 ether) / liquidity; // How much user owns out of all Liquidity in percentage
        uint256 percentageOfUserLiquidity = (percentageOfLiquidity * _amount) /
            100; // How much out of their liquidity they want to withdraw in percentage
        uint256 resultAssetOne = (percentageOfUserLiquidity * getAssetOne()) /
            1 ether;
        uint256 resultAssetTwo = (percentageOfUserLiquidity * getAssetTwo()) /
            1 ether;
        // condition for owner, because of the initial liquidity timer
        if (
            (msg.sender == owner) &&
            (isTimeInitialLiquidity() == false) &&
            //the owner has the ability to withdraw liquidity if it wasn't part of initial liquidity
            ((lpTokenQuantity[msg.sender] - (resultAssetOne * resultAssetTwo)) <
                initialLiquidity)
        ) {
            revert notEnoughTokens();
        }
        // check balance if it is high enough to continue, can't get reverted at transfer, it should have the balance but just in case
        if (
            IERC20(assetOneAddress).balanceOf(address(this)) < resultAssetOne ||
            IERC20(assetTwoAddress).balanceOf(address(this)) < resultAssetTwo
        ) {
            revert notEnoughTokens();
        }
        IERC20(assetOneAddress).transfer(msg.sender, resultAssetOne);
        IERC20(assetTwoAddress).transfer(msg.sender, resultAssetTwo);

        // EMIT EVENT
        emit liquidityRemoved(msg.sender, resultAssetOne, resultAssetTwo);
    }

    /**
     * @dev Function to sell the first asset and receive the second asset.
     * @param _amount The amount of the first asset to sell.
     */
    function sellAssetOne(
        uint256 _amount
    ) external payable noReentrancy returns (uint256) {
        //PAY THE ETH FEE
        if (msg.value < swapFee) {
            revert notEnoughGas();
        }
        yield += swapFee;
        uint256 unrequiredFee = msg.value - swapFee; // In case the msg.sender sent more value than it is required
        //CALCULATION
        uint256 n = getAssetTwo();
        uint256 assetOne = getAssetOne() + _amount;
        uint256 assetTwo = liquidity / assetOne;
        uint256 result = n - assetTwo;
        //SENDING THE OPPOSITE ASSET TO THE CALLER FROM LIQUIDITY POOL
        IERC20(assetOneAddress).transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        IERC20(assetTwoAddress).transfer(msg.sender, result);
        (bool sent, ) = payable(msg.sender).call{value: unrequiredFee}("");
        require(sent, "Failed to send Ether");
        //EVENTS
        emit priceChanged(assetOneAddress, assetOnePrice());
        emit priceChanged(assetTwoAddress, assetTwoPrice());
        // Returns the amount of token
        return result;
    }

    /**
     * @dev Function to sell the second asset and receive the first asset.
     * @param _amount The amount of the second asset to sell.
     */
    function sellAssetTwo(
        uint256 _amount
    ) external payable noReentrancy returns (uint256) {
        //PAY THE ETH FEE
        if (msg.value < swapFee) {
            revert notEnoughGas();
        }
        yield += swapFee;
        uint256 unrequiredFee = msg.value - swapFee; // In case the msg.sender sent more value than it is required
        //CALCULATION
        uint256 n = getAssetOne();
        uint256 assetTwo = getAssetTwo() + _amount;
        uint256 assetOne = liquidity / assetTwo;
        uint256 result = n - assetOne;
        //GETTING THE ASSET FROM CALLER TO THE LIQUIDITY POOL AND SENDING THE OPPOSITE ASSET TO THE CALLER FROM LIQUIDITY POOL
        IERC20(assetTwoAddress).transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        IERC20(assetOneAddress).transfer(msg.sender, result);
        (bool sent, ) = payable(msg.sender).call{value: unrequiredFee}("");
        require(sent, "Failed to send Ether");
        //EVENTS
        emit priceChanged(assetOneAddress, assetOnePrice());
        emit priceChanged(assetTwoAddress, assetTwoPrice());
        //Returns amount of token
        return result;
    }

    /**
     * @dev Function to get the current balance of a given asset held by the contract.
     * @param _address The address of the asset.
     * @return The current balance of the asset.
     */
    function getAssetBalace(address _address) public view returns (uint256) {
        return IERC20(_address).balanceOf(address(this));
    }

    /**
     * @dev Function to get the current price of the first asset in terms of the second asset.
     * @return The current price of the first asset * 10**18.
     */
    function assetOnePrice() public view returns (uint256) {
        return (getAssetTwo() * 1 ether) / getAssetOne();
    }

    /**
     * @dev Function to get the current price of the second asset in terms of the first asset.
     * @return The current price of the second asset * 10**18.
     */
    function assetTwoPrice() public view returns (uint256) {
        return (getAssetOne() * 1 ether) / getAssetTwo();
    }

    /**
     * @dev Function to get the amount of the first asset held by the contract.
     * @return The current balance of the first asset.
     */
    function getAssetOne() public view returns (uint256) {
        return IERC20(assetOneAddress).balanceOf(address(this));
    }

    /**
     * @dev Function to get the amount of the second asset held by the contract.
     * @return The current balance of the second asset.
     */
    function getAssetTwo() public view returns (uint256) {
        return IERC20(assetTwoAddress).balanceOf(address(this));
    }

    /**
     * @dev Function to get the quantity of LP tokens owned by a specific address.
     * @param _address The address of the LP token holder.
     * @return The quantity of LP tokens owned by the address.
     */
    function getLpTokenQuantity(
        address _address
    ) public view returns (uint256) {
        if (msg.sender != owner && _address == msg.sender) {
            revert addressNotCorrect();
        }
        return lpTokenQuantity[_address];
    }

    /**
     * @dev Function to get the current ETH balance of the contract.
     * @return The current ETH balance of the contract.
     */
    function addressBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Function to get the quantity of the second asset that would be returned for a given amount of the first asset.
     * @param sellingAsset The address of the asset being sold.
     * @param _amount The amount of the first asset being sold.
     * @return The quantity of the second asset that would be returned
     */
    function getSwapQuantity(
        address sellingAsset,
        uint256 _amount
    ) public view returns (uint256) {
        if (sellingAsset == assetOneAddress) {
            uint256 newAssetOne = getAssetOne() + _amount;
            uint256 newAssetTwo = liquidity / newAssetOne;
            return getAssetTwo() - newAssetTwo;
        } else if (sellingAsset == assetTwoAddress) {
            uint256 newAssetTwo = getAssetTwo() + _amount;
            uint256 newAssetOne = liquidity / newAssetTwo;
            return getAssetOne() - newAssetOne;
        } else {
            revert assetNotCorrect();
        }
    }

    /**
     * @dev Function to get the second part of the liquidity token pair needed for providing liquidity.
     * @param _asset The address of the asset.
     * @param _amount The amount of the asset.
     * @return The quantity of the second asset needed for providing liquidity.
     */
    function amountOfOppositeTokenNeeded(
        address _asset,
        uint256 _amount
    ) public view returns (uint256) {
        uint256 ratio;
        if (_asset == assetOneAddress) {
            ratio = (getAssetTwo() * 1 ether) / getAssetOne();
        } else {
            ratio = (getAssetOne() * 1 ether) / getAssetTwo();
        }
        uint256 amountNeeded = (_amount * ratio) / 1 ether;
        return amountNeeded;
    }

    /////////////////////////////////////////////////////////////////
    // Yield Farming and Time Locks

    /**
     * @dev Function to allow users to claim their yield. Can be called once a day.
     *
     * @notice sends the request to yield Calculator smart contract to compute yield with lower gas fee
     */
    function getYield() public payable {
        if (isTime() == false) {
            revert notEnoughTimePassed();
        }
        //NOW SEND BACK THE AVAILABLE YIELD
        uint16 destinationChain = PoolTracker(owner).destinationChain();
        IZKBridge zkBridge = PoolTracker(owner).zkBridge();
        address yieldCalculator = PoolTracker(owner).yieldCalculator();
        bytes memory newPayload = abi.encode(msg.sender);
        uint256 fee = zkBridge.estimateFee(destinationChain);
        zkBridge.send{value: fee}(
            destinationChain,
            yieldCalculator,
            newPayload
        );
        // Pay this to our contract which will fund the bridge contract with tokens
        uint256 bridgeFee = zkBridge.estimateFee(destinationChain);
        (bool sent, ) = payable(owner).call{value: bridgeFee}("");
        require(sent, "Failed to send Ether");
    }

    /**
     * @dev Returns the request for lower gas fee computation
     *
     * @param payload returns the computation
     *
     */
    // function zkReceive(
    //     // uint16 srcChainId,
    //     // address srcAddress,
    //     // uint64 nonce,
    //     bytes calldata payload
    // ) external {
    //     (uint256 availableYield, address user) = abi.decode(
    //         payload,
    //         (uint256, address)
    //     );
    //     //TODO handle your business
    //     if (availableYield > address(this).balance) {
    //         revert notEnoughTokens(); // IN CASE THERE IS A LOT OF PEOPLE GETTING YIELD AT ONCE AND RATIOS GET CHANGED TOO MUCH
    //     }
    //     yieldTaken[user] += availableYield;
    //     (bool sent, ) = payable(user).call{value: availableYield}("");
    //     require(sent, "Failed to send Ether");
    //     // EMIT EVENT
    //     emit yieldFarmed(msg.sender, availableYield);
    // }

    /**
     * @dev Function to check if enough time has passed for the user to claim yield.
     * @return Whether enough time has passed or not.
     */
    function isTime() public view returns (bool) {
        lastYieldFarmedTime[msg.sender];
        uint256 currentStamp = block.timestamp;
        if ((lastYieldFarmedTime[msg.sender] + 1 days) < currentStamp) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Function to check if enough time has passed since the initial liquidity was provided.
     * @return Whether enough time has passed or not.
     */
    function isTimeInitialLiquidity() public view returns (bool) {
        if (
            block.timestamp >
            (initialLiquidityProvidedTime[msg.sender] + 365 days)
        ) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Fallback function if address calls unexisting function, but contains msg.data
     * @notice The transaction gets reverted since the contract doesn't have the infrastructure to process it
     */
    fallback() external payable {
        revert needToCallExistingFunction();
    }

    /**
     * @dev Receive function if address calls unexisting function, without msg.data
     * @notice The transaction gets reverted since the contract doesn't have the infrastructure to process it
     */
    receive() external payable {
        revert needToCallExistingFunction();
    }
}
