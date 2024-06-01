"use client";
import { DataTable, Header } from "@/components";
import {
  Tokens,
  pool,
  poolAbi,
  poolMetrics,
  poolMetricsAbi,
  poolTracker,
  poolTrackerAbi,
  tokenA,
  tokenB,
  tokenC,
} from "@/constants";
import { liquidityPoolAbi } from "@/constants/abis";
import { Button, Input, Modal } from "@/primitives";
import { formatNumber } from "@/utils";
import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { erc20Abi, formatEther, parseEther, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

type Pool = {
  id: string;
  Pool: string;
  Composition: string;
  "7d Volume": string;
  "24h Volume": string;
  Fee: string;
  "Total Market Cap": string;
  ROI: string;
  Tokens: string;
  Action: string;
  poolAddress: `0x${string}`;
};

const Page = () => {
  const { address } = useAccount();

  const { data: getPools, refetch: refetchPools } = useReadContract({
    abi: poolTrackerAbi,
    address: poolTracker,
    functionName: "getPools",
  });

  const {
    data: tokenAAllowance,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: tokenA,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as `0x${string}`, pool],
  });

  const {
    data: tokenBAllowance,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: tokenB,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as `0x${string}`, pool],
  });

  const {
    data: tokenCAllowance,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: tokenC,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as `0x${string}`, pool],
  });

  const {
    data: poolOneAssetOneAddress,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: getPools?.[0],
    abi: liquidityPoolAbi,
    functionName: "assetOneAddress",
  });

  const {
    data: poolTwoAssetOneAddress,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: getPools?.[1],
    abi: liquidityPoolAbi,
    functionName: "assetOneAddress",
  });

  const {
    data: poolThreeAssetOneAddress,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: getPools?.[2],
    abi: liquidityPoolAbi,
    functionName: "assetOneAddress",
  });

  const {
    data: poolOneAssetTwoAddress,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: getPools?.[0],
    abi: liquidityPoolAbi,
    functionName: "assetTwoAddress",
  });

  const {
    data: poolTwoAssetTwoAddress,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: getPools?.[1],
    abi: liquidityPoolAbi,
    functionName: "assetTwoAddress",
  });

  const {
    data: poolThreeAssetTwoAddress,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: getPools?.[2],
    abi: liquidityPoolAbi,
    functionName: "assetTwoAddress",
  });

  const {
    data: poolOneInitialLiquidity,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: getPools?.[0],
    abi: liquidityPoolAbi,
    functionName: "initialLiquidity",
  });

  const {
    data: poolTwoInitialLiquidity,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: getPools?.[1],
    abi: liquidityPoolAbi,
    functionName: "initialLiquidity",
  });

  const {
    data: poolThreeInitialLiquidity,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: getPools?.[2],
    abi: liquidityPoolAbi,
    functionName: "initialLiquidity",
  });

  const {
    data: poolOneLiquidity,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: getPools?.[0],
    abi: liquidityPoolAbi,
    functionName: "liquidity",
  });

  const {
    data: poolTwoLiquidity,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: getPools?.[1],
    abi: liquidityPoolAbi,
    functionName: "liquidity",
  });

  const {
    data: poolThreeLiquidity,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: getPools?.[2],
    abi: liquidityPoolAbi,
    functionName: "liquidity",
  });

  const {
    data: poolOneFee,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: getPools?.[0],
    abi: liquidityPoolAbi,
    functionName: "swapFee",
  });

  const {
    data: poolTwoFee,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: getPools?.[1],
    abi: liquidityPoolAbi,
    functionName: "swapFee",
  });
  console.log("getPools?.[1]", getPools?.[1]);

  const {
    data: poolThreeFee,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: getPools?.[2],
    abi: liquidityPoolAbi,
    functionName: "swapFee",
  });

  const {
    data: poolOneYield,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: getPools?.[0],
    abi: liquidityPoolAbi,
    functionName: "yield",
  });

  const {
    data: poolOneassetOneName,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: poolOneAssetOneAddress,
    abi: erc20Abi,
    functionName: "name",
  });

  const {
    data: poolOneAssetTwoName,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: poolOneAssetTwoAddress,
    abi: erc20Abi,
    functionName: "name",
  });

  const {
    data: poolTwoAssetOneName,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: poolTwoAssetOneAddress,
    abi: erc20Abi,
    functionName: "name",
  });

  const {
    data: poolTwoAssetTwoName,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: poolTwoAssetTwoAddress,
    abi: erc20Abi,
    functionName: "name",
  });

  const {
    data: poolThreeAssetOneName,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: poolThreeAssetOneAddress,
    abi: erc20Abi,
    functionName: "name",
  });

  const {
    data: poolThreeAssetTwoName,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: poolThreeAssetTwoAddress,
    abi: erc20Abi,
    functionName: "name",
  });

  const {
    data: poolOneMarketCap,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: poolMetrics,
    abi: poolMetricsAbi,
    functionName: "pairMarketCap",
    args: [
      poolOneAssetOneAddress as `0x${string}`,
      poolOneAssetTwoAddress as `0x${string}`,
    ],
  });

  const {
    data: poolTwoMarketCap,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: poolMetrics,
    abi: poolMetricsAbi,
    functionName: "pairMarketCap",
    args: [
      poolTwoAssetOneAddress as `0x${string}`,
      poolTwoAssetTwoAddress as `0x${string}`,
    ],
  });

  const {
    data: poolThreeMarketCap,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: poolMetrics,
    abi: poolMetricsAbi,
    functionName: "pairMarketCap",
    args: [
      poolThreeAssetOneAddress as `0x${string}`,
      poolThreeAssetTwoAddress as `0x${string}`,
    ],
  });

  const getPoolsA =
    getPools?.filter((pool): pool is `0x${string}` => pool !== null) || [];

  type Pools = (typeof getPoolsA)[number];

  const getPoolDetails = (pool: Pools): Pool | null => {
    let tokenAllowances = {
      [getPoolsA[0] as string]: {
        id: "1",
        Pool: `${poolOneassetOneName}/${poolOneAssetTwoName}`,
        Composition: "",
        "7d Volume": formatEther(BigInt(poolOneLiquidity || 0n)),
        "24h Volume": formatEther(BigInt(poolOneInitialLiquidity || 0n)),
        Fee: `${formatEther(BigInt(poolOneFee || 0n))} ETH`,
        "Total Market Cap": `$${formatNumber(
          formatEther(BigInt(poolOneMarketCap || 0n)),
        )}`,
        ROI: "13.7%",
        Tokens: `${poolOneAssetOneAddress}/${poolOneAssetTwoAddress}`,
        poolAddress: pool,
        Action: "Add Supply",
      },
      [getPoolsA[1] as string]: {
        id: "2",
        Pool: `${poolTwoAssetOneName}/${poolTwoAssetTwoName}`,
        Composition: "",
        "7d Volume": formatEther(BigInt(poolTwoLiquidity || 0n)),
        "24h Volume": formatEther(BigInt(poolTwoInitialLiquidity || 0n)),
        Fee: `${formatEther(BigInt(poolTwoFee || 0n))} ETH`,
        "Total Market Cap": `$${formatNumber(
          formatEther(BigInt(poolTwoMarketCap || 0n)),
        )}`,
        ROI: "13.7%",
        Tokens: `${poolTwoAssetOneAddress}/${poolTwoAssetTwoAddress}`,
        poolAddress: pool,
        Action: "Add Supply",
      },
      [getPoolsA[2] as string]: {
        id: "3",
        Pool: `${poolThreeAssetOneName}/${poolThreeAssetTwoName}`,
        Composition: "",
        "7d Volume": formatEther(BigInt(poolThreeLiquidity || 0n)),
        "24h Volume": formatEther(BigInt(poolThreeInitialLiquidity || 0n)),
        Fee: `${formatEther(BigInt(poolThreeFee || 0n))} ETH`,
        "Total Market Cap": `$${formatNumber(
          formatEther(BigInt(poolThreeMarketCap || 0n)),
        )}`,
        ROI: "13.7%",
        Tokens: `${poolThreeAssetOneAddress}/${poolThreeAssetTwoAddress}`,
        poolAddress: pool,
        Action: "Add Supply",
      },
    };

    return tokenAllowances[pool] || null;
  };

  const getTokenAllowance = (token: Tokens) => {
    let tokenAllowances = {
      [tokenA]: formatEther(BigInt(tokenAAllowance || 0)),
      [tokenB]: formatEther(BigInt(tokenBAllowance || 0)),
      [tokenC]: formatEther(BigInt(tokenCAllowance || 0)),
    };

    return tokenAllowances[token] || "0";
  };

  const pools: Pool[] = useMemo(() => {
    if (!getPools) return [];
    return getPools
      .map((pool) => getPoolDetails(pool) || undefined)
      .filter((pool): pool is Pool => pool !== undefined);
  }, [
    getPools,
    poolThreeAssetTwoName,
    poolThreeAssetOneName,
    poolTwoAssetOneName,
    poolOneAssetTwoName,
  ]);

  const columns: ColumnDef<Pool>[] = [
    {
      accessorKey: "Pool",
      // header: "Pool",
      header: () => <div className="">Pool</div>,
    },
    {
      accessorKey: "Composition",
      header: "Composition",
      cell: ({ row }) => {
        const pool: string = row.getValue("Pool");
        const [token1, token2] = pool.split("/");
        const Token1Icon = ({ token1 }: { token1: string | undefined }) => {
          switch (token1) {
            case "TestToken1":
              return (
                <Image
                  width="20"
                  height="20"
                  src="/polygonlogo.svg"
                  alt="polygonlogo"
                />
              );
            case "TestToken2":
              return (
                <Image
                  width="20"
                  height="20"
                  src="/cnbclogo.svg"
                  alt="cnbclogo"
                />
              );
            case "TestToken3":
              return (
                <Image
                  width="20"
                  height="20"
                  src="/clylogo.svg"
                  alt="clylogo"
                />
              );
            // case "BLY":
            //   return (
            //     <Image
            //       width="20"
            //       height="20"
            //       src="/blylogo.svg"
            //       alt="blylogo"
            //     />
            //   );
            // case "DOT":
            //   return (
            //     <Image
            //       width="20"
            //       height="20"
            //       src="/dotlogo.svg"
            //       alt="dotlogo"
            //     />
            //   );
            // case "ENG":
            //   return (
            //     <Image
            //       width="20"
            //       height="20"
            //       src="/englogo.svg"
            //       alt="englogo"
            //     />
            //   );
            default:
              return null;
          }
        };

        const Token2Icon = ({ token2 }: { token2: string | undefined }) => {
          switch (token2) {
            case "TestToken1":
              return (
                <Image
                  width="20"
                  height="20"
                  src="/polygonlogo.svg"
                  alt="polygonlogo"
                />
              );
            case "TestToken2":
              return (
                <Image
                  width="20"
                  height="20"
                  src="/cnbclogo.svg"
                  alt="cnbclogo"
                />
              );
            case "TestToken3":
              return (
                <Image
                  width="20"
                  height="20"
                  src="/clylogo.svg"
                  alt="clylogo"
                />
              );
            default:
              return null;
          }
        };
        return (
          <div className="flex items-center gap-1 font-medium">
            <Token1Icon token1={token1} />
            <Token2Icon token2={token2} />
          </div>
        );
      },
    },
    {
      accessorKey: "7d Volume",
      header: "7d Volume",
    },
    {
      accessorKey: "24h Volume",
      header: "24h Volume",
    },
    {
      accessorKey: "Fee",
      header: "Fee",
    },
    {
      accessorKey: "Total Market Cap",
      header: "Total Market Cap",
    },
    {
      accessorKey: "ROI",
      header: "ROI",
    },
    {
      accessorKey: "Action",
      header: "Action",
      cell: ({ row }) => {
        // console.log("modal token1", asset);
        const poolTokens: string = row.getValue("Pool");
        const tokenNames = poolTokens.split("/");
        const tokens =
          pools.find(({ Pool }) => Pool == poolTokens)?.Tokens.split("/") || [];
        const poolAddress = pools.find(
          ({ Pool }) => Pool == poolTokens,
        )?.poolAddress!;

        console.log("poolAddress", poolAddress);

        const [tokenOne, setTokenOne] = useState<{
          name: string;
          address: string;
          value?: string;
        }>({
          name: tokenNames[0] || "",
          address: tokens?.[0] || "",
          value: "0",
        });

        const [tokenTwo, setTokenTwo] = useState<{
          name: string;
          address: string;
          value?: string;
        }>({
          name: tokenNames[1] || "",
          address: tokens?.[1] || "",
          value: "0",
        });

        const { data: tokenOneBalance, refetch: refetchTokenIn } =
          useReadContract({
            address: tokenOne.address as `0x${string}`,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address as `0x${string}`],
          });

        const { data: tokenTwoBalance, refetch: refetchTokenOut } =
          useReadContract({
            address: tokenTwo.address as `0x${string}`,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address as `0x${string}`],
          });

        const { data: tokenOneValue, refetch: refetchTokenOneValue } =
          useReadContract({
            abi: poolMetricsAbi,
            address: poolMetrics,
            functionName: "usdValue",
            args: [
              tokenOne.address as `0x${string}`,
              parseEther(tokenOne.value || "0n"),
            ],
          });

        const { data: tokenTwoValue, refetch: refetchTokenTwoValue } =
          useReadContract({
            abi: poolMetricsAbi,
            address: poolMetrics,
            functionName: "usdValue",
            args: [tokenB as `0x${string}`, parseEther(tokenTwo.value || "1n")],
          });

        const {
          data: hash,
          isPending,
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

        const { isLoading: isCreating, isSuccess: isCreated } =
          useWaitForTransactionReceipt({
            hash,
          });

        const {
          isLoading: isFirstTokenApproving,
          isSuccess: isFirstTokenSuccess,
        } = useWaitForTransactionReceipt({
          hash: firstTokenApproveHash,
        });

        const {
          isLoading: isSecondTokenApproving,
          isSuccess: isSecondTokenSuccess,
        } = useWaitForTransactionReceipt({
          hash: secondTokenApproveHash,
        });

        // const handleCreatePool = async () => {
        //   try {
        //   } catch (error) {}
        // };

        const handleClick = () => {
          const allowance1 = getTokenAllowance(tokenOne.address as Tokens);
          const allowance2 = getTokenAllowance(tokenTwo.address as Tokens);
          if (
            parseFloat(allowance1) <
            parseFloat(tokenOne?.value?.toString() || "0")
          ) {
            handleFirstApprove();
          } else if (
            parseFloat(allowance2) <
            parseFloat(tokenTwo?.value?.toString() || "0")
          ) {
            handleSecondApprove();
          } else {
            handleCreatePool();
          }
        };

        const handleFirstApprove = async () => {
          try {
            await writeFirstTokenApprove({
              address: tokenOne.address as `0x${string}`,
              abi: erc20Abi,
              functionName: "approve",
              args: [poolAddress, parseUnits("100", 10)],
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
              address: tokenTwo.address as `0x${string}`,
              abi: erc20Abi,
              functionName: "approve",
              args: [poolAddress, parseUnits("100", 10)],
            });
            toast.success("Second asset approved succesfully");
          } catch (error) {
            console.error(error);
            toast.error("An error occured");
          }
        };

        const handleCreatePool = async () => {
          try {
            await writeContractAsync({
              abi: liquidityPoolAbi,
              address: poolAddress,
              functionName: "addLiquidity",
              account: address,
              args: [
                tokenOne.address as `0x${string}`,
                tokenTwo.address as `0x${string}`,
                parseEther(tokenOne.value!),
              ],
              // value: parseEther(fee.toString()),
            });
            // if (isConfirmed) {
            // }
          } catch (error) {
            console.error(error);
            toast.error("An error occured");
          }
        };

        const handleRemoveLiquidity = async () => {
          try {
            // await writeContractAsync({
            //   abi: swapAbi,
            //   address: swap,
            //   functionName: "swapAsset",
            //   account: address,
            //   args: [tokenIn.address, tokenOut.address, inputAmount],
            //   value: parseEther(fee.toString()),
            // });
            // if (isConfirmed) {
            // }
          } catch (error) {
            console.error(error);
            toast.error("An error occured");
          }
        };

        // const handleSellAssetOne = async () => {
        //   try {
        //     await writeContractAsync({
        //       abi: swapAbi,
        //       address: swap,
        //       functionName: "swapAsset",
        //       account: address,
        //       args: [tokenIn.address, tokenOut.address, inputAmount],
        //       value: parseEther(fee.toString()),
        //     });
        //     // if (isConfirmed) {
        //     // }
        //   } catch (error) {
        //     toast.error("An error occured");
        //   }
        // };

        useEffect(() => {
          if (isCreated) {
            toast.success("Pool created succesfully");
          }
        }, [isCreated]);

        useEffect(() => {
          if (isFirstTokenSuccess) {
            handleSecondApprove();
          }
        }, [isFirstTokenSuccess]);

        useEffect(() => {
          if (isSecondTokenSuccess) {
            handleCreatePool();
          }
        }, [isSecondTokenSuccess]);

        return (
          <Modal>
            <Modal.Button asChild>
              <Button variant="primary">Add Supply</Button>
            </Modal.Button>
            <Modal.Portal className="backdrop-blur-sm">
              <Modal.Content className="data-[state=open]:animate-contentShow fixed left-1/2 top-1/2 z-30 flex max-h-[814px] w-full max-w-[30.06rem] -translate-x-1/2 -translate-y-1/2 flex-col gap-10 rounded-[10px] border border-[0.5] border-grey-1 bg-black p-10 px-8 py-10 font-khand text-white shadow focus:outline-none">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold"> Add Supply</h2>
                </div>
                <div className="rounded-md bg-grey-1/30 p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-grey-1">
                        First asset
                      </p>
                      <p>{tokenOne.name}</p>
                      {/* <Select
                        inputId="tokenOne"
                        option={tokenOptions.filter(
                          (tokenOption) =>
                            tokenOption.value !== tokenTwo.address,
                        )}
                        onChange={(option) => {
                          console.log(option?.value);
                          setTokenOne({
                            name: option?.label!,
                            address: option?.value!,
                            value: "0",
                          });
                        }}
                      /> */}
                    </span>
                    <span className="flex items-center gap-1">
                      <p className="text-sm font-semibold text-grey-1">
                        Wallet Bal
                      </p>
                      <p>
                        {Number(
                          formatEther(tokenOneBalance ?? BigInt(0)),
                        ).toFixed(2)}
                      </p>
                      <Button variant="primary" className="h-3.5 w-5">
                        Max
                      </Button>
                    </span>
                  </div>
                  <hr />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Input
                        id="tokenOneValue"
                        type="number"
                        value={tokenOne.value}
                        onChange={(e) =>
                          setTokenOne((prev) => {
                            return {
                              ...prev,
                              value: e.target.value,
                            };
                          })
                        }
                      />
                      <p className="text-sm font-semibold text-grey-1">
                        (
                        {`$${formatEther((tokenOneValue as bigint) ?? BigInt(0))}`}
                        )
                      </p>
                    </span>
                    <span className="flex items-center gap-1">
                      <Image
                        height={20}
                        width={20}
                        src="/ethlogo.svg"
                        alt="ethlogo"
                      />
                      <p className="text-2xl">Ethereum</p>
                      {/* <IoMdArrowDropdown /> */}
                    </span>
                  </div>
                </div>
                <div className="rounded-md bg-grey-1/30 p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-grey-1">
                        Second asset
                      </p>
                      <p>{tokenTwo.name}</p>
                    </span>
                    <span className="flex items-center gap-1">
                      <p className="text-sm font-semibold text-grey-1">
                        Wallet Bal
                      </p>
                      <p>
                        {Number(
                          formatEther(tokenTwoBalance ?? BigInt(0)),
                        ).toFixed(2)}
                      </p>
                      <Button variant="primary" className="h-3.5 w-5">
                        Max
                      </Button>
                    </span>
                  </div>
                  <hr />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Input
                        id="tokenTwoValue"
                        type="number"
                        value={tokenTwo.value}
                        onChange={(e) =>
                          setTokenTwo((prev) => {
                            return {
                              ...prev,
                              value: e.target.value,
                            };
                          })
                        }
                      />
                      <p className="text-sm font-semibold text-grey-1">
                        (
                        {`$${formatEther((tokenTwoValue as bigint) ?? BigInt(0))}`}
                        )
                      </p>
                    </span>
                    <span className="flex items-center gap-1">
                      <Image
                        height={20}
                        width={20}
                        src="/ethlogo.svg"
                        alt="ethlogo"
                      />
                      <p className="text-2xl">Ethereum</p>
                      {/* <IoMdArrowDropdown /> */}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p>Summary</p>
                  <div>
                    <span className="flex items-center justify-between">
                      <p className="text-grey-1">Supply APY</p>
                      <p>3.23%</p>
                    </span>
                    <span className="flex items-center justify-between">
                      <p className="text-grey-1">Collateral Factor</p>
                      <p>72.1%</p>
                    </span>
                    <span className="flex items-center justify-between">
                      <p className="text-grey-1">Gas Fee</p>
                      <p>$20</p>
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full font-bold"
                  variant="primary"
                  disabled={
                    isCreating ||
                    isPending ||
                    isFirstTokenPending ||
                    isSecondTokenPending ||
                    isFirstTokenApproving ||
                    isSecondTokenApproving
                  }
                  onClick={handleClick}
                >
                  {isSecondTokenApproving
                    ? "Aproving Second Asset"
                    : isFirstTokenApproving
                      ? "Aproving First Asset"
                      : isPending
                        ? "Confirm Pool Supply..."
                        : isSecondTokenPending
                          ? "Confirm Second Asset Approval..."
                          : isFirstTokenPending
                            ? "Confirm First Asset Approval..."
                            : isCreating
                              ? "Creating Pool.."
                              : "Create Pool"}
                </Button>
              </Modal.Content>
            </Modal.Portal>
          </Modal>
        );
      },
    },
  ];

  return (
    <main className="flex min-h-screen flex-col gap-3 bg-black p-10">
      <Header />
      <div className="w-2/3">
        <h1 className="font-khand text-2xl font-bold text-white">
          Put your funds to work by providing for launchpad liquidity
        </h1>
        <p className="font-khand text-lg text-grey-1">
          When you add funds to launchpad liquidity pool, you can receive a
          share of its trading volume and potentially snag extra rewards when
          there are incentives involved!
        </p>
      </div>
      <DataTable columns={columns} data={pools} />
    </main>
  );
};

export default Page;
