"use client";
import { swap, swapAbi, tokenA, tokenB, tokenC } from "@/constants";
import { Button, Input, Select } from "@/primitives";
import { config } from "@/providers";
import { readContract } from "@wagmi/core";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaClockRotateLeft } from "react-icons/fa6";
import { IoMdArrowDropdown, IoMdSettings } from "react-icons/io";
import { toast } from "sonner";
import { erc20Abi, formatEther, parseEther, parseUnits } from "viem";
import {
  useAccount,
  useEstimateFeesPerGas,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

const Swap = () => {
  const { address } = useAccount();
  const [inputAmount, setInputAmount] = useState<number | string>(0);
  const [isMoreTokens0, setIsMoreTokens0] = useState(false);
  const [isMoreTokens1, setIsMoreTokens1] = useState(false);

  // const handleReset = () => {
  //   setOutputAmount(0);
  //   setInputAmount(0);
  //   setGasFee("0");
  // };

  //   const handleSwitchToken = () => {
  //     const token0Amount = inputAmount;
  //     const selectedToken0 = selectedInToken0;
  //     setInputAmount(outputAmount);
  //     setIsSelectedInToken0(selectedInToken1);
  //     setOutputAmount(token0Amount);
  //     setIsSelectedInToken1(selectedToken0);
  //   };

  const [tokenIn, setTokenIn] = useState<{
    name: string;
    address: string;
  }>({
    name: "",
    address: "",
  });

  const [tokenOut, setTokenOut] = useState<{
    name: string;
    address: string;
  }>({
    name: "",
    address: "",
  });

  const { data: outputAmount, isLoading } = useReadContract({
    abi: swapAbi,
    address: swap,
    functionName: "getSwapAmount",
    account: address,
    args: [
      tokenIn.address as `0x${string}`,
      tokenOut.address as `0x${string}`,
      parseEther(inputAmount.toString()),
    ],
  });

  const { data: swapFee, isLoading: isSwapFeeLoading } = useReadContract({
    abi: swapAbi,
    address: swap,
    functionName: "getSwapFee",
    account: address,
    args: [tokenIn.address as `0x${string}`, tokenOut.address as `0x${string}`],
  });

  const { data: tokenInBalance, refetch: refetchTokenIn } = useReadContract({
    address: tokenIn.address as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });

  const { data: tokenOutBalance, refetch: refetchTokenOut } = useReadContract({
    address: tokenOut.address as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });

  const {
    data: hash,
    isPending,
    writeContract,
    writeContractAsync,
  } = useWriteContract();

  const {
    data: firstTokenApproveHash,
    isPending: isFirstTokenPending,
    writeContractAsync: writeFirstTokenApprove,
  } = useWriteContract();

  const {
    data: secondTokenApproveHash,
    isPending: isSecondTokenPending,
    writeContractAsync: writeSecondTokenApprove,
  } = useWriteContract();

  const getPoolAllowance = async ({
    token,
    pool,
  }: {
    token: `0x${string}`;
    pool: `0x${string}`;
  }) => {
    if (!address) return;
    const result = await readContract(config, {
      abi: erc20Abi,
      address: token,
      functionName: "allowance",
      args: [address, pool],
    });
    return result;
  };

  const estimatedGas = useEstimateFeesPerGas();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const { isLoading: isFirstTokenApproving, isSuccess: isFirstTokenSuccess } =
    useWaitForTransactionReceipt({
      hash: firstTokenApproveHash,
    });

  const { isLoading: isSecondTokenApproving, isSuccess: isSecondTokenSuccess } =
    useWaitForTransactionReceipt({
      hash: secondTokenApproveHash,
    });

  const handleFirstApprove = async () => {
    try {
      await writeFirstTokenApprove({
        address: tokenIn.address as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [swap, parseUnits("100", 10)],
      });
      toast.success("First asset approved succesfully");
    } catch (error) {
      console.error(error);
      toast.error("An error occured");
    }
  };

  const handleSecondApprove = async () => {
    try {
      await writeSecondTokenApprove({
        address: tokenOut.address as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [swap, parseUnits("100", 10)],
      });
      toast.success("Second asset approved succesfully");
    } catch (error) {
      console.error(error);
      toast.error("An error occured");
    }
  };

  const handleClick = async () => {
    try {
      const allowance1Promise = getPoolAllowance({
        token: tokenIn.address as `0x${string}`,
        pool: swap,
      });
      const allowance2Promise = getPoolAllowance({
        token: tokenOut.address as `0x${string}`,
        pool: swap,
      });

      const [allowance1, allowance2] = await Promise.all([
        allowance1Promise,
        allowance2Promise,
      ]);

      const allowance1Formatted = parseFloat(
        formatEther(BigInt(allowance1 || 0)),
      );
      const allowance2Formatted = parseFloat(
        formatEther(BigInt(allowance2 || 0)),
      );

      const tokenOneValue = parseFloat(inputAmount.toString() || "0");
      const tokenTwoValue = parseFloat(inputAmount?.toString() || "0");

      if (allowance1Formatted < tokenOneValue) {
        handleFirstApprove();
      } else if (allowance2Formatted < tokenTwoValue) {
        handleSecondApprove();
      } else {
        handleSwap();
      }
    } catch (error) {
      console.error("Error handling click:", error);
    }
  };

  const handleSwap = async () => {
    try {
      const result = await writeContractAsync({
        abi: swapAbi,
        address: swap,
        functionName: "swapAsset",
        account: address,
        args: [
          tokenIn.address as `0x${string}`,
          tokenOut.address as `0x${string}`,
          parseEther(inputAmount?.toString() || "0"),
        ],
        value: BigInt(swapFee?.toString() || "0"),
      });
      if (result) {
        toast.success("Swap successful");
      }
    } catch (error) {
      console.error("Error during swap:", error);
      toast.error("An error occurred during the swap");
    }
  };

  useEffect(() => {
    // if (tokenIn && tokenOut && inputAmount && outputAmount) {
    // writeContract({
    //   address: tokenOut.address as `0x${string}`,
    //   abi: erc20Abi,
    //   functionName: "approve",
    //   args: [swap as `0x${string}`, parseUnits("100", 10)],
    // });
    // writeContract({
    //   address: tokenIn.address as `0x${string}`,
    //   abi: erc20Abi,
    //   functionName: "approve",
    //   args: [swap as `0x${string}`, parseUnits("100", 10)],
    // });
    // }
  }, [tokenIn, tokenOut, inputAmount, outputAmount]);

  useEffect(() => {
    if (isFirstTokenSuccess) {
      handleSecondApprove();
    }
  }, [isFirstTokenSuccess]);

  useEffect(() => {
    if (isSecondTokenSuccess) {
      handleSwap();
    }
  }, [isSecondTokenSuccess]);

  useEffect(() => {
    if (isConfirmed) {
      refetchTokenIn();
      refetchTokenOut();
      toast.success("Swap succesful");
    }
  }, [isConfirmed]);

  return (
    <main className="flex items-center justify-center">
      <div className="flex max-h-[58%] w-[33%] flex-col gap-10 rounded-[10px] border border-[0.5] border-grey-1 p-10 font-khand text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Swap</h2>
          <span className="flex items-center gap-2">
            <IoMdSettings />
            <FaClockRotateLeft />
          </span>
        </div>
        <div className="rounded-md bg-grey-1/30 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <p className="text-sm font-semibold text-grey-1">From</p>
              {/* <span className="flex items-center gap-1">
                <Image
                  height={20}
                  width={20}
                  src="/ethlogo.svg"
                  alt="ethlogo"
                />
                <p>ETH</p>
                <IoMdArrowDropdown />
              </span> */}
              <Select
                inputId="token1"
                option={[
                  {
                    label: "Token A",
                    value: tokenA,
                    icon: {
                      1: "blylogo",
                    },
                  },
                  {
                    label: "Token B",
                    value: tokenB,
                    icon: {
                      1: "clylogo",
                    },
                  },
                  {
                    label: "Token C",
                    value: tokenC,
                    icon: {
                      1: "dotlogo",
                    },
                  },
                ]}
                onChange={(option) => {
                  console.log(option?.value);
                  setTokenIn({
                    name: option?.label!,
                    address: option?.value!,
                  });
                }}
              />
            </span>
            <span className="flex items-center gap-1">
              <p className="text-sm font-semibold text-grey-1">Wallet Bal</p>
              <p>{formatEther(tokenInBalance ?? BigInt(0))}</p>
              <Button
                variant="primary"
                className="h-3.5 w-5"
                onClick={() =>
                  tokenInBalance && setInputAmount(tokenInBalance?.toString())
                }
              >
                Max
              </Button>
            </span>
          </div>
          <hr />
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Input
                id="valueIn"
                type="number"
                defaultValue={0}
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
              />
              <p className="text-sm font-semibold text-grey-1">($4602.43)</p>
            </span>
            <span className="flex items-center gap-1">
              <Image
                height={20}
                width={20}
                src="/weavelogo.svg"
                alt="weavelogo"
              />
              <p className="text-2xl">{tokenIn.name}</p>
              <IoMdArrowDropdown />
            </span>
          </div>
        </div>
        <div className="rounded-md bg-grey-1/30 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <p className="text-sm font-semibold text-grey-1">To</p>
              {/* <span className="flex items-center gap-1">
                <Image
                  height={20}
                  width={20}
                  src="/weavelogo.svg"
                  alt="weavelogo"
                />
                <p>WAS</p>
                <IoMdArrowDropdown />
              </span> */}
              <Select
                inputId="token1"
                option={[
                  {
                    label: "Token A",
                    value: tokenA,
                    icon: {
                      1: "blylogo",
                    },
                  },
                  {
                    label: "Token B",
                    value: tokenB,
                    icon: {
                      1: "clylogo",
                    },
                  },
                  {
                    label: "Token C",
                    value: tokenC,
                    icon: {
                      1: "dotlogo",
                    },
                  },
                ]}
                onChange={(option) => {
                  console.log(option?.value);
                  setTokenOut({
                    name: option?.label!,
                    address: option?.value!,
                  });
                }}
              />
            </span>
            <span className="flex items-center gap-1">
              <p className="text-sm font-semibold text-grey-1">Wallet Bal</p>
              <p>{formatEther(tokenOutBalance ?? BigInt(0))}</p>
            </span>
          </div>
          <hr />
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <p>{Number(outputAmount) || 0}</p>
              <p className="text-sm font-semibold text-grey-1">($4602.43)</p>
            </span>
            <span className="flex items-center gap-1">
              <Image
                height={20}
                width={20}
                src="/weavelogo.svg"
                alt="weavelogo"
              />
              <p className="text-2xl">{tokenOut.name}</p>
              <IoMdArrowDropdown />
            </span>
          </div>
        </div>
        {tokenIn.address && tokenOut.address && inputAmount && (
          <div className="flex flex-col gap-2">
            <p>Summary</p>
            <div>
              <span className="flex items-center justify-between">
                <p className="text-grey-1">Exchange rate</p>
                <p>
                  1 {tokenIn.name} on ETH =
                  {Number(outputAmount) / Number(inputAmount)} {tokenOut.name}{" "}
                  on ETH
                </p>
              </span>
              <span className="flex items-center justify-between">
                <p className="text-grey-1">Amount Recieved (Estimated)</p>
                <p>{`${Number(outputAmount)} ${tokenOut.name}`}</p>
              </span>
              <span className="flex items-center justify-between">
                <p className="text-grey-1">Gas Fee</p>
                <p>{`${formatEther(swapFee || 0n)} ETH`}</p>
              </span>
            </div>
          </div>
        )}
        <Button
          className="w-full font-bold"
          variant="primary"
          disabled={
            isLoading ||
            isPending ||
            isConfirming ||
            !address ||
            isFirstTokenPending ||
            isSecondTokenPending ||
            isFirstTokenApproving ||
            isSecondTokenApproving ||
            !tokenIn.address
          }
          onClick={handleClick}
        >
          {isSecondTokenApproving
            ? "Aproving Second Asset"
            : isFirstTokenApproving
              ? "Aproving First Asset"
              : isPending
                ? "Confirm Swap..."
                : isSecondTokenPending
                  ? "Confirm Second Asset Approval..."
                  : isFirstTokenPending
                    ? "Confirm First Asset Approval..."
                    : "Swap"}
        </Button>
      </div>
    </main>
  );
};

export default Swap;
