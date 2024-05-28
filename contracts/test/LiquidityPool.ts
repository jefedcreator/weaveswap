import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("LiquidityPoolTest", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployLiquidityPool() {
    const publicClient = await hre.viem.getPublicClient();
    const collateralAmount = parseEther("100000");
    const collateralAmount2 = parseEther("500");
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const mintAmount = parseEther("1000");
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const [ownerAddress] = await owner.getAddresses();

    const token1 = await hre.viem.deployContract("TestToken1");
    const token2 = await hre.viem.deployContract("TestToken2");
    const liquidityPool = await hre.viem.deployContract("LiquidityPool", [
      token1.address,
      token2.address,
    ]);

    await token1.write.mint([ownerAddress, collateralAmount]);
    await token2.write.mint([ownerAddress, collateralAmount]);
    await token1.write.approve([liquidityPool.address, collateralAmount]);
    await token2.write.approve([liquidityPool.address, collateralAmount]);
    await liquidityPool.write.addInitialLiquidity([mintAmount, mintAmount]);
    // const unlockTime = BigInt((await time.latest()) + ONE_YEAR_IN_SECS);

    return {
      token1,
      token2,
      owner,
      otherAccount,
      publicClient,
      liquidityPool,
      ownerAddress,
      collateralAmount,
      collateralAmount2,
      // unlockTime,
      ONE_YEAR_IN_SECS,
      mintAmount,
    };
  }
  describe("Deploys the new pool contracts", () => {
    it("Mints the tokens", async () => {
      const { token1, token2, ownerAddress } = await loadFixture(
        deployLiquidityPool
      );
      const deployerBalanceToken1 = await token1.read.balanceOf([ownerAddress]);

      const deployerBalanceToken2 = await token2.read.balanceOf([ownerAddress]);
      expect(deployerBalanceToken1).to.equal(parseEther("100000"));
      expect(deployerBalanceToken2).to.equal(parseEther("100000"));
    });

    it("Checks the initial liquidity", async () => {
      const { token1, liquidityPool, ownerAddress, mintAmount } =
        await loadFixture(deployLiquidityPool);
      //ADDS THE LIQUIDITY
      expect(
        await liquidityPool.read.getAssetBalace([token1.address])
      ).to.equal(mintAmount);
      const liquidity = await liquidityPool.read.liquidity();
      expect(
        await liquidityPool.read.getLpTokenQuantity([ownerAddress])
      ).to.equal(liquidity);
      expect(
        (await liquidityPool.read.assetOnePrice()) / parseEther("1")
      ).to.equal(BigInt(1));
      expect(
        (await liquidityPool.read.assetTwoPrice()) / parseEther("1")
      ).to.equal(BigInt(1));
      expect(await liquidityPool.read.getAssetOne()).to.equal(mintAmount);
      expect(await liquidityPool.read.getAssetTwo()).to.equal(mintAmount);
    });
    it("Time checker initial liquidity", async () => {
      const { liquidityPool, ownerAddress } = await loadFixture(
        deployLiquidityPool
      );
      await expect(liquidityPool.write.removeLiquidity([BigInt(1000)])).to.be
        .rejected;
      const initialLiquidityProvidedTime =
        await liquidityPool.read.initialLiquidityProvidedTime([ownerAddress]);
      expect(await liquidityPool.read.isTimeInitialLiquidity()).to.equal(false);
      const unlockTime = BigInt((await time.latest()) + 31557600);
      await time.increaseTo(unlockTime);
      expect(await liquidityPool.read.isTimeInitialLiquidity()).to.equal(true);
    });
    it("Add additional liquidity", async () => {
      const { token1, token2, liquidityPool, ownerAddress, mintAmount } =
        await loadFixture(deployLiquidityPool);
      await token1.write.mint([ownerAddress, mintAmount]);
      await token2.write.mint([ownerAddress, mintAmount]);
      const assetBalance1Before = await token1.read.balanceOf([ownerAddress]);
      const assetBalance2Before = await token2.read.balanceOf([ownerAddress]);
      await liquidityPool.write.addLiquidity([
        token1.address,
        token2.address,
        mintAmount,
      ]);
      const liquidity = await liquidityPool.read.liquidity();
      const assetBalance1After = await token1.read.balanceOf([ownerAddress]);
      const assetBalance2After = await token2.read.balanceOf([ownerAddress]);
      expect(assetBalance1After).to.equal(assetBalance1Before - mintAmount);
      expect(assetBalance2After).to.equal(assetBalance2Before - mintAmount);
      expect(
        await liquidityPool.read.getLpTokenQuantity([ownerAddress])
      ).to.equal(liquidity);
      expect(await liquidityPool.read.getAssetOne()).to.equal(
        parseEther("2000")
      );
      expect(await liquidityPool.read.getAssetTwo()).to.equal(
        parseEther("2000")
      );
      expect(
        (await liquidityPool.read.assetOnePrice()) / parseEther("1")
      ).to.equal(BigInt("1"));
      expect(
        (await liquidityPool.read.assetTwoPrice()) / parseEther("1")
      ).to.equal(BigInt("1"));
    });
    it("Removes the liquidity", async () => {
      const { token1, token2, liquidityPool, mintAmount, ONE_YEAR_IN_SECS } =
        await loadFixture(deployLiquidityPool);
      await liquidityPool.write.addLiquidity([
        token1.address,
        token2.address,
        mintAmount,
      ]);
      await expect(liquidityPool.write.removeLiquidity([BigInt(1000)])).to.be
        .rejected; //Can't remove the initial liquidity
      await expect(liquidityPool.write.removeLiquidity([BigInt(1000)])).to.be
        .rejected; //Can't remove the initial liquidity
      await liquidityPool.write.removeLiquidity([BigInt(50)]);
      expect(await liquidityPool.read.getAssetOne()).to.equal(mintAmount);
      expect(await liquidityPool.read.getAssetTwo()).to.equal(mintAmount);
      const unlockTime = BigInt((await time.latest()) + ONE_YEAR_IN_SECS);
      await time.increaseTo(unlockTime);
      await liquidityPool.write.removeLiquidity([BigInt(100)]);
      expect(await liquidityPool.read.getAssetOne()).to.equal(BigInt(0));
      expect(await liquidityPool.read.getAssetTwo()).to.equal(BigInt(0));
    });
    it("Selling and buying", async () => {
      const { liquidityPool } = await loadFixture(deployLiquidityPool);
      const gas = parseEther("10");
      await expect(liquidityPool.write.sellAssetTwo([parseEther("1000")])).to.be
        .rejected;
      await expect(liquidityPool.write.sellAssetOne([parseEther("1000")])).to.be
        .rejected;
      await liquidityPool.write.sellAssetTwo([parseEther("100")], {
        value: gas,
      });
      const assetTwoPrice = (
        await liquidityPool.read.assetTwoPrice()
      ).toString();
      const assetOnePrice = (
        await liquidityPool.read.assetOnePrice()
      ).toString();
      const getAssetOne = (await liquidityPool.read.getAssetOne()).toString();
      const getAssetTwo = (await liquidityPool.read.getAssetTwo()).toString();
      expect(
        parseInt(assetTwoPrice) / parseInt(parseEther("1").toString())
      ).to.equal(parseInt(getAssetOne) / parseInt(getAssetTwo));

      await liquidityPool.write.sellAssetOne([parseEther("300")], {
        value: gas,
      });

      expect(
        parseInt(assetOnePrice) / parseInt(parseEther("1").toString())
      ).to.equal(parseInt(getAssetTwo) / parseInt(getAssetOne));
    });
  });
});
