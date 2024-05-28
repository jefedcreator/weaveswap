import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("Pool tracker test", () => {
  async function deployPoolTracker() {
    // Contracts are deployed using the first signer/account by default
    const publicClient = await hre.viem.getPublicClient();
    const collateralAmount = parseEther("10000");
    const collateralAmount2 = parseEther("500");
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const unlockTime = BigInt((await time.latest()) + ONE_YEAR_IN_SECS);
    const mintAmount = parseEther("1000");
    const approveAmount = parseEther("1000");
    const INITIAL_ANSWER = 5000000000;
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const [ownerAddress] = await owner.getAddresses();
    const zkBridge = "0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7";

    const token1 = await hre.viem.deployContract("TestToken1");
    const token2 = await hre.viem.deployContract("TestToken2");
    const token3 = await hre.viem.deployContract("TestToken3");
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
    await poolTracker.write.addRoutingAddress([
      token3.address,
      priceAggregator1.address,
    ]);

    const poolMetrics = await hre.viem.deployContract("PoolMetrics", [
      poolTracker.address,
      zkBridge,
      swapRouter.address,
    ]);
    await token1.write.mint([ownerAddress, parseEther("100000")]);
    await token2.write.mint([ownerAddress, parseEther("100000")]);
    await token3.write.mint([ownerAddress, parseEther("100000")]);
    await token1.write.approve([poolTracker.address, parseEther("100000")]);
    await token2.write.approve([poolTracker.address, parseEther("100000")]);
    await token3.write.approve([poolTracker.address, parseEther("100000")]);

    const pool2 = await poolTracker.write.createPool([
      token1.address,
      token3.address,
      mintAmount,
      mintAmount,
    ]);

    const pool3 = await poolTracker.write.createPool([
      token2.address,
      token3.address,
      mintAmount,
      mintAmount,
    ]);

    const pool1 = await poolTracker.write.createPool([
      token1.address,
      token2.address,
      mintAmount,
      mintAmount,
    ]);

    return {
      token1,
      token2,
      token3,
      owner,
      otherAccount,
      publicClient,
      lendingTracker,
      ownerAddress,
      collateralAmount,
      collateralAmount2,
      unlockTime,
      mintAmount,
      priceAggregator1,
      priceAggregator2,
      priceAggregator3,
      poolMetrics,
      poolTracker,
      approveAmount,
      swapRouter,
      INITIAL_ANSWER,
      pool1,
      pool2,
      pool3,
    };
  }
  describe("Pool tracker", async () => {
    describe("Creates a pool", () => {
      it("adds Pool to mapping", async () => {
        // await token1.write.approve(poolTracker.address, approveAmount);
        // await token2.write.approve(poolTracker.address, approveAmount);
        // await poolTracker.write.createPool(
        //   token1.address,
        //   token2.address,
        //   mintAmount,
        //   mintAmount
        // );
        // const array = await poolTracker.poolOwner(ownerAddress, 0);
        // expect(array).to.not.equal(undefined);
        // await expect(poolTracker.poolOwner(ownerAddress, 1)).to.be.rejected;
      });
      it("emits the event", async () => {
        const { token1, token2, publicClient, poolTracker, pool1 } =
          await loadFixture(deployPoolTracker);

        await publicClient.waitForTransactionReceipt({ hash: pool1 });
        const txReceipt = await poolTracker.getEvents.poolCreated();
        expect(txReceipt[0].args.assetOne?.toLowerCase()).to.equal(
          token1.address.toLowerCase()
        );
        expect(txReceipt[0].args.assetTwo?.toLowerCase()).to.equal(
          token2.address.toLowerCase()
        );
      });
      it("Enables liquidity Pool functionalities", async () => {
        const { token1, token2, publicClient, poolTracker, pool1 } =
          await loadFixture(deployPoolTracker);

        await publicClient.waitForTransactionReceipt({ hash: pool1 });
        const txReceipt = await poolTracker.getEvents.poolCreated();
        const poolAddress = txReceipt[0].args.pool;
        const poolContract = await hre.viem.getContractAt(
          "LiquidityPool",
          poolAddress!
        );
        expect(
          (await poolContract.read.assetOneAddress()).toLowerCase()
        ).to.equal(token1.address.toLowerCase());
        expect(
          (await poolContract.read.assetTwoAddress()).toLowerCase()
        ).to.equal(token2.address.toLowerCase());
      });
      it("Sets the ownerAddress as the owner of the liquidity pool", async () => {
        const { publicClient, poolTracker, pool1 } = await loadFixture(
          deployPoolTracker
        );

        await publicClient.waitForTransactionReceipt({ hash: pool1 });
        const txReceipt = await poolTracker.getEvents.poolCreated();
        const poolAddress = txReceipt[0].args.pool;
        const poolContract = await hre.viem.getContractAt(
          "LiquidityPool",
          poolAddress!
        );
        expect((await poolContract.read.owner()).toLowerCase()).to.equal(
          poolTracker.address.toLowerCase()
        );
      });
      it("Populates the mappings and arrays", async () => {
        const { publicClient, poolTracker, pool1, token1, token2, token3 } =
          await loadFixture(deployPoolTracker);

        await publicClient.waitForTransactionReceipt({ hash: pool1 });
        const txReceipt = await poolTracker.getEvents.poolCreated();
        const poolAddress = txReceipt[0].args.pool;

        expect(
          (await poolTracker.read.poolPairs([token1.address, 1n])).toLowerCase()
        ).to.equal(token2.address.toLowerCase());
        expect(
          (await poolTracker.read.poolPairs([token2.address, 1n])).toLowerCase()
        ).to.equal(token1.address.toLowerCase());
        expect(
          (await poolTracker.read.tokens([BigInt(0)])).toLowerCase()
        ).to.equal(token1.address.toLowerCase());
        expect(
          (await poolTracker.read.tokens([BigInt(2)])).toLowerCase()
        ).to.equal(token2.address.toLowerCase());
        expect(
          (
            await poolTracker.read.pairToPool([token1.address, token2.address])
          ).toLowerCase()
        ).to.equal(poolAddress?.toLowerCase());
        expect(
          await poolTracker.read.pairToPool([token2.address, token1.address])
        ).to.equal(poolAddress);
        expect((await poolTracker.read.tokenList())[0].toLowerCase()).to.equal(
          token1.address.toLowerCase()
        );
        expect((await poolTracker.read.tokenList())[2].toLowerCase()).to.equal(
          token2.address.toLowerCase()
        );
        expect((await poolTracker.read.tokenList()).length).to.equal(3);
        expect((await poolTracker.read.getPools()).length).to.equal(3);
        expect((await poolTracker.read.getPools())[0]).to.equal(
          await poolTracker.read.pairToPool([token1.address, token3.address])
        );
      });
      it("Revert if pool pair exists", async () => {
        const { token1, token2, mintAmount, poolTracker } = await loadFixture(
          deployPoolTracker
        );
        // await poolTracker.getEvents.poolCreated();
        await expect(
          poolTracker.write.createPool([
            token1.address,
            token2.address,
            mintAmount,
            mintAmount,
          ])
        ).to.be.rejected;
        await expect(
          poolTracker.write.createPool([
            token2.address,
            token1.address,
            mintAmount,
            mintAmount,
          ])
        ).to.be.rejected;
      });
    });
    describe("Routing", () => {
      it("Add a routing token", async () => {
        const {
          token1,
          token3,
          poolTracker,
          priceAggregator1,
          priceAggregator2,
        } = await loadFixture(deployPoolTracker);
        expect(
          (await poolTracker.read.routingAddresses([0n]))[0].toLowerCase()
        ).to.equal(token3.address.toLowerCase());
        expect(
          (await poolTracker.read.routingAddresses([0n]))[1].toLowerCase()
        ).to.equal(priceAggregator1.address.toLowerCase());
        await poolTracker.write.addRoutingAddress([
          token1.address,
          priceAggregator2.address,
        ]);
        expect(
          (await poolTracker.read.routingAddresses([1n]))[0].toLowerCase()
        ).to.equal(token1.address.toLowerCase());
        expect(
          (await poolTracker.read.routingAddresses([1n]))[1].toLowerCase()
        ).to.equal(priceAggregator2.address.toLowerCase());
      });
      it("Reverts if user not an owner", async () => {
        const { otherAccount, ownerAddress, poolTracker } = await loadFixture(
          deployPoolTracker
        );
        await expect(
          poolTracker.write.addRoutingAddress([ownerAddress, ownerAddress], {
            account: otherAccount.account,
          })
        ).to.be.rejected;
      });
    });
    describe("Swap", () => {
      it("Swaps directly between the test read.tokens", async () => {
        const { token1, token2, swapRouter } = await loadFixture(
          deployPoolTracker
        );
        await token1.write.approve([swapRouter.address, parseEther("10")]);
        const gas = await swapRouter.read.getSwapFee([
          token1.address,
          token2.address,
        ]);
        await swapRouter.write.swapAsset(
          [token1.address, token2.address, parseEther("10")],
          { value: gas }
        );
      });
      it("Checks mocks", async () => {
        const { priceAggregator1, INITIAL_ANSWER } = await loadFixture(
          deployPoolTracker
        );
        expect((await priceAggregator1.read.latestRoundData())[1]).to.equal(
          BigInt(INITIAL_ANSWER)
        );
      });
      it("Routes the best option", async () => {
        const {
          token1,
          token2,
          token3,
          poolTracker,
          swapRouter,
          priceAggregator1,
        } = await loadFixture(deployPoolTracker);
        await poolTracker.write.addRoutingAddress([
          token3.address,
          priceAggregator1.address,
        ]);
        expect(
          (await poolTracker.read.routingAddresses([0n]))[0].toLowerCase()
        ).to.equal(token3.address.toLowerCase());
        expect(
          (await poolTracker.read.routingAddresses([0n]))[1].toLowerCase()
        ).to.equal(priceAggregator1.address.toLowerCase());

        expect(
          (
            await swapRouter.read.tokenToRoute([token2.address, token1.address])
          ).toLowerCase()
        ).to.equal(token3.address.toLowerCase());
        expect(
          (
            await swapRouter.read.tokenToRoute([token1.address, token2.address])
          ).toLowerCase()
        ).to.equal(token3.address.toLowerCase());
        expect(
          await swapRouter.read.tokenToRoute([token3.address, token1.address])
        ).to.equal("0x0000000000000000000000000000000000000000");
        await expect(
          swapRouter.read.tokenToRoute([token1.address, token1.address])
        ).to.be.rejected;
      });
      it("Gets the routing price", async () => {
        const {
          token1,
          token2,
          token3,
          poolTracker,
          swapRouter,
          priceAggregator1,
        } = await loadFixture(deployPoolTracker);
        expect(
          (await poolTracker.read.routingAddresses([0n]))[0].toLowerCase()
        ).to.equal(token3.address.toLowerCase());
        expect(
          (await poolTracker.read.routingAddresses([0n]))[1].toLowerCase()
        ).to.equal(priceAggregator1.address.toLowerCase());
        //Direct swap
        const pool13 = await poolTracker.read.pairToPool([
          token1.address,
          token3.address,
        ]);
        const pool13Contract = await hre.viem.getContractAt(
          "LiquidityPool",
          pool13
        );
        expect(
          await swapRouter.read.getSwapAmount([
            token1.address,
            token3.address,
            parseEther("1"),
          ])
        ).to.equal(
          await pool13Contract.read.getSwapQuantity([
            token1.address,
            parseEther("1"),
          ])
        );
        const pool23 = await poolTracker.read.pairToPool([
          token2.address,
          token3.address,
        ]);
        const pool23Contract = await hre.viem.getContractAt(
          "LiquidityPool",
          pool23
        );
        expect(
          await swapRouter.read.getSwapAmount([
            token2.address,
            token3.address,
            parseEther("1"),
          ])
        ).to.equal(
          await pool23Contract.read.getSwapQuantity([
            token2.address,
            parseEther("1"),
          ])
        );
        expect(
          await swapRouter.read.getSwapAmount([
            token2.address,
            token3.address,
            parseEther("1"),
          ])
        ).to.equal(
          await pool23Contract.read.getSwapQuantity([
            token2.address,
            parseEther("1"),
          ])
        );
        // Routing through token3
        const price12 = await pool13Contract.read.getSwapQuantity([
          token1.address,
          parseEther("1"),
        ]);
        expect(
          await swapRouter.read.getSwapAmount([
            token1.address,
            token2.address,
            parseEther("1"),
          ])
        ).to.equal(price12);
      });
      it("Swaps indirectly between the test read.tokens", async () => {
        const {
          token1,
          token2,
          token3,
          ownerAddress,
          poolTracker,
          swapRouter,
          priceAggregator1,
        } = await loadFixture(deployPoolTracker);
        await poolTracker.write.addRoutingAddress([
          token3.address,
          priceAggregator1.address,
        ]);
        expect(
          (await poolTracker.read.routingAddresses([0n]))[0].toLowerCase()
        ).to.equal(token3.address.toLowerCase());
        expect(
          (await poolTracker.read.routingAddresses([0n]))[1].toLowerCase()
        ).to.equal(priceAggregator1.address.toLowerCase());
        //Indirect swap
        //Balances before the swap
        expect(await token1.read.balanceOf([ownerAddress])).to.equal(
          parseEther("99000")
        );
        expect(await token2.read.balanceOf([ownerAddress])).to.equal(
          parseEther("99000")
        );
        expect(await token3.read.balanceOf([ownerAddress])).to.equal(
          parseEther("99000")
        );
        const swap1Output = await swapRouter.read.getSwapAmount([
          token1.address,
          token3.address,
          parseEther("1"),
        ]);
        const swap2Output = await swapRouter.read.getSwapAmount([
          token1.address,
          token3.address,
          swap1Output,
        ]);
        await token1.write.approve([swapRouter.address, parseEther("1")]);
        await swapRouter.write.swapAsset(
          [token1.address, token2.address, parseEther("1")],
          { value: parseEther("1") }
        );

        //Balances after the swap
        expect(await token1.read.balanceOf([ownerAddress])).to.equal(
          parseEther("99000") - parseEther("1")
        );
        expect(await token2.read.balanceOf([ownerAddress])).to.equal(
          parseEther("99000") + swap1Output
        );
        expect(await token3.read.balanceOf([ownerAddress])).to.equal(
          parseEther("99000")
        );
        expect(await token1.read.balanceOf([token1.address])).to.equal(
          BigInt("0")
        );
        expect(await token2.read.balanceOf([token2.address])).to.equal(
          BigInt("0")
        );
        expect(await token3.read.balanceOf([token3.address])).to.equal(
          BigInt("0")
        );
        //Pool balances
        const pool13 = await poolTracker.read.pairToPool([
          token1.address,
          token3.address,
        ]);
        const pool23 = await poolTracker.read.pairToPool([
          token2.address,
          token3.address,
        ]);

        expect(await token1.read.balanceOf([pool13])).to.equal(
          parseEther("1000")
        );
        expect(await token3.read.balanceOf([pool13])).to.equal(
          parseEther("1000")
        );
        expect(await token3.read.balanceOf([pool23])).to.equal(
          parseEther("1000")
        );
        expect(await token2.read.balanceOf([pool23])).to.equal(
          parseEther("1000")
        );
        // Reverts if user wants to trade same token
        await expect(
          swapRouter.write.swapAsset([
            token1.address,
            token1.address,
            parseEther("1"),
          ])
        ).to.be.rejected;
        await expect(
          swapRouter.read.getSwapAmount([
            token1.address,
            token1.address,
            parseEther("1"),
          ])
        ).to.be.rejected;
      });
      it("Gets the swap correct swapFee", async () => {
        const { token1, token2, token3, swapRouter } = await loadFixture(
          deployPoolTracker
        );
        expect(
          await swapRouter.read.getSwapFee([token1.address, token2.address])
        ).to.equal(parseEther("0.001"));
        expect(
          await swapRouter.read.getSwapFee([token1.address, token3.address])
        ).to.equal(parseEther("0.001"));
        await token1.write.approve([swapRouter.address, parseEther("1")]);
        const fee = await swapRouter.read.getSwapFee([
          token1.address,
          token2.address,
        ]);
        const fee2 = await swapRouter.read.getSwapFee([
          token2.address,
          token3.address,
        ]);

        await swapRouter.write.swapAsset(
          [token1.address, token2.address, parseEther("1")],
          { value: fee }
        );
        await token1.write.approve([swapRouter.address, parseEther("1")]);
        expect(
          await swapRouter.write.swapAsset(
            [token1.address, token2.address, parseEther("1")],
            { value: fee }
          )
        );
      });
    });
    describe("Onchain Metrics", () => {
      it("Shows the USD value", async () => {
        const { token1, token2, token3, poolMetrics } = await loadFixture(
          deployPoolTracker
        );
        const value = await poolMetrics.read.usdValue([
          token1.address,
          parseEther("1"),
        ]);
        const value2 = await poolMetrics.read.usdValue([
          token2.address,
          parseEther("1"),
        ]);
        const value3 = await poolMetrics.read.usdValue([
          token3.address,
          parseEther("1"),
        ]);
        expect(value / parseEther("1")).to.equal(BigInt("5000000000"));
        expect(value2 / parseEther("1")).to.equal(BigInt("5000000000"));
        expect(value3 / parseEther("1")).to.equal(BigInt("5000000000"));
      });
      it("Shows the marketcap", async () => {
        const { token1, token3, poolMetrics } = await loadFixture(
          deployPoolTracker
        );
        const marketCap = await poolMetrics.read.marketCap([token1.address]);
        const valueUSD = await poolMetrics.read.usdValue([
          token1.address,
          parseEther("1"),
        ]);

        expect(marketCap).to.equal(valueUSD * BigInt("101000"));
        const pairMarketCap = await poolMetrics.read.pairMarketCap([
          token1.address,
          token3.address,
        ]);

        expect(pairMarketCap / 10n).to.equal(
          valueUSD * BigInt("10100") + valueUSD * BigInt("10100")
        );
        // console.log(await poolMetrics.pairTvl([token1.address, token3.address]));
        // console.log(await poolMetrics.tvl(token1.address));
        // console.log(await poolMetrics.tvlRatio(token1.address));
      });
    });
  });
});
