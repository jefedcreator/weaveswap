import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseGwei, parseEther } from "viem";

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
    const token2 = await hre.viem.deployContract("TestToken1");
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
    const priceAggregator = await hre.viem.deployContract("MockV3Aggregator", [
      8,
      BigInt(5000000000),
    ]);
    const borrowingTracker = await hre.viem.deployContract("BorrowingTracker", [
      lendingTracker.address,
      swapRouter.address,
    ]);

    const lendingPool = await hre.viem.deployContract("Pool", [
      token1.address,
      borrowingTracker.address,
    ]);

    const publicClient = await hre.viem.getPublicClient();
    const collateralAmount = parseEther("10000");

    // await lendingTracker.write.addBorrowingContract([borrowingTracker.address]);
    // await lendingTracker.write.addTokenPool([
    //   token1.address,
    //   priceAggregator.address,
    // ]);
    // await lendingTracker.write.addTokenPool([
    //   token1.address,
    //   priceAggregator.address,
    // ]);
    // await token1.write.approve([lendingTracker.address, mintAmount]);
    // await lendingTracker.write.lendToken([token1.address, parseEther("500")]);
    // await token1.write.approve([lendingTracker.address, parseEther("500")]);
    // await lendingTracker.write.lendToken([token1.address, parseEther("500")]);
    // const mappingResult = await lendingTracker.read.tokenToPool([
    //   token1.address,
    // ]);
    // const lendingPoolContract = await hre.viem.getContractAt(
    //   "Pool",
    //   mappingResult[0]
    // );

    return {
      token1,
      token2,
      owner,
      otherAccount,
      publicClient,
      lendingPool,
      mintAmount,
      ownerAddress,
      lendingTracker,
      borrowingTracker,
      priceAggregator,
      collateralAmount,
    };
  }

  describe("Token part", () => {
    it("Mints the tokens", async () => {
      const { token1, mintAmount, owner, ownerAddress } = await loadFixture(
        deployLendingPool
      );

      expect(await token1.read.balanceOf([ownerAddress])).to.equal(
        parseEther("1000")
      );
    });
  });

  describe("LendingTracker", async () => {
    const {
      token1,
      mintAmount,
      owner,
      ownerAddress,
      lendingPool,
      lendingTracker,
      borrowingTracker,
      priceAggregator,
    } = await loadFixture(deployLendingPool);
    describe("Deploys the new pool contracts", () => {
      it("Adds pool to a mapping", async () => {
        await lendingTracker.write.addBorrowingContract([
          borrowingTracker.address,
        ]);
        await lendingTracker.write.addTokenPool([token1.address, ownerAddress]);

        const mappingResult = await lendingTracker.read.tokenToPool([
          token1.address,
        ]);
        expect(mappingResult[1]).to.equal(ownerAddress);
      });
      it("Pool variables", async () => {
        const mappingResult = await lendingTracker.read.tokenToPool([
          token1.address,
        ]);

        const lendingPoolContract = await hre.viem.getContractAt(
          "Pool",
          mappingResult[0]
        );
        expect(
          (await lendingPoolContract.read.ownerContract()).toLowerCase()
        ).to.equal(lendingTracker.address.toLowerCase());

        expect((await lendingPoolContract.read.token()).toLowerCase()).to.equal(
          token1.address.toLowerCase()
        );
      });
      it("Pool interaction constrictions", async () => {
        const mappingResult = await lendingTracker.read.tokenToPool([
          token1.address,
        ]);
        const lendingPoolContract = await hre.viem.getContractAt(
          "Pool",
          mappingResult[0]
        );
        await expect(lendingPoolContract.write.lend([mintAmount])).to.be
          .rejected;
      });
      it("ChangePriceFeed", async () => {
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
      });
    });
    describe("lendToken", () => {
      it("Reverts if token not available", async () => {
        await lendingTracker.write.addBorrowingContract([
          borrowingTracker.address,
        ]);
        // await lendingTracker.write.addTokenPool([token1.address, ownerAddress]);
        await token1.write.approve([lendingTracker.address, parseEther("500")]);
        await lendingTracker.write.lendToken([
          token1.address,
          parseEther("500"),
        ]);

        await expect(
          lendingTracker.write.lendToken([ownerAddress, parseEther("10")])
        ).to.be.rejected;
      });
      it("Updates the balances", async () => {
        const mappingResult = await lendingTracker.read.tokenToPool([
          token1.address,
        ]);
        const lendingPoolContract = await hre.viem.getContractAt(
          "Pool",
          mappingResult[0]
        );
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
        const userTokens = await lendingTracker.read.userLendedTokens([
          ownerAddress,
          BigInt(0),
        ]);
        expect(userTokens.toLowerCase()).to.equal(token1.address.toLowerCase());
      });
      it("Updates reserve in the pool", async () => {
        const mappingResult = await lendingTracker.read.tokenToPool([
          token1.address,
        ]);
        const lendingPoolContract = await hre.viem.getContractAt(
          "Pool",
          mappingResult[0]
        );
        expect(await lendingPoolContract.read.reserve()).to.equal(
          parseEther("500")
        );
      });
      it("WithdrawLendedToken", async () => {
        const mappingResult = await lendingTracker.read.tokenToPool([
          token1.address,
        ]);
        const lendingPoolContract = await hre.viem.getContractAt(
          "Pool",
          mappingResult[0]
        );
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
      beforeEach(async () => {
        await lendingTracker.write.addBorrowingContract([
          borrowingTracker.address,
        ]);
      });
      it("Reverts if pool doesnt exist", async () => {
        await token1.write.approve([lendingTracker.address, mintAmount]);
        await expect(
          borrowingTracker.write.stakeCollateral([token1.address, mintAmount])
        ).to.be.rejected;
      });
      it("Reverts if the price is under 100", async () => {
        await expect(
          borrowingTracker.write.stakeCollateral([
            token1.address,
            parseEther("1"),
          ])
        ).to.be.rejected;
      });
      it("Stakes the collateral", async () => {
        const { priceAggregator, collateralAmount } = await loadFixture(
          deployLendingPool
        );

        await lendingTracker.write.addTokenPool([
          token1.address,
          priceAggregator.address,
        ]);
        await token1.write.mint([ownerAddress, parseEther("10000")]);
        await token1.write.approve([
          borrowingTracker.address,
          collateralAmount,
        ]);
        await borrowingTracker.write.stakeCollateral([
          token1.address,
          collateralAmount,
        ]);
        expect(
          await token1.read.balanceOf([borrowingTracker.address])
        ).to.equal(collateralAmount);
        expect(
          await borrowingTracker.read.collateral([ownerAddress, token1.address])
        ).to.equal(collateralAmount);
        const collateralTokens = await borrowingTracker.read.collateralTokens([
          ownerAddress,
          BigInt(BigInt(0)),
        ]);

        const expectedTokenAddress = token1.address.toLowerCase();
        const collateralTokenLowerCase = collateralTokens.toLowerCase();

        expect(collateralTokenLowerCase).to.equal(expectedTokenAddress);
      });
      it("unstakes the collateral", async () => {
        const { priceAggregator, collateralAmount } = await loadFixture(
          deployLendingPool
        );

        await lendingTracker.write.addTokenPool([
          token1.address,
          priceAggregator.address,
        ]);
        await token1.write.mint([ownerAddress, collateralAmount]);

        await token1.write.approve([
          borrowingTracker.address,
          collateralAmount,
        ]);
        await borrowingTracker.write.stakeCollateral([
          token1.address,
          collateralAmount,
        ]);
        await borrowingTracker.write.unstakeCollateral([
          token1.address,
          collateralAmount,
        ]);
        expect(
          await token1.read.balanceOf([borrowingTracker.address])
        ).to.equal(BigInt(0));
        expect(await token1.read.balanceOf([ownerAddress])).to.equal(
          collateralAmount + parseEther("1000")
        );
        await expect(
          borrowingTracker.read.collateralTokens([ownerAddress, BigInt(0)])
        ).to.be.rejected;
        expect(
          await borrowingTracker.read.collateral([ownerAddress, token1.address])
        ).to.equal(BigInt(0));
      });
    });
    describe("Borrow", async () => {
      it("Reverts it pool is not available", async () => {
        await expect(
          borrowingTracker.write.borrowToken([ownerAddress, parseEther("10")])
        ).to.be.rejected;
      });

      it("Updates mappings", async () => {
        const { priceAggregator, collateralAmount } = await loadFixture(
          deployLendingPool
        );
        await lendingTracker.write.addBorrowingContract([
          borrowingTracker.address,
        ]);
        await lendingTracker.write.addTokenPool([
          token1.address,
          priceAggregator.address,
        ]);
        await token1.write.mint([ownerAddress, collateralAmount]);
        await token1.write.approve([lendingTracker.address, collateralAmount]);
        await lendingTracker.write.lendToken([
          token1.address,
          parseEther("500"),
        ]);
        await token1.write.approve([lendingTracker.address, parseEther("500")]);
        await lendingTracker.write.lendToken([
          token1.address,
          parseEther("500"),
        ]);
        const mappingResult = await lendingTracker.read.tokenToPool([
          token1.address,
        ]);
        const lendingPoolContract = await hre.viem.getContractAt(
          "Pool",
          mappingResult[1]
        );
        await token1.write.approve([
          borrowingTracker.address,
          parseEther("30"),
        ]);
        await borrowingTracker.write.stakeCollateral([
          token1.address,
          parseEther("20"),
        ]);

        const borrowingId = await borrowingTracker.read.borrowingId([
          ownerAddress,
        ]);
        const deployerBalanceBefore = await token1.read.balanceOf([
          ownerAddress,
        ]);
        await borrowingTracker.write.borrowToken([
          token1.address,
          parseEther("10"),
        ]);
        const deployerBalanceAfter = await token1.read.balanceOf([
          ownerAddress,
        ]);
        expect(
          (
            await borrowingTracker.read.borrowedTokens([
              ownerAddress,
              BigInt(0),
            ])
          ).toLowerCase()
        ).to.equal(token1.address.toLowerCase());
        expect(
          await borrowingTracker.read.userBorrowReceipts([
            ownerAddress,
            token1.address,
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
        ).to.equal(parseEther("10"));
        expect(
          (
            await borrowingTracker.read.borrowReceiptData([
              ownerAddress,
              borrowingId,
            ])
          )[0].toLowerCase()
        ).to.equal(token1.address.toLowerCase());
        expect(
          (
            await borrowingTracker.read.borrowReceiptData([
              ownerAddress,
              borrowingId,
            ])
          )[3]
        ).to.equal(BigInt(0));
        expect(deployerBalanceBefore + parseEther("10")).to.equal(
          deployerBalanceAfter
        );
        expect(
          await token1.read.balanceOf([lendingPoolContract.address])
        ).to.equal(BigInt(0));
      });
      it("Reverts if treshold is too high", async () => {
        const { priceAggregator, collateralAmount } = await loadFixture(
          deployLendingPool
        );
        await lendingTracker.write.addBorrowingContract([
          borrowingTracker.address,
        ]);
        await lendingTracker.write.addTokenPool([
          token1.address,
          priceAggregator.address,
        ]);
        await token1.write.mint([ownerAddress, collateralAmount]);
        await token1.write.approve([lendingTracker.address, collateralAmount]);
        await lendingTracker.write.lendToken([
          token1.address,
          parseEther("500"),
        ]);
        await token1.write.approve([lendingTracker.address, parseEther("500")]);
        await lendingTracker.write.lendToken([
          token1.address,
          parseEther("500"),
        ]);

        await token1.write.approve([
          borrowingTracker.address,
          parseEther("100"),
        ]);
        await borrowingTracker.write.stakeCollateral([
          token1.address,
          parseEther("20"),
        ]);
        await expect(
          borrowingTracker.write.borrowToken([token1.address, parseEther("15")])
        ).to.be.rejected;
        await borrowingTracker.write.borrowToken([
          token1.address,
          parseEther("10"),
        ]);
        expect(
          await borrowingTracker.read.liquidityTreshold([
            ownerAddress,
            "0x0000000000000000000000000000000000000000",
            BigInt(0),
          ])
        ).to.equal(BigInt(50));
        expect(
          await borrowingTracker.read.liquidityTreshold([
            ownerAddress,
            token1.address,
            parseEther("10"),
          ])
        ).to.equal(BigInt(100));
        await expect(
          borrowingTracker.write.borrowToken([token1.address, parseEther("5")])
        ).to.be.rejected;
      });
      it("Accrued interest", async () => {
        await token1.write.approve([
          borrowingTracker.address,
          parseEther("100"),
        ]);
        await borrowingTracker.write.stakeCollateral([
          token1.address,
          parseEther("20"),
        ]);
        const borrowingId = await borrowingTracker.read.borrowingId([
          ownerAddress,
        ]);
        await borrowingTracker.write.borrowToken([
          token1.address,
          parseEther("10"),
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
        const { priceAggregator, collateralAmount } = await loadFixture(
          deployLendingPool
        );
        await lendingTracker.write.addBorrowingContract([
          borrowingTracker.address,
        ]);
        await lendingTracker.write.addTokenPool([
          token1.address,
          priceAggregator.address,
        ]);
        await token1.write.mint([ownerAddress, collateralAmount]);
        await token1.write.approve([lendingTracker.address, collateralAmount]);
        await lendingTracker.write.lendToken([
          token1.address,
          parseEther("500"),
        ]);
        await token1.write.approve([lendingTracker.address, parseEther("500")]);
        await lendingTracker.write.lendToken([
          token1.address,
          parseEther("500"),
        ]);

        await token1.write.approve([
          borrowingTracker.address,
          parseEther("100"),
        ]);
        await borrowingTracker.write.stakeCollateral([
          token1.address,
          parseEther("20"),
        ]);
        const borrowingId = await borrowingTracker.read.borrowingId([
          ownerAddress,
        ]);
        await borrowingTracker.write.borrowToken([
          token1.address,
          parseEther("10"),
        ]);
        const deployerBalanceBefore = await token1.read.balanceOf([
          ownerAddress,
        ]);
        await borrowingTracker.write.returnBorrowedToken([
          borrowingId,
          parseEther("10"),
        ]);
        const deployerBalanceAfter = await token1.read.balanceOf([
          ownerAddress,
        ]);
        await expect(
          borrowingTracker.read.borrowedTokens([ownerAddress, BigInt(0)])
        ).to.be.rejected;
        await expect(
          borrowingTracker.read.userBorrowReceipts([
            ownerAddress,
            token1.address,
            BigInt(0),
          ])
        ).to.be.rejected;
        expect(
          (
            await borrowingTracker.read.borrowReceiptData([
              ownerAddress,
              borrowingId,
            ])
          )[1]
        ).to.equal(parseEther("0"));
        expect(deployerBalanceBefore - parseEther("10")).to.equal(
          deployerBalanceAfter
        );
        expect(await token1.read.balanceOf([lendingPool.address])).to.equal(
          parseEther("0")
        );
      });
      it("Supports multiple Tokens", async () => {
        const { priceAggregator, collateralAmount } = await loadFixture(
          deployLendingPool
        );
        await lendingTracker.write.addBorrowingContract([
          borrowingTracker.address,
        ]);
        await lendingTracker.write.addTokenPool([
          token1.address,
          priceAggregator.address,
        ]);
        await token1.write.mint([ownerAddress, collateralAmount]);
        await token1.write.approve([lendingTracker.address, collateralAmount]);
        await lendingTracker.write.lendToken([
          token1.address,
          parseEther("500"),
        ]);
        await token1.write.approve([lendingTracker.address, parseEther("500")]);
        await lendingTracker.write.lendToken([
          token1.address,
          parseEther("500"),
        ]);

        await token1.write.approve([
          borrowingTracker.address,
          parseEther("100"),
        ]);
        await token1.write.approve([
          borrowingTracker.address,
          parseEther("100"),
        ]);
        await borrowingTracker.write.stakeCollateral([
          token1.address,
          parseEther("20"),
        ]);
        await borrowingTracker.write.borrowToken([
          token1.address,
          parseEther("5"),
        ]);
        await expect(
          borrowingTracker.write.borrowToken([token1.address, parseEther("11")])
        ).to.be.rejected;
      });
    });
  });
});
