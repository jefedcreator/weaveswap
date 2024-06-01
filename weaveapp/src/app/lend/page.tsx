"use client";
import { DataTable, Header } from "@/components";
import {
  AssetName,
  Tokens,
  borrowTrackerAbi,
  borrowingTracker,
  lendingPoolAbi,
  lendingTracker,
  lendingTrackerAbi,
  tokenA,
  tokenB,
  tokenC,
  tokenOptions,
} from "@/constants";
import { Button, Icon, Input, Modal, Select } from "@/primitives";
import { createUrl, formatNumber } from "@/utils";
import * as Tabs from "@radix-ui/react-tabs";
import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { erc20Abi, formatEther, parseEther, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
  useWriteContract,
} from "wagmi";

type TabType = "supply" | "borrow";

type Asset = {
  Name: AssetName | null;
  Address: `0x${string}` | null;
  Image: string;
  "Total Supplied": string;
  APY: string;
  "Wallet Balance": string;
  Action: string;
};

// const lendingPoolContract = {
//   abi: lendingPoolAbi,
//   address: pooldetail?.[0] as `0x${string}`,
// } as const

const Lend = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { address } = useAccount();

  const action = (): TabType => {
    const optionSearchParams = new URLSearchParams(searchParams.toString());
    const action = optionSearchParams.get("action");
    return action as TabType;
  };

  const setAction = (action: TabType) => {
    const optionSearchParams = new URLSearchParams(searchParams.toString());
    optionSearchParams.set("action", action);
    const optionUrl = createUrl(pathname, optionSearchParams);
    router.replace(optionUrl, { scroll: false });
  };

  const { data: availableTokens, isLoading } = useReadContract({
    abi: lendingTrackerAbi,
    address: lendingTracker,
    functionName: "allAvailableTokens",
    account: address,
  });

  const { data: pooldetail } = useReadContract({
    abi: lendingTrackerAbi,
    address: lendingTracker,
    functionName: "tokenToPool",
    account: address,
    args: [tokenA],
  });

  const { data: poolBdetail } = useReadContract({
    abi: lendingTrackerAbi,
    address: lendingTracker,
    functionName: "tokenToPool",
    account: address,
    args: [tokenB],
  });

  const { data: poolCdetail } = useReadContract({
    abi: lendingTrackerAbi,
    address: lendingTracker,
    functionName: "tokenToPool",
    account: address,
    args: [tokenC],
  });

  // const { data: pooldetail } = useWriteContract({
  //   abi: lendingTrackerAbi,
  //   address: lendingTracker,
  //   functionName: "",
  //   account: address,
  //   args: [tokenA],
  // });

  const { data: borrowingAPY } = useReadContract({
    abi: lendingPoolAbi,
    address: pooldetail?.[0] as `0x${string}`,
    functionName: "borrowingAPY",
  });

  const { data: borrowingBAPY } = useReadContract({
    abi: lendingPoolAbi,
    address: poolBdetail?.[0] as `0x${string}`,
    functionName: "borrowingAPY",
  });

  const { data: borrowingCAPY } = useReadContract({
    abi: lendingPoolAbi,
    address: poolCdetail?.[0] as `0x${string}`,
    functionName: "borrowingAPY",
  });

  const { data: farmedYield } = useReadContract({
    abi: lendingPoolAbi,
    address: pooldetail?.[0] as `0x${string}`,
    functionName: "farmedYield",
    // account: address,
  });

  const { data: yieldValue } = useReadContract({
    abi: lendingPoolAbi,
    address: pooldetail?.[0] as `0x${string}`,
    functionName: "yield",
    // account: address,
  });

  const { data: reserve, refetch: refechAReserve } = useReadContract({
    abi: lendingPoolAbi,
    address: pooldetail?.[0] as `0x${string}`,
    functionName: "reserve",
    // account: address,
  });

  const { data: reserveB, refetch: refechBReserve } = useReadContract({
    abi: lendingPoolAbi,
    address: poolBdetail?.[0] as `0x${string}`,
    functionName: "reserve",
  });

  const { data: reserveC, refetch: refechCReserve } = useReadContract({
    abi: lendingPoolAbi,
    address: poolCdetail?.[0] as `0x${string}`,
    functionName: "reserve",
  });

  console.log("borrowingAPY", borrowingAPY);
  console.log("yield", yieldValue);
  console.log("farmedYield", farmedYield);
  console.log("reserve", reserve);
  console.log("reserveB", reserveB);
  console.log("reserveC", reserveC);

  const {
    data: tokenABalance,
    refetch: refetchTokenA,
    isLoading: isTokenALoading,
  } = useReadContract({
    address: tokenA,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });

  const {
    data: tokenBBalance,
    refetch: refetchTokenB,
    isLoading: isTokenBLoading,
  } = useReadContract({
    address: tokenB,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });

  const {
    data: tokenCBalance,
    refetch: refetchTokenC,
    isLoading: isTokenCLoading,
  } = useReadContract({
    address: tokenC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });

  const {
    data: tokenAAllowance,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: tokenA,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as `0x${string}`, lendingTracker],
  });

  const {
    data: tokenABorrowAllowance,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: tokenA,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as `0x${string}`, borrowingTracker],
  });

  const {
    data: tokenBAllowance,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: tokenB,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as `0x${string}`, lendingTracker],
  });

  const {
    data: tokenBBorrowAllowance,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: tokenB,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as `0x${string}`, borrowingTracker],
  });

  const {
    data: tokenCAllowance,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: tokenC,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as `0x${string}`, lendingTracker],
  });

  const {
    data: tokenCBorrowAllowance,
    // isLoading: isTokenCLoading,
  } = useReadContract({
    address: tokenC,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as `0x${string}`, borrowingTracker],
  });

  const { data: totalBorrowed, refetch: refetchTotalBorrowed } =
    useReadContract({
      address: borrowingTracker,
      abi: borrowTrackerAbi,
      functionName: "totalBorrowed",
      args: [address as `0x${string}`],
    });

  const { data: totalLent, refetch: refetchTotalLent } = useReadContract({
    address: lendingTracker,
    abi: lendingTrackerAbi,
    functionName: "totalLent",
    args: [address as `0x${string}`],
  });

  const getAllowance = (token: Tokens) => {
    let tokenAllowances = {
      [tokenA]: formatEther(BigInt(tokenAAllowance || 0)),
      [tokenB]: formatEther(BigInt(tokenBAllowance || 0)),
      [tokenC]: formatEther(BigInt(tokenCAllowance || 0)),
    };

    return tokenAllowances[token] || "0";
  };

  const getBorrowAllowance = (token: Tokens) => {
    let tokenAllowances = {
      [tokenA]: formatEther(BigInt(tokenABorrowAllowance || 0)),
      [tokenB]: formatEther(BigInt(tokenBBorrowAllowance || 0)),
      [tokenC]: formatEther(BigInt(tokenCBorrowAllowance || 0)),
    };

    return tokenAllowances[token] || "0";
  };

  const refetchBalances = async () => {
    await Promise.all([
      refetchTokenA(),
      refetchTokenB(),
      refetchTokenC(),
      refetchTotalLent(),
      refetchTotalBorrowed(),
      refechAReserve(),
      refechBReserve(),
      refechCReserve(),
    ]);
  };

  useWatchContractEvent({
    address: lendingTracker,
    abi: lendingTrackerAbi,
    eventName: "userLended",
    async onLogs(logs) {
      await refetchBalances();
    },
  });

  useWatchContractEvent({
    address: borrowingTracker,
    abi: borrowTrackerAbi,
    eventName: "userBorrowed",
    async onLogs(logs) {
      await refetchBalances();
    },
  });

  const assets: Asset[] = useMemo(() => {
    if (!availableTokens) return [];
    return (availableTokens as string[])?.map((availableToken) => {
      let tokenInfo: Asset = {
        Name: null,
        Address: null,
        Image: "",
        "Wallet Balance": "",
        APY: "",
        "Total Supplied": "",
        Action: "",
      };

      if (availableToken === tokenA) {
        tokenInfo = {
          Name: "Token A",
          Address: availableToken,
          Image: "/blylogo",
          "Wallet Balance": formatEther(BigInt(tokenABalance ?? 0)),
          APY: `${borrowingAPY || 0}%`,
          "Total Supplied": formatNumber(formatEther(reserve || 0n)),
          Action: "Supply",
        };
      } else if (availableToken === tokenB) {
        tokenInfo = {
          Name: "Token B",
          Address: availableToken,
          Image: "/clylogo",
          "Wallet Balance": formatEther(BigInt(tokenBBalance ?? 0)),
          APY: `${borrowingBAPY || 0}%`,
          "Total Supplied": formatNumber(formatEther(reserveB || 0n)),
          Action: "Supply",
        };
      } else if (availableToken === tokenC) {
        tokenInfo = {
          Name: "Token C",
          Address: availableToken,
          Image: "/dotlogo",
          "Wallet Balance": formatEther(BigInt(tokenCBalance ?? 0)),
          APY: `${borrowingCAPY || 0}%`,
          "Total Supplied": formatNumber(formatEther(reserveC || 0n)),
          Action: "Supply",
        };
      }
      return tokenInfo;
    });
  }, [
    availableTokens,
    address,
    tokenABalance,
    tokenBBalance,
    tokenCBalance,
    totalLent,
    totalBorrowed,
    borrowingAPY,
    borrowingBAPY,
    borrowingCAPY,
  ]);

  const columns: ColumnDef<Asset>[] = [
    {
      accessorKey: "Name",
      // header: "Pool",
      header: () => <div className="text-center">Asset</div>,
      cell: ({ row }) => {
        const asset: AssetName = row.getValue("Name");

        const TokenIcon = () => {
          switch (asset) {
            case "Token A":
              return (
                <Image
                  width="20"
                  height="20"
                  src="/blylogo.svg"
                  alt="blylogo"
                />
              );
            case "Token B":
              return (
                <Image
                  width="20"
                  height="20"
                  src="/clylogo.svg"
                  alt="clylogo"
                />
              );
            case "Token C":
              return (
                <Image
                  width="20"
                  height="20"
                  src="/dotlogo.svg"
                  alt="clylogo"
                />
              );
            default:
              return null;
          }
        };

        return (
          <div className="flex items-center justify-center gap-1 font-medium">
            <TokenIcon />
            <p>{asset}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "Total Supplied",
      header: "Total Supplied",
    },
    {
      accessorKey: "APY",
      header: "APY",
    },
    {
      accessorKey: "Wallet Balance",
      header: "Wallet Balance",
    },
    {
      accessorKey: "Action",
      header: "Action",
      enableHiding: false,

      cell: ({ row }) => {
        const [isModalOpen, setIsModalOpen] = useState(false);

        const handleIsModal = () => {
          setIsModalOpen((prev) => !prev);
        };

        const [inputAmount, setInputAmount] = useState<number | string>(0);
        const [tokenCollateral, setTokenCollateral] = useState<{
          name: string;
          address: `0x${string}`;
          value: number;
        }>({
          name: "",
          address: `0x0`,
          value: 0,
        });
        const searchParams = useSearchParams();
        const { address } = useAccount();
        const action = (): TabType => {
          const optionSearchParams = new URLSearchParams(
            searchParams.toString(),
          );
          const action = optionSearchParams.get("action");
          return action as TabType;
        };

        const title = action()[0]?.toUpperCase() + action().slice(1);

        const balance: string = row.getValue("Wallet Balance");
        const name: string = row.getValue("Name");
        const token: `0x${string}` = row.original.Address!;

        const setMaxAmount = () => {
          setInputAmount(balance.toString());
        };

        const {
          data: hash,
          isPending,
          writeContractAsync,
        } = useWriteContract();

        const {
          data: approveHash,
          isPending: isApprovePending,
          isSuccess: isApproveSuccess,
          writeContractAsync: writeApproveAsync,
        } = useWriteContract();

        const {
          data: collateralApproveHash,
          isPending: isCollateralApprovePending,
          isSuccess: isCollateralApproveSuccess,
          writeContractAsync: writeCollateralApproveAsync,
        } = useWriteContract();
        const {
          data: stakeCollateralHash,
          isPending: isStakeCollateralPending,
          isSuccess: isStakeCollateralSuccess,
          writeContractAsync: writeStakeCollateralAsync,
        } = useWriteContract();
        const {
          data: borrowHash,
          isPending: isBorrowPending,
          isSuccess: isBorrowSuccess,
          writeContractAsync: writeBorrowAsync,
        } = useWriteContract();

        const { isLoading: isConfirming, isSuccess: isConfirmed } =
          useWaitForTransactionReceipt({
            hash,
          });

        const { isLoading: isApproving, isSuccess: isApproved } =
          useWaitForTransactionReceipt({
            hash: approveHash,
          });

        const {
          isLoading: isCollateralApproving,
          isSuccess: isCollateralApproved,
        } = useWaitForTransactionReceipt({
          hash: collateralApproveHash,
        });

        const {
          isLoading: isCollateralStaking,
          isSuccess: isCollateralSuccesss,
        } = useWaitForTransactionReceipt({
          hash: stakeCollateralHash,
        });

        const { isLoading: isBorrowLoading, isSuccess: isBorrowSuccesss } =
          useWaitForTransactionReceipt({
            hash: borrowHash,
          });

        const handleLendApprove = async () => {
          try {
            await writeApproveAsync({
              address: token as `0x${string}`,
              abi: erc20Abi,
              functionName: "approve",
              args: [lendingTracker, parseUnits("100", 10)],
            });
            toast.success("Token approved succesfully");
          } catch (error) {
            console.error(error);
            toast.error("An error occured");
          }
        };

        const handleClick = () => {
          if (action() === "borrow") {
            const allowance = getBorrowAllowance(
              tokenCollateral.address as Tokens,
            );
            if (
              parseFloat(allowance) <
              parseFloat(tokenCollateral.value.toString())
            ) {
              handleCollateralApprove();
            } else {
              handleStakeCollateral();
            }
          } else {
            const allowance = getAllowance(token as Tokens);
            if (parseFloat(allowance) < parseFloat(inputAmount.toString())) {
              handleLendApprove();
            } else {
              handleSupply();
            }
          }
        };

        const handleCollateralApprove = async () => {
          try {
            await writeCollateralApproveAsync({
              address: tokenCollateral.address as `0x${string}`,
              abi: erc20Abi,
              functionName: "approve",
              args: [borrowingTracker, parseUnits("100", 10)],
            });
            toast.success("Token approved succesfully");
          } catch (error) {
            console.error(error);
            toast.error("An error occured");
          }
        };

        const handleSupply = async () => {
          try {
            await writeContractAsync({
              abi: lendingTrackerAbi,
              address: lendingTracker,
              functionName: "lendToken",
              account: address,
              args: [token, parseEther(inputAmount.toString())],
            });
            await refetchBalances();
            await refetchTotalLent();
            handleIsModal();
            toast.success("Token supplied succesfully");
          } catch (error) {
            console.error(error);
            toast.error("An error occured");
          }
        };

        const handleStakeCollateral = async () => {
          try {
            await writeStakeCollateralAsync({
              abi: borrowTrackerAbi,
              address: borrowingTracker,
              functionName: "stakeCollateral",
              account: address,
              args: [
                tokenCollateral.address,
                parseEther(tokenCollateral.value.toString()),
              ],
            });
            toast.success("Collateral Staked succesfully");
          } catch (error) {
            console.error(error);
            toast.error("An error occured");
          }
        };

        const handleBorrow = async () => {
          try {
            await writeContractAsync({
              abi: borrowTrackerAbi,
              address: borrowingTracker,
              functionName: "borrowToken",
              account: address,
              args: [token, parseEther(inputAmount.toString())],
            });
            await refetchBalances();
            await refetchTotalBorrowed();
            handleIsModal();
            toast.success("Token Borrowed succesfully");
          } catch (error) {
            console.error(error);
            toast.error("An error occured");
          }
        };

        useEffect(() => {
          if (isApproved) {
            handleSupply();
          }
        }, [isApproved]);

        useEffect(() => {
          if (isCollateralApproved) {
            handleStakeCollateral();
          }
        }, [isCollateralApproved]);

        useEffect(() => {
          if (isCollateralSuccesss) {
            handleBorrow();
          }
        }, [isCollateralSuccesss]);

        return (
          <Suspense fallback={<>Loading...</>}>
            <Modal open={isModalOpen} onOpenChange={handleIsModal}>
              <Modal.Button asChild>
                <Button variant="primary">
                  {action() == "supply" ? `Add Supply` : `Borrow`}
                </Button>
              </Modal.Button>
              <Modal.Portal className="backdrop-blur-sm">
                <Modal.Content className="data-[state=open]:animate-contentShow fixed left-1/2 top-1/2 z-30 flex max-h-[814px] w-full max-w-[30.06rem] -translate-x-1/2 -translate-y-1/2 flex-col gap-10 rounded-[10px] border border-[0.5] border-grey-1 bg-black p-10 px-8 py-10 font-khand text-white shadow focus:outline-none">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">{title}</h2>
                  </div>
                  <div className="rounded-md bg-grey-1/30 p-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <p className="text-sm font-semibold text-grey-1">
                          {`${name} Asset`}
                        </p>
                      </span>
                      <span className="flex items-center gap-1">
                        <p className="text-sm font-semibold text-grey-1">
                          Wallet Bal
                        </p>
                        <p>{balance}</p>
                        <Button
                          variant="primary"
                          className="h-3.5 w-5"
                          onClick={setMaxAmount}
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
                          value={inputAmount}
                          onChange={(e) => setInputAmount(e.target.value)}
                        />
                        <p className="text-sm font-semibold text-grey-1">
                          ($4602.43)
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
                  {action() == "borrow" && inputAmount && (
                    <div className="rounded-md bg-grey-1/30 p-4">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <p className="text-sm font-semibold text-grey-1">
                            Collateral
                          </p>
                          <Select
                            inputId="token1"
                            option={tokenOptions.filter(
                              (tokenOption) => tokenOption.value !== token,
                            )}
                            onChange={(option) => {
                              setTokenCollateral({
                                name: option?.label!,
                                address: option?.value! as `0x${string}`,
                                value: 0,
                              });
                            }}
                          />
                        </span>
                      </div>
                      <hr />
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Input
                            id="valueIn"
                            type="number"
                            value={tokenCollateral.value}
                            onChange={(e) =>
                              setTokenCollateral((prev) => {
                                return {
                                  ...prev,
                                  value: Number(e.target.value),
                                };
                              })
                            }
                          />
                          <p className="text-sm font-semibold text-grey-1">
                            ($4602.43)
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
                  )}
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
                      isApprovePending ||
                      isPending ||
                      isConfirming ||
                      isApproving ||
                      isBorrowLoading ||
                      isCollateralStaking ||
                      isCollateralApproving ||
                      isBorrowPending ||
                      isStakeCollateralPending ||
                      isCollateralApprovePending ||
                      // (action()=='supply' && (!inputAmount))
                      (action() == "borrow" &&
                        (!tokenCollateral.name || !tokenCollateral.value))
                    }
                    onClick={handleClick}
                  >
                    {isCollateralApprovePending
                      ? "Approving collateral"
                      : isStakeCollateralPending
                        ? "Approve stake collateral..."
                        : isBorrowPending
                          ? "Confirm borrow..."
                          : isCollateralApproving
                            ? "Confirming collateral"
                            : isCollateralStaking
                              ? "Staking collateral.."
                              : isBorrowLoading
                                ? "Borrowing..."
                                : isConfirming
                                  ? "Confirming token supplied"
                                  : isApproving
                                    ? "Confirming Approval..."
                                    : isPending
                                      ? "Supply token pending..."
                                      : isApprovePending
                                        ? "Aproving token.."
                                        : title}
                  </Button>
                </Modal.Content>
              </Modal.Portal>
            </Modal>
          </Suspense>
        );
      },
    },
  ];

  useEffect(() => {}, [totalBorrowed, totalBorrowed]);

  return (
    <main className="flex min-h-screen flex-col gap-3 bg-black p-10">
      <Header />
      <div className="w-2/3">
        <h1 className="font-khand text-2xl font-bold text-white">
          Lock in your crypto assets to earn interest
        </h1>
        <p className="font-khand text-lg text-grey-1">
          Enable peer-to-peer lending and borrowing through blockchain
          technology, providing users with direct control, reduced fees, and
          increased financial accessibility!
        </p>
      </div>
      <div className="border-0.5 flex items-center justify-between rounded-md border border-grey-2 px-10 py-3 font-khand text-white">
        <div className="flex flex-col items-center justify-center">
          <span className="flex gap-2 text-sm font-semibold">
            <Icon name="supply" />
            Total Supply
          </span>
          <p className="text-2xl">{`$${
            totalLent ? parseInt(formatEther(totalLent))?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) : 0
          }`}</p>
        </div>
        <hr className="h-full w-[1px] bg-grey-2" />
        <div className="flex flex-col items-center justify-center">
          <span className="flex gap-2 text-sm font-semibold">
            <Icon name="apy" />
            Net APY
          </span>
          <p className="text-2xl">0.00%</p>
        </div>
        <hr className="h-full w-[1px] bg-grey-2" />
        <div className="flex flex-col items-center justify-center">
          <span className="flex gap-2 text-sm font-semibold">
            <Icon name="borrow" />
            Total Borrow
          </span>
          <p className="text-2xl">{`$${
            totalBorrowed ? parseInt(formatEther(totalBorrowed))?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) : 0
          }`}</p>
        </div>
      </div>
      <Tabs.Root
        value={action()!}
        onValueChange={(value) => setAction(value as TabType)}
        className="flex flex-col gap-4"
      >
        <Tabs.List className="flex items-center font-khand font-semibold">
          <Tabs.Trigger key="supply" value={"supply"}>
            <p
              className={twMerge(
                `text-grey-1  ${action() == "supply" && "text-white"}`,
              )}
            >
              Supply
            </p>
            <hr
              className={twMerge(
                `h-[4px] w-[102px] bg-grey-1  ${
                  action() == "supply" &&
                  "border-b-1 border-primary-4 bg-primary-4"
                }`,
              )}
            />
          </Tabs.Trigger>

          <Tabs.Trigger key="borrow" value={"borrow"}>
            <p
              className={twMerge(
                `text-grey-1  ${action() == "borrow" && "text-white"}`,
              )}
            >
              Borrow
            </p>
            <hr
              className={twMerge(
                `h-[4px] w-[102px] bg-grey-1  ${
                  action() == "borrow" &&
                  "border-b-1 border-primary-4 bg-primary-4"
                }`,
              )}
            />
          </Tabs.Trigger>
        </Tabs.List>
        {isLoading || isTokenALoading || isTokenBLoading || isTokenCLoading ? (
          <>Loading...</>
        ) : (
          <>
            <Tabs.Content value="supply">
              <DataTable columns={columns} data={assets} />
            </Tabs.Content>
            <Tabs.Content value="borrow">
              <DataTable columns={columns} data={assets} />
            </Tabs.Content>
          </>
        )}
      </Tabs.Root>
    </main>
  );
};

const Page = () => {
  return (
    <Suspense fallback={<>Loading...</>}>
      <Lend />
    </Suspense>
  );
};

export default Page;
