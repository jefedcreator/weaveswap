"use client";
import { DataTable, Header } from "@/components";
import {
  swap,
  swapAbi,
  pool,
  poolAbi,
  AssetName,
  tokenOptions,
  poolTracker,
  poolTrackerAbi,
} from "@/constants";
import { Button, Input, Modal, Select } from "@/primitives";
import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { erc20Abi, formatEther, parseEther, parseUnits } from "viem";
import {
  useAccount,
  useEstimateFeesPerGas,
  useReadContract,
  useSimulateContract,
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
  Action: string;
};

const pools: Pool[] = [
  {
    id: "1",
    Pool: "PLY/WAS",
    Composition: "",
    "7d Volume": "$1M",
    "24h Volume": "$456k",
    Fee: "$35.23",
    "Total Market Cap": "$15m",
    ROI: "13.7%",
    Action: "Add Supply",
  },
  {
    id: "2",
    Pool: "CBC/ETH",
    Composition: "",
    "7d Volume": "$1M",
    "24h Volume": "$456k",
    Fee: "$35.23",
    "Total Market Cap": "$15m",
    ROI: "13.7%",
    Action: "Add Supply",
  },
  {
    id: "3",
    Pool: "CLY/WAS",
    Composition: "",
    "7d Volume": "$1M",
    "24h Volume": "$456k",
    Fee: "$35.23",
    "Total Market Cap": "$15m",
    ROI: "13.7%",
    Action: "Add Supply",
  },
  {
    id: "4",
    Pool: "BLY/WAS",
    Composition: "",
    "7d Volume": "$1M",
    "24h Volume": "$456k",
    Fee: "$35.23",
    "Total Market Cap": "$15m",
    ROI: "13.7%",
    Action: "Add Supply",
  },
  {
    id: "5",
    Pool: "DOT/WAS",
    Composition: "",
    "7d Volume": "$1M",
    "24h Volume": "$456k",
    Fee: "$35.23",
    "Total Market Cap": "$15m",
    ROI: "13.7%",
    Action: "Add Supply",
  },
  {
    id: "6",
    Pool: "ENG/WAS",
    Composition: "",
    "7d Volume": "$1M",
    "24h Volume": "$456k",
    Fee: "$35.23",
    "Total Market Cap": "$15m",
    ROI: "13.7%",
    Action: "Add Supply",
  },
];

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
          case "PLY":
            return (
              <Image
                width="20"
                height="20"
                src="/polygonlogo.svg"
                alt="polygonlogo"
              />
            );
          case "CBC":
            return (
              <Image
                width="20"
                height="20"
                src="/cnbclogo.svg"
                alt="cnbclogo"
              />
            );
          case "CLY":
            return (
              <Image width="20" height="20" src="/clylogo.svg" alt="clylogo" />
            );
          case "BLY":
            return (
              <Image width="20" height="20" src="/blylogo.svg" alt="blylogo" />
            );
          case "DOT":
            return (
              <Image width="20" height="20" src="/dotlogo.svg" alt="dotlogo" />
            );
          case "ENG":
            return (
              <Image width="20" height="20" src="/englogo.svg" alt="englogo" />
            );
          default:
            return null;
        }
      };

      const Token2Icon = ({ token2 }: { token2: string | undefined }) => {
        switch (token2) {
          case "WAS":
            return (
              <Image
                width="20"
                height="20"
                src="/weavelogo.svg"
                alt="weavelogo"
              />
            );
          case "ETH":
            return (
              <Image width="20" height="20" src="/ethlogo.svg" alt="ethlogo" />
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
      const [tokenOne, setTokenOne] = useState<{
        name: string;
        address: string;
        value?: string;
      }>({
        name: "",
        address: "",
        value: "0",
      });

      const [tokenTwo, setTokenTwo] = useState<{
        name: string;
        address: string;
        value?: string;
      }>({
        name: "",
        address: "",
        value: "0",
      });

      const { address } = useAccount();

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
          abi: poolTrackerAbi,
          address: poolTracker as `0x${string}`,
          functionName: "usdValue",
          args: [tokenOne.address as `0x${string}`, tokenOne.value],
        });

      const { data: tokenTwoValue, refetch: refetchTokenTwoValue } =
        useReadContract({
          abi: poolTrackerAbi,
          address: poolTracker as `0x${string}`,
          functionName: "usdValue",
          args: [tokenTwo.address, tokenTwo.value],
        });

      const { data: poolPairs, refetch: refetchPoolPairs } = useReadContract({
        abi: poolTrackerAbi,
        address: poolTracker as `0x${string}`,
        functionName: "getPoolPairs",
        args: [tokenTwo.address],
      });

     

      const { data: hash, isPending, writeContractAsync } = useWriteContract();

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
      const handleFirstApprove = async () => {
        try {
          await writeFirstTokenApprove({
            address: tokenOne.address as `0x${string}`,
            abi: erc20Abi,
            functionName: "approve",
            args: [pool as `0x${string}`, parseUnits("100", 10)],
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
            args: [pool as `0x${string}`, parseUnits("100", 10)],
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
            abi: poolAbi,
            address: pool,
            functionName: "createPool",
            account: address,
            args: [
              tokenOne.address,
              tokenTwo.address,
              parseEther(tokenOne.value!),
              parseEther(tokenTwo.value!),
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

      console.log("tokenTwoValue", tokenTwoValue);
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

      console.log("poolPairs", poolPairs);
  

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
                  <span className="flex items-center gap-1">
                    <p className="text-sm font-semibold text-grey-1">
                      First asset
                    </p>
                    <Select
                      inputId="tokenOne"
                      option={tokenOptions.filter(
                        (tokenOption) => tokenOption.value !== tokenTwo.address,
                      )}
                      onChange={(option) => {
                        console.log(option?.value);
                        setTokenOne({
                          name: option?.label!,
                          address: option?.value!,
                          value: "0",
                        });
                      }}
                    />
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
                  <span className="flex items-center gap-1">
                    <p className="text-sm font-semibold text-grey-1">
                      Second asset
                    </p>
                    <Select
                      inputId="tokenOne"
                      option={tokenOptions.filter(
                        (tokenOption) => tokenOption.value !== tokenOne.address,
                      )}
                      onChange={(option) => {
                        console.log(option?.value);
                        setTokenTwo({
                          name: option?.label!,
                          address: option?.value!,
                          value: "0",
                        });
                      }}
                    />
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
                onClick={handleFirstApprove}
              >
                {isSecondTokenApproving
                  ? "Aproving Second Asset"
                  : isFirstTokenApproving
                    ? "Aproving First Asset"
                    : isPending
                      ? "Conform Pool Creation..."
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

const Page = () => {
  const { data: poolAddresses, refetch: refetchPools } = useReadContract({
    abi: poolTrackerAbi,
    address: poolTracker as `0x${string}`,
    functionName: "pools",
  });
  console.log("poolAddresses:", poolAddresses);

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
