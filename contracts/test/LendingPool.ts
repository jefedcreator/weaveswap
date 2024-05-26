import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("Lending pool", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployLendingPool() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const [ownerAddress] = await owner.getAddresses();
    const zkBridge = "0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7";
    const mintAmount = parseEther("1");

    const token1 = await hre.viem.deployContract("TestToken1");
    const token2 = await hre.viem.deployContract("TestToken2");
    const yieldCalculator = await hre.viem.deployContract("YieldCalculator", [
      zkBridge,
    ]);
    const lendingTracker = await hre.viem.deployContract("LendingTracker");
    const poolTracker = await hre.viem.deployContract("PoolTracker", [
      yieldCalculator.address,
    ]);
    const swapRouter = await hre.viem.deployContract("SwapRouter", [
      poolTracker.address,
    ]);
    const priceAggregator1 = await hre.viem.deployContract("MockV3Aggregator", [
      8,
      BigInt(5000000000),
    ]);
    const priceAggregator2 = await hre.viem.deployContract("MockV3Aggregator", [
      8,
      BigInt(5000000000),
    ]);
    const priceAggregator3 = await hre.viem.deployContract("MockV3Aggregator", [
      8,
      BigInt(5000000000),
    ]);

    const borrowingTracker = await hre.viem.deployContract("BorrowingTracker", [
      lendingTracker.address,
      swapRouter.address,
    ]);

    const publicClient = await hre.viem.getPublicClient();
    const collateralAmount = parseEther("10000");
    const collateralAmount2 = parseEther("500");
    await token1.write.approve([lendingTracker.address, collateralAmount]);

    await lendingTracker.write.addBorrowingContract([borrowingTracker.address]);
    await lendingTracker.write.addTokenPool([
      token1.address,
      priceAggregator1.address,
    ]);

    await lendingTracker.write.addTokenPool([
      token2.address,
      priceAggregator2.address,
    ]);

    const mappingResult = await lendingTracker.read.tokenToPool([
      token1.address,
    ]);
    const lendingPoolContract = await hre.viem.getContractAt(
      "Pool",
      mappingResult[0]
    );

    await token1.write.approve([borrowingTracker.address, collateralAmount]);
    await token2.write.approve([borrowingTracker.address, collateralAmount]);
    await token1.write.approve([lendingTracker.address, collateralAmount]);
    await token2.write.approve([lendingTracker.address, collateralAmount]);

    await borrowingTracker.write.stakeCollateral([
      token2.address,
      parseEther("500"),
    ]);

    return {
      token1,
      token2,
      owner,
      otherAccount,
      publicClient,
      lendingPoolContract,

      mintAmount,
      ownerAddress,
      lendingTracker,
      borrowingTracker,
      priceAggregator1,
      priceAggregator2,
      collateralAmount,
      mappingResult,
      collateralAmount2,
    };
  }

  describe("Token part", () => {
    it("Mints the tokens", async () => {
      const { token1, ownerAddress } = await loadFixture(deployLendingPool);

      expect(await token1.read.balanceOf([ownerAddress])).to.equal(
        parseEther("1000")
      );
    });
  });

  describe("Deploys the new pool contracts", () => {
    it("Adds pool to a mapping", async () => {
      const { priceAggregator1, mappingResult } = await loadFixture(
        deployLendingPool
      );
      expect(mappingResult[1].toLowerCase()).to.equal(
        priceAggregator1.address.toLowerCase()
      );
    });
    it("Pool variables", async () => {
      const { token1, lendingTracker, lendingPoolContract } = await loadFixture(
        deployLendingPool
      );
      expect(
        (await lendingPoolContract.read.ownerContract()).toLowerCase()
      ).to.equal(lendingTracker.address.toLowerCase());

      expect((await lendingPoolContract.read.token()).toLowerCase()).to.equal(
        token1.address.toLowerCase()
      );
    });
    it("Pool interaction constrictions", async () => {
      const { mintAmount, lendingPoolContract } = await loadFixture(
        deployLendingPool
      );
      await expect(lendingPoolContract.write.lend([mintAmount])).to.be.rejected;
    });
    it("ChangePriceFeed", async () => {
      const { token1, lendingTracker, priceAggregator2 } = await loadFixture(
        deployLendingPool
      );
      await lendingTracker.write.changePriceFeed([
        token1.address,
        token1.address,
      ]);
      const mappingResult = await lendingTracker.read.tokenToPool([
        token1.address,
      ]);
      expect(mappingResult[1].toLowerCase()).to.equal(
        token1.address.toLowerCase()
      );
      await lendingTracker.write.changePriceFeed([
        token1.address,
        priceAggregator2.address,
      ]);
    });
  });
  describe("lendToken", () => {
    it("Reverts if token not available", async () => {
      const { ownerAddress, lendingTracker } = await loadFixture(
        deployLendingPool
      );
      await expect(
        lendingTracker.write.lendToken([ownerAddress, parseEther("10")])
      ).to.be.rejected;
    });
    it("lend and Updates the balances", async () => {
      const {
        token1,
        ownerAddress,
        lendingTracker,
        token2,
        lendingPoolContract,
      } = await loadFixture(deployLendingPool);
      await lendingTracker.write.lendToken([token1.address, parseEther("500")]);
      await lendingTracker.write.lendToken([token2.address, parseEther("100")]);

      expect(
        await token1.read.balanceOf([lendingPoolContract.address])
      ).to.equal(parseEther("500"));
      expect(await token1.read.balanceOf([lendingTracker.address])).to.equal(
        parseEther("0")
      );
      expect(await token1.read.balanceOf([ownerAddress])).to.equal(
        parseEther("500")
      );
    });
    it("Updates the mapping", async () => {
      const { token1, ownerAddress, lendingTracker } = await loadFixture(
        deployLendingPool
      );
      await lendingTracker.write.lendToken([token1.address, parseEther("500")]);

      const userTokens = await lendingTracker.read.userLendedTokens([
        ownerAddress,
        BigInt(0),
      ]);
      expect(userTokens.toLowerCase()).to.equal(token1.address.toLowerCase());
    });
    it("Updates reserve in the pool", async () => {
      const { token1, lendingTracker, lendingPoolContract } = await loadFixture(
        deployLendingPool
      );
      await lendingTracker.write.lendToken([token1.address, parseEther("500")]);

      expect(await lendingPoolContract.read.reserve()).to.equal(
        parseEther("500")
      );
    });
    it("WithdrawLendedToken", async () => {
      const { token1, ownerAddress, lendingTracker, lendingPoolContract } =
        await loadFixture(deployLendingPool);
      await lendingTracker.write.lendToken([token1.address, parseEther("500")]);

      expect(await lendingPoolContract.read.reserve()).to.equal(
        parseEther("500")
      );
      expect(await token1.read.balanceOf([ownerAddress])).to.equal(
        parseEther("500")
      );
      await lendingTracker.write.withdrawLendedToken([
        token1.address,
        parseEther("500"),
      ]);
      expect(await lendingPoolContract.read.reserve()).to.equal(BigInt(0));
      expect(await token1.read.balanceOf([ownerAddress])).to.equal(
        parseEther("1000")
      );
    });
  });
  describe("Collateral", async () => {
    it("Reverts if pool doesnt exist", async () => {
      const { token1, mintAmount, lendingTracker, borrowingTracker } =
        await loadFixture(deployLendingPool);
      await token1.write.approve([lendingTracker.address, mintAmount]);
      await expect(
        borrowingTracker.write.stakeCollateral([token1.address, mintAmount])
      ).to.be.rejected;
    });
    it("Reverts if the price is under 100", async () => {
      const { token1, borrowingTracker } = await loadFixture(deployLendingPool);
      await expect(
        borrowingTracker.write.stakeCollateral([
          token1.address,
          parseEther("1"),
        ])
      ).to.be.rejected;
    });
    it("Stakes the collateral", async () => {
      const { ownerAddress, borrowingTracker, token2 } = await loadFixture(
        deployLendingPool
      );
      expect(await token2.read.balanceOf([borrowingTracker.address])).to.equal(
        parseEther("500")
      );

      expect(
        await borrowingTracker.read.collateral([ownerAddress, token2.address])
      ).to.equal(parseEther("500"));

      const collateralTokens = await borrowingTracker.read.collateralTokens([
        ownerAddress,
        BigInt(BigInt(0)),
      ]);

      const expectedTokenAddress = token2.address.toLowerCase();
      const collateralTokenLowerCase = collateralTokens.toLowerCase();

      expect(collateralTokenLowerCase).to.equal(expectedTokenAddress);
    });
    it("unstakes the collateral", async () => {
      const { ownerAddress, borrowingTracker, token2, collateralAmount2 } =
        await loadFixture(deployLendingPool);

      await borrowingTracker.write.unstakeCollateral([
        token2.address,
        collateralAmount2,
      ]);
      expect(await token2.read.balanceOf([borrowingTracker.address])).to.equal(
        BigInt(0)
      );
      expect(await token2.read.balanceOf([ownerAddress])).to.equal(
        parseEther("1000")
      );
      await expect(
        borrowingTracker.read.collateralTokens([ownerAddress, BigInt(0)])
      ).to.be.rejected;
      expect(
        await borrowingTracker.read.collateral([ownerAddress, token2.address])
      ).to.equal(BigInt(0));
    });
  });
  describe("Borrow", async () => {
    it("Reverts it pool is not available", async () => {
      const { ownerAddress, borrowingTracker } = await loadFixture(
        deployLendingPool
      );
      await expect(
        borrowingTracker.write.borrowToken([ownerAddress, parseEther("10")])
      ).to.be.rejected;
    });

    it("Updates mappings", async () => {
      const {
        ownerAddress,
        lendingTracker,
        borrowingTracker,
        token2,
        lendingPoolContract,
      } = await loadFixture(deployLendingPool);
      await token2.write.approve([lendingTracker.address, parseEther("500")]);
      await lendingTracker.write.lendToken([token2.address, parseEther("5")]);
      const borrowingId = await borrowingTracker.read.borrowingId([
        ownerAddress,
      ]);
      const deployerBalanceBefore = await token2.read.balanceOf([ownerAddress]);
      await token2.write.approve([
        borrowingTracker.address,
        deployerBalanceBefore,
      ]);
      await borrowingTracker.write.stakeCollateral([
        token2.address,
        parseEther("20"),
      ]);

      await borrowingTracker.write.borrowToken([
        token2.address,
        parseEther("0.1"),
      ]);

      const deployerBalanceAfter = await token2.read.balanceOf([ownerAddress]);
      expect(
        (
          await borrowingTracker.read.borrowedTokens([ownerAddress, BigInt(0)])
        ).toLowerCase()
      ).to.equal(token2.address.toLowerCase());
      expect(
        await borrowingTracker.read.userBorrowReceipts([
          ownerAddress,
          token2.address,
          BigInt(0),
        ])
      ).to.equal(borrowingId);
      expect(
        (
          await borrowingTracker.read.borrowReceiptData([
            ownerAddress,
            borrowingId,
          ])
        )[1]
      ).to.equal(parseEther("0.1"));
      expect(
        (
          await borrowingTracker.read.borrowReceiptData([
            ownerAddress,
            borrowingId,
          ])
        )[0].toLowerCase()
      ).to.equal(token2.address.toLowerCase());
      expect(
        (
          await borrowingTracker.read.borrowReceiptData([
            ownerAddress,
            borrowingId,
          ])
        )[3]
      ).to.equal(BigInt(0));
      expect(deployerBalanceBefore).to.equal(
        deployerBalanceAfter + parseEther("19.9")
      );
      expect(
        await token2.read.balanceOf([lendingPoolContract.address])
      ).to.equal(BigInt(0));
    });
    it("Reverts if treshold is too high", async () => {
      const { ownerAddress, lendingTracker, borrowingTracker, token2 } =
        await loadFixture(deployLendingPool);
      await lendingTracker.write.lendToken([token2.address, parseEther("5")]);

      await borrowingTracker.write.stakeCollateral([
        token2.address,
        parseEther("20"),
      ]);

      const borrowingId = await borrowingTracker.read.borrowingId([
        ownerAddress,
      ]);

      await borrowingTracker.write.borrowToken([
        token2.address,
        parseEther("1"),
      ]);
      await borrowingTracker.read.totalBorrowed([ownerAddress]);
      await borrowingTracker.write.returnBorrowedToken([
        borrowingId,
        parseEther("1"),
      ]);

      await borrowingTracker.read.borrowReceiptData([ownerAddress, BigInt(0)]);

      expect(
        await borrowingTracker.read.liquidityTreshold([
          ownerAddress,
          "0x0000000000000000000000000000000000000000",
          BigInt(0),
        ])
      ).to.equal(BigInt(0));
      expect(
        await borrowingTracker.read.liquidityTreshold([
          ownerAddress,
          token2.address,
          parseEther("10"),
        ])
      ).to.equal(BigInt(1));
    });
    it("Accrued interest", async () => {
      const { ownerAddress, borrowingTracker } = await loadFixture(
        deployLendingPool
      );
      const borrowingId = await borrowingTracker.read.borrowingId([
        ownerAddress,
      ]);
      expect(
        await borrowingTracker.read.accruedInterest([
          borrowingId,
          ownerAddress,
          parseEther("10"),
        ])
      ).to.equal(BigInt(0));
    });
    it("Returns borrowed tokens", async () => {
      const {
        token1,
        ownerAddress,
        lendingTracker,
        borrowingTracker,
        token2,
        lendingPoolContract,
      } = await loadFixture(deployLendingPool);
      const token2deployerBalanceBefore = await token2.read.balanceOf([
        ownerAddress,
      ]);
      await token2.write.approve([
        lendingTracker.address,
        token2deployerBalanceBefore,
      ]);
      await lendingTracker.write.lendToken([
        token2.address,
        token2deployerBalanceBefore,
      ]);
      await token2.read.balanceOf([ownerAddress]);
      const borrowingId = await borrowingTracker.read.borrowingId([
        ownerAddress,
      ]);
      await borrowingTracker.write.borrowToken([
        token2.address,
        parseEther("5"),
      ]);

      const deployerBalanceBefore = await token1.read.balanceOf([ownerAddress]);
      await borrowingTracker.write.returnBorrowedToken([
        borrowingId,
        parseEther("5"),
      ]);
      const deployerBalanceAfter = await token1.read.balanceOf([ownerAddress]);
      await borrowingTracker.read.borrowReceiptData([
        ownerAddress,
        borrowingId,
      ]);
      await expect(
        borrowingTracker.read.borrowedTokens([ownerAddress, borrowingId])
      ).to.be.rejected;

      expect(
        (
          await borrowingTracker.read.borrowReceiptData([
            ownerAddress,
            borrowingId,
          ])
        )[1]
      ).to.equal(parseEther("0"));
      expect(deployerBalanceBefore).to.equal(deployerBalanceAfter);
      expect(
        await token2.read.balanceOf([lendingPoolContract.address])
      ).to.equal(parseEther("0"));
    });
    it("Supports multiple Tokens", async () => {
      const {
        token1,
        ownerAddress,
        lendingTracker,
        borrowingTracker,
        token2,
        collateralAmount,
      } = await loadFixture(deployLendingPool);
      await token1.write.mint([ownerAddress, collateralAmount]);
      await token1.write.approve([lendingTracker.address, collateralAmount]);
      await token2.write.mint([ownerAddress, collateralAmount]);
      await token2.write.approve([lendingTracker.address, collateralAmount]);

      await lendingTracker.write.lendToken([token1.address, parseEther("50")]);
      await lendingTracker.write.lendToken([token2.address, parseEther("50")]);

      await borrowingTracker.write.stakeCollateral([
        token1.address,
        parseEther("100"),
      ]);

      await borrowingTracker.write.borrowToken([
        token1.address,
        parseEther("0.1"),
      ]);
      await expect(
        borrowingTracker.write.borrowToken([token2.address, parseEther("11")])
      ).to.be.fulfilled;
    });
  });
});
