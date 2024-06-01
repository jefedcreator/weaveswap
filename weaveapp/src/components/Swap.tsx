"use client";
import { swap, swapAbi, tokenA, tokenB, tokenC } from "@/constants";
import { Button, Input, Select } from "@/primitives";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { FaClockRotateLeft } from "react-icons/fa6";
import { IoMdArrowDropdown, IoMdSettings } from "react-icons/io";
import { toast } from "sonner";
import { erc20Abi, formatEther, parseEther } from "viem";
import {
  useAccount,
  useEstimateFeesPerGas,
  useReadContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

const Swap = () => {
  //   const { usdRates } = useContext(USDRatesContext);
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
    value?: string;
  }>({
    name: "",
    address: "",
  });

  const [tokenOut, setTokenOut] = useState<{
    name: string;
    address: string;
    value?: string;
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

  const fee: bigint = useMemo(() => BigInt((swapFee as any) || 0), [swapFee]);

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

  const estimatedGas = useEstimateFeesPerGas();

  console.log("swap details:", tokenInBalance, tokenOutBalance);

  console.log("tokens:", tokenIn, tokenOut);

  console.log("input amount:", inputAmount);

  console.log("outputAmount", Number(outputAmount));

  console.log("swapFee", swapFee);

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

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
        value: parseEther(fee.toString()),
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
              <Button variant="primary" className="h-3.5 w-5">
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
                onChange={(e) => setInputAmount(e.target.value)}
              />
              <p className="text-sm font-semibold text-grey-1">($4602.43)</p>
            </span>
            <span className="flex items-center gap-1">
              <Image height={20} width={20} src="/ethlogo.svg" alt="ethlogo" />
              <p className="text-2xl">Ethereum</p>
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
              <p className="text-2xl">Weaves</p>
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
                  1 {tokenIn.name} on BNB =
                  {Number(outputAmount) / Number(inputAmount)} {tokenOut.name}{" "}
                  on BNB
                </p>
              </span>
              <span className="flex items-center justify-between">
                <p className="text-grey-1">Amount Recieved (Estimated)</p>
                <p>{`${Number(outputAmount)} ${tokenOut.name}`}</p>
              </span>
              <span className="flex items-center justify-between">
                <p className="text-grey-1">Gas Fee</p>
                <p>{`${formatEther(fee)} BNB`}</p>
              </span>
            </div>
          </div>
        )}
        <Button
          className="w-full font-bold"
          variant="primary"
          disabled={isLoading || isPending || isConfirming}
          onClick={handleSwap}
        >
          Swap
        </Button>
      </div>
    </main>
  );
};

export default Swap;
