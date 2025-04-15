import { mockAddressAtom } from "@/Web3Provider";
import { sowBlueprintv0ABI } from "@/constants/abi/SowBlueprintv0ABI";
import { tractorHelpersABI } from "@/constants/abi/TractorHelpersABI";
import { diamondABI as beanstalkAbi } from "@/constants/abi/diamondABI";
import { morningFieldDevModeAtom } from "@/state/protocol/field/field.atoms";
import { getMorningResult, getNowRounded } from "@/state/protocol/sun";
import { morningAtom, seasonAtom, sunQueryKeysAtom } from "@/state/protocol/sun/sun.atoms";
import { useFieldQueryKeys, useInvalidateField } from "@/state/useFieldData";
import { usePriceData } from "@/state/usePriceData";
import { useInvalidateSun, useSeasonQueryKeys } from "@/state/useSunData";
import useTokenData from "@/state/useTokenData";
import { useFarmerSilo } from "@/state/useFarmerSilo";
import { isDev } from "@/utils/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { http, PublicClient, createPublicClient, decodeEventLog, erc20Abi, isAddress } from "viem";
import { hardhat } from "viem/chains";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import MorningCard from "./MorningCard";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";

type ServerStatus = "running" | "not-running" | "checking";

// this extended type declaration is to fix the fact that hardhat_mine is not one of the offical types
type ExtendedPublicClient = PublicClient & {
  request(args: { method: "hardhat_mine"; params: string[] }): Promise<void>;
};

const publicClient = createPublicClient({
  chain: hardhat,
  transport: http(),
});

// Merge the ABIs
const combinedABI = [...beanstalkAbi, ...sowBlueprintv0ABI, ...tractorHelpersABI, ...erc20Abi] as const;

export default function DevPage() {
  const { address } = useAccount();
  const [loading, setLoading] = useState<string | null>(null);
  // Separate state for Minting section
  const [mintAddress, setMintAddress] = useState(address || "");
  const [mintAmount, setMintAmount] = useState("");
  const [usdcAddress, setUsdcAddress] = useState(address || "");
  // Separate state for Liquidity Management section
  const [wellAddress, setWellAddress] = useState("");
  const [wellAmounts, setWellAmounts] = useState("");
  const [receiverAddress, setReceiverAddress] = useState(address || "");
  const [tokenBalance, setTokenBalance] = useState({
    receiver: address || "",
    amount: "",
    token: "",
  });
  const chainId = useChainId();

  const { lpTokens } = useTokenData();

  const [serverStatus, setServerStatus] = useState<ServerStatus>("checking");

  const [approvalAddress, setApprovalAddress] = useState(address || "");

  const [singleSidedAddress, setSingleSidedAddress] = useState(address || "");
  const [singleSidedAmounts, setSingleSidedAmounts] = useState("");

  const priceData = usePriceData();

  const hasZeroPrices = (() => {
    if (priceData.loading) return false;
    if (priceData.pools.length === 0) {
      return true;
    }
    const result = priceData.pools.some((pool) => pool.price?.eq(0));
    return result;
  })();

  const [selectedPercent, setSelectedPercent] = useState<number>(10);

  const [blockSkipAmount, setBlockSkipAmount] = useState("6"); // default to 6 blocks because the morning auction updates every 6 blocks (12 seconds on eth, 2 seconds on base, 12/2 = 6)

  const [mockAddress, setMockAddress] = useAtom(mockAddressAtom);

  const [txHash, setTxHash] = useState<`0x${string}` | "">("");
  const [txEvents, setTxEvents] = useState<
    | {
        eventName: string;
        args: Record<string, any>;
        address: string;
        logIndex: number;
      }[]
    | null
  >(null);

  const [recentTxs, setRecentTxs] = useState<`0x${string}`[]>([]);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch("http://localhost:3002/execute-task", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ task: "ping" }),
        });
        setServerStatus("running");
      } catch (error) {
        setServerStatus("not-running");
      }
    };

    checkServer();
  }, []);

  // Update addresses when account changes
  useEffect(() => {
    setMintAddress(address || "");
    setUsdcAddress(address || "");
    setTokenBalance((prev) => ({ ...prev, receiver: address || "" }));
    setReceiverAddress(address || "");
  }, [address]);

  const fetchRecentTransactions = async () => {
    if (!address || !publicClient) return;

    try {
      const latestBlock = await publicClient.getBlockNumber();
      const recentTxs = new Set<`0x${string}`>();

      // Look back through blocks until we find 5 transactions or hit 100 blocks
      for (let i = 0; i < 100 && recentTxs.size < 5; i++) {
        try {
          const block = await publicClient.getBlock({
            blockNumber: latestBlock - BigInt(i),
            includeTransactions: true,
          });

          // Find all transactions from our address in this block
          const blockTxs = block.transactions.filter(
            (tx) => typeof tx === "object" && tx.from.toLowerCase() === address.toLowerCase(),
          );

          // Add new transactions to our set
          for (const tx of blockTxs) {
            if (typeof tx === "object") {
              recentTxs.add(tx.hash);
              if (recentTxs.size >= 5) break;
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch block ${latestBlock - BigInt(i)}:`, err);
        }
      }

      // Convert Set back to array and update state
      setRecentTxs(Array.from(recentTxs));
    } catch (error) {
      console.error("Failed to fetch recent transactions:", error);
    }
  };

  useEffect(() => {
    fetchRecentTransactions();
  }, [address, publicClient]);

  if (!isDev()) {
    return <Navigate to="/" replace />;
  }

  const executeTask = async (taskName: string, params?: Record<string, any>): Promise<void> => {
    setLoading(taskName);
    try {
      // Merge the provided params with the default network param
      const taskParams = {
        network: "localhost",
        ...params, // This allows overriding network if needed
      };

      const response = await fetch("http://localhost:3002/execute-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task: taskName, params: taskParams }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Task ${taskName} completed successfully`);
        console.log(data.data); // Log additional data if available
      } else {
        toast.error(`Task ${taskName} failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Failed to execute task:", error);
      // Check if the error is due to server not running
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error("Server not running, from protocol dir run `yarn hardhat-server`");
      } else {
        toast.error(`Failed to execute ${taskName}`);
      }
    } finally {
      setLoading(null);
    }
  };

  const getWellsList = () => {
    // Import tokens from your token data

    // Filter for LP tokens which are the wells
    return lpTokens.map((token) => ({
      name: token.name,
      address: token.address,
    }));
  };

  const calculatePercentAmounts = (percent: number) => {
    console.log("priceData", priceData.pools);
    const tokenOrder = ["WETH", "cbETH", "cbBTC", "USDC", "WSOL"];
    const amounts = tokenOrder.map((symbol) => {
      const pool = priceData.pools.find((p) => p.tokens.some((token) => token.symbol === symbol));

      if (!pool) {
        console.log("pool for token not found:", symbol);
        return "0";
      }

      const tokenIndex = pool.tokens.findIndex((token) => token.symbol === symbol);
      if (tokenIndex === -1) return "0";

      const percentAmount = pool.balances[tokenIndex].mul(percent / 100);
      console.log(`calculated ${percent}%:`, percentAmount.toHuman(), " for token ", symbol);
      return percentAmount.toHuman();
    });

    setSingleSidedAmounts(amounts.join(","));
    setSelectedPercent(percent);
  };

  const skipBlocks = async (_numBlocks?: number) => {
    try {
      const blocks = _numBlocks ?? parseInt(blockSkipAmount);
      if (Number.isNaN(blocks)) {
        toast.error("Please enter a valid number of blocks");
        return;
      }

      // hardhat_mine is not one of the offical types, so casting to any
      await (publicClient as ExtendedPublicClient).request({
        method: "hardhat_mine",
        params: [`0x${blocks.toString(16)}`],
      });

      toast.success(`Skipped ${blocks} blocks`);
    } catch (error) {
      console.error("Failed to skip blocks:", error);
      toast.error("Failed to skip blocks. Make sure you are connected to an Anvil/Hardhat node.");
    }
  };

  const handleQuickMint = async () => {
    if (!address) {
      toast.error("No wallet connected");
      return;
    }

    setLoading("quickMint");
    try {
      // Mint ETH
      await executeTask("mintEth", { account: address });
      // Mint USDC
      await executeTask("mintUsdc", { account: address, amount: "10000" });
      // Get PINTO tokens
      await executeTask("getTokens", {
        receiver: address,
        amount: "10000",
        token: "PINTO",
      });

      toast.success("Successfully minted tokens");
    } catch (error) {
      console.error("Quick mint failed:", error);
      toast.error("Failed to mint tokens");
    } finally {
      setLoading(null);
    }
  };

  const analyzeTxEvents = async (hashToAnalyze?: `0x${string}`) => {
    // Add type assertion to ensure hashToUse is of type `0x${string}`
    const hashToUse = (hashToAnalyze || txHash) as `0x${string}`;

    if (!hashToUse || !hashToUse.startsWith("0x") || !publicClient) {
      toast.error("Please enter a valid transaction hash");
      return;
    }

    try {
      setLoading("analyzeTx");
      const receipt = await publicClient.getTransactionReceipt({
        hash: hashToUse,
      });

      const decodedEvents = receipt.logs.map((log, index) => {
        try {
          const decoded = decodeEventLog({
            abi: combinedABI, // Use the combined ABI
            data: log.data,
            topics: log.topics,
          });

          return {
            eventName: decoded.eventName,
            args: decoded.args as Record<string, any>,
            address: log.address,
            logIndex: log.logIndex,
          };
        } catch (error) {
          // If we can't decode with any ABI, return a raw event
          return {
            eventName: "Unknown Event (Note: This just means we probably don't have the ABI, add it in DevPage.tsx)",
            args: {
              data: log.data,
              topics: log.topics,
            },
            address: log.address,
            logIndex: log.logIndex,
          };
        }
      });

      setTxEvents(decodedEvents);
      console.log("Transaction Events:", decodedEvents);
      toast.success("Transaction analyzed successfully");
    } catch (error) {
      console.error("Failed to analyze transaction:", error);
      toast.error("Failed to analyze transaction");
      setTxEvents(null);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      <div className="flex flex-col gap-6 w-[80%] mb-20">
        <h1 className="font-[300] text-[3.5rem] text-black">Development Page</h1>
        {serverStatus === "not-running" && (
          <div className="text-pinto-red-2 text-xl mb-4 p-4 border border-pinto-red-2 rounded-lg">
            Server not running. Please run `yarn hardhat-server` from the protocol directory.
          </div>
        )}
        {chainId !== 1337 && (
          <div className="text-pinto-red-2 text-xl mb-4 p-4 border border-pinto-red-2 rounded-lg">
            You are on chainId: {chainId}. Connect to localhost:1337
          </div>
        )}
        {hasZeroPrices && (
          <div className="text-pinto-red-2 text-xl mb-4 p-4 border border-pinto-red-2 rounded-lg">
            Price is zero, likely due to oracle timeout. Try clicking the Update Oracle Timeouts button.
          </div>
        )}

        {/* Basic Actions */}
        <Card className="p-6">
          <h2 className="text-2xl mb-4">Basic Actions</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => executeTask("callSunrise")} disabled={loading === "callSunrise"}>
                Call Sunrise
              </Button>
              <Button
                onClick={async () => {
                  await executeTask("callSunrise");
                  await executeTask("callSunrise");
                }}
                disabled={loading === "callSunrise"}
              >
                Double Sunrise
              </Button>
              <Button onClick={() => executeTask("skipMorningAuction")} disabled={loading === "skipMorningAuction"}>
                Skip Morning Auction
              </Button>
              <Button onClick={() => executeTask("megaDeploy")} disabled={loading === "megaDeploy"}>
                Mega Deploy
              </Button>
              <Button onClick={() => executeTask("forceFlood")} disabled={loading === "forceFlood"}>
                Force Flood
              </Button>
              <Button onClick={() => executeTask("updateOracleTimeouts")} disabled={loading === "updateOracleTimeouts"}>
                Update Oracle Timeouts
              </Button>
              <Button onClick={() => executeTask("PI-8")} disabled={loading === "TractorHelpers"}>
                Deploy PI-8
              </Button>
              <Button
                onClick={handleQuickMint}
                disabled={!address || loading === "quickMint"}
                className="bg-pinto-green-4 hover:bg-pinto-green-5 text-white"
              >
                Mint Me ETH/USDC/Pinto
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="# Blocks to skip"
                value={blockSkipAmount}
                onChange={(e) => setBlockSkipAmount(e.target.value)}
                className="w-32"
              />
              <Button onClick={() => skipBlocks()}>Skip Blocks</Button>
            </div>
          </div>
        </Card>

        {/* Mock Address */}
        <Card className="p-6">
          <h2 className="text-2xl mb-4">Mock Configuration</h2>
          <div className="flex flex-col gap-4">
            <div className="text-sm text-gray-500">Configure the mock wallet address for local development</div>
            <div className="flex gap-2">
              <Input
                placeholder="Mock Wallet Address"
                value={mockAddress}
                onChange={(e) => {
                  const newAddress = e.target.value as `0x${string}`;
                  setMockAddress(newAddress); // Always update the input
                  if (isAddress(newAddress)) {
                    localStorage.setItem("mockAddress", newAddress);
                  } else if (!newAddress) {
                    localStorage.removeItem("mockAddress");
                  }
                }}
                className={`flex-1 ${mockAddress && !isAddress(mockAddress) ? "border-pinto-red-2" : ""}`}
              />
            </div>
            <div className="text-right h-4 text-sm text-pinto-gray-4">
              {isAddress(mockAddress) ? "Valid Address" : "Invalid Address"}
            </div>
          </div>
        </Card>

        {/* Minting Actions */}
        <Card className="p-6">
          <h2 className="text-2xl mb-4">Minting</h2>
          <div className="flex flex-col gap-4">
            {/* ETH Minting */}
            <div className="flex flex-col gap-2">
              <Input
                placeholder="ETH Receiver Address"
                value={mintAddress}
                onChange={(e) => setMintAddress(e.target.value)}
              />
              <Button
                onClick={() => executeTask("mintEth", { account: mintAddress })}
                disabled={!mintAddress || loading === "mintEth"}
              >
                Mint ETH
              </Button>
            </div>

            {/* USDC Minting */}
            <div className="flex flex-col gap-2">
              <Input
                placeholder="USDC Receiver Address"
                value={usdcAddress}
                onChange={(e) => setUsdcAddress(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Amount"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  className="max-w-[200px]"
                />
                <Button
                  onClick={() =>
                    executeTask("mintUsdc", {
                      account: usdcAddress,
                      amount: mintAmount,
                    })
                  }
                  disabled={!usdcAddress || !mintAmount || loading === "mintUsdc"}
                >
                  Mint USDC
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Token Balance Management */}
        <Card className="p-6">
          <h2 className="text-2xl mb-4">Token Balance Management</h2>
          <div className="text-sm text-gray-500 mb-4">
            Available tokens: PINTO, WETH, USDC, cbBTC, cbETH, wstETH. You can use either token symbols or addresses.
          </div>
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Receiver Address"
              value={tokenBalance.receiver}
              onChange={(e) => setTokenBalance((prev) => ({ ...prev, receiver: e.target.value }))}
            />
            <Input
              placeholder="Amount"
              value={tokenBalance.amount}
              onChange={(e) => setTokenBalance((prev) => ({ ...prev, amount: e.target.value }))}
            />
            <Input
              placeholder="Token Address or Name"
              value={tokenBalance.token}
              onChange={(e) => setTokenBalance((prev) => ({ ...prev, token: e.target.value }))}
            />
            <Button
              onClick={() => executeTask("getTokens", tokenBalance)}
              disabled={
                !tokenBalance.receiver || !tokenBalance.amount || !tokenBalance.token || loading === "getTokens"
              }
            >
              Get Tokens
            </Button>
          </div>
        </Card>

        {/* Liquidity Actions */}
        <Card className="p-6">
          <h2 className="text-2xl mb-4">Liquidity Management</h2>
          <div className="flex flex-col gap-4">
            <div className="text-sm text-gray-500 mb-4">
              <div className="font-medium mb-2">Available Wells:</div>
              {getWellsList().map((well) => (
                <div key={well.address} className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs">{well.address}</span>
                  <span className="text-xs">({well.name})</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Input placeholder="Well Address" value={wellAddress} onChange={(e) => setWellAddress(e.target.value)} />
              <Input
                placeholder="Amounts (comma-separated)"
                value={wellAmounts}
                onChange={(e) => setWellAmounts(e.target.value)}
              />
              <Input
                placeholder="Receiver Address"
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    executeTask("addLiquidity", {
                      well: wellAddress,
                      amounts: wellAmounts,
                      receiver: receiverAddress,
                    })
                  }
                  disabled={!wellAddress || !wellAmounts || !receiverAddress || loading === "addLiquidity"}
                >
                  Add Liquidity
                </Button>
                <Button
                  onClick={() =>
                    executeTask("addLiquidityToAllWells", {
                      receiver: receiverAddress,
                    })
                  }
                  disabled={!receiverAddress || loading === "addLiquidityToAllWells"}
                >
                  Add Liquidity To All Wells
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Token Approvals */}
        <Card className="p-6">
          <h2 className="text-2xl mb-4">Token Approvals</h2>
          <div className="flex flex-col gap-4">
            <div className="text-sm text-gray-500">
              Approves all non-PINTO tokens for whitelisted wells using the specified account.
            </div>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Account Address"
                value={approvalAddress}
                onChange={(e) => setApprovalAddress(e.target.value)}
              />
              <Button
                onClick={() =>
                  executeTask("approveTokens", {
                    account: approvalAddress,
                  })
                }
                disabled={!approvalAddress || loading === "approveTokens"}
              >
                Approve All Tokens
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl mb-4">Single-Sided Deposits</h2>
          <div className="flex flex-col gap-4">
            <div className="text-sm text-gray-500">
              Deposits non-PINTO tokens into wells and then into beanstalk. Enter amounts in order:
              WETH,cbETH,cbBTC,USDC,WSOL
            </div>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Account Address"
                value={singleSidedAddress}
                onChange={(e) => setSingleSidedAddress(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Amounts (comma-separated)"
                  value={singleSidedAmounts}
                  onChange={(e) => setSingleSidedAmounts(e.target.value)}
                  className="flex-1"
                />
                <div className="flex gap-1">
                  {[1, 5, 10, 50, 100].map((percent) => (
                    <Button
                      key={percent}
                      onClick={() => calculatePercentAmounts(percent)}
                      variant={selectedPercent === percent ? "default" : "outline"}
                      className="px-3"
                    >
                      {percent}%
                    </Button>
                  ))}
                </div>
              </div>
              <Button
                onClick={() =>
                  executeTask("singleSidedDeposits", {
                    account: singleSidedAddress,
                    amounts: singleSidedAmounts,
                  })
                }
                disabled={!singleSidedAddress || !singleSidedAmounts || loading === "singleSidedDeposits"}
              >
                Execute Single-Sided Deposits
              </Button>
            </div>
          </div>
        </Card>
        <MorningAuctionDev executeTask={executeTask} skipBlocks={skipBlocks} />
        <Card className="p-6">
          <h2 className="text-2xl mb-4">Transaction Analysis</h2>
          <div className="flex flex-col gap-4">
            <div className="text-sm text-gray-500">
              Paste a transaction hash to see all events that occurred in that transaction.
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Transaction Hash"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value as `0x${string}`)}
                className="flex-1"
              />
              <Button onClick={() => analyzeTxEvents()} disabled={!txHash || loading === "analyzeTx"}>
                Analyze
              </Button>
            </div>

            {/* Add Recent Transactions Section */}
            {recentTxs.length > 0 && (
              <div className="mt-2">
                <div className="text-sm text-gray-500 mb-2">Recent transactions:</div>
                <div className="flex flex-col gap-2">
                  {recentTxs.map((hash, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={async () => {
                          await analyzeTxEvents(hash);
                          setTxHash(hash as `0x${string}`);
                        }}
                        className="text-sm text-pinto-green-4 hover:text-pinto-green-5 hover:underline font-mono break-all text-left"
                        title="Click to analyze this transaction"
                      >
                        {hash}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const command = `cast run ${hash} --rpc-url http://localhost:8545`;
                          navigator.clipboard.writeText(command);
                          toast.success("Debug command copied to clipboard");
                        }}
                        className="text-sm text-pinto-gray-4 hover:text-pinto-gray-5 whitespace-nowrap"
                        title="Copy debug command to clipboard"
                      >
                        Copy Debug Command
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Events Display */}
            {txEvents && (
              <div className="mt-4 space-y-4">
                <h3 className="text-lg font-medium">Events:</h3>
                <div className="space-y-4">
                  {txEvents.map((event, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-pinto-green-4">{event.eventName}</span>
                        <span className="text-sm text-gray-500">Log Index: {event.logIndex}</span>
                      </div>
                      <div className="text-sm font-mono mt-2">Contract: {event.address}</div>
                      <div className="mt-2">
                        <div className="text-sm font-medium">Arguments:</div>
                        <pre className="mt-1 p-2 bg-gray-50 rounded text-sm overflow-x-auto">
                          {JSON.stringify(event.args, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
        
        {/* Farmer Silo Deposits section - render component directly */}
        <FarmerSiloDeposits />
      </div>
    </div>
  );
}

const MorningAuctionDev = ({
  executeTask,
  skipBlocks,
}: {
  executeTask: (task: string, params?: Record<string, any>) => Promise<void>;
  skipBlocks: (numBlocks?: number) => Promise<void>;
}) => {
  const blockQuery = useBlockNumber({
    query: {
      refetchInterval: 20_000,
      refetchIntervalInBackground: false,
      refetchOnMount: true,
    },
  });
  const [blocknum, setBlocknum] = useState<number>(Number(blockQuery.data) || 0);

  useEffect(() => {
    if (blockQuery.data) {
      setBlocknum(Number(blockQuery.data));
    }
  }, [blockQuery.data]);

  const [sun, setSun] = useAtom(seasonAtom);
  const fieldQueryKeys = useFieldQueryKeys();
  const seasonQueryKeys = useSeasonQueryKeys();
  const invalidateSun = useInvalidateSun();
  const invalidateField = useInvalidateField();
  const [morning, setMorning] = useAtom(morningAtom);
  const [freezeMorningTasks, setFreezeMorningTasks] = useAtom(morningFieldDevModeAtom);
  const [isInitializing, setIsInitializing] = useState(false);
  const queryClient = useQueryClient();

  const deltaBlocks = Math.max(blocknum - sun.sunriseBlock, 0);

  const infos = [
    { label: "Current block", value: blockQuery.data?.toString() },
    { label: "Sunrise block", value: sun.sunriseBlock?.toString() },
    { label: "Delta blocks", value: blockQuery.data ? Number(blockQuery.data) - sun.sunriseBlock : 0 },
    { label: "morning index (0-24)", value: !morning.isMorning ? "N/A" : morning.index },
  ];

  const tryFetchSeason = async () => {
    try {
      const time: any = await queryClient.fetchQuery({ queryKey: seasonQueryKeys.season });
      const now = getNowRounded();
      const struct = {
        current: time.current,
        lastSopStart: time.lastSop,
        lastSopEnd: time.lastSopSeason,
        rainStart: time.rainStart,
        raining: time.raining,
        sunriseBlock: Number(time.sunriseBlock),
        abovePeg: time.abovePeg,
        start: Number(time.start),
        period: Number(time.period),
        timestamp: now,
      };
      console.log("data", struct);
      return struct;
    } catch (e) {
      console.log("error fetching season", e);
      return undefined;
    }
  };

  const waitForSeasonChange = async (currSeason: number, maxAttempts = 4): Promise<typeof sun | undefined> => {
    for (let i = 0; i < maxAttempts; i++) {
      console.log(`Attempt ${i + 1} to fetch new season...`);
      const newData = await tryFetchSeason();

      if (newData && newData.current !== currSeason) {
        console.log("Season changed:", newData.current);
        return newData;
      }

      if (i < maxAttempts - 1) {
        // Don't wait on the last attempt
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    return undefined;
  };

  const handleFWDSeasonAndInitMorning = async (freeze?: boolean) => {
    const currSeason = sun.current;
    if (isInitializing) return;

    try {
      setIsInitializing(true);
      toast.loading("initializing morning...");

      setFreezeMorningTasks((draft) => {
        draft.freeze = freeze || false;
      });

      executeTask("callSunrise");

      const struct = await waitForSeasonChange(currSeason);
      if (!struct) {
        toast.error("Season did not change after maximum attempts");
        return;
      }

      // Wait for invalidation calls to complete
      await invalidateField("all");

      console.log("waiting for 2 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log("done waiting");
      // Do the initialization directly here instead of relying on the useEffect
      const morningResult = getMorningResult({
        timestamp: struct.timestamp,
        blockNumber: struct.sunriseBlock,
      });

      console.log("struct", struct);
      console.log("morningResult", morningResult);
      setSun(struct);
      setMorning(morningResult);
      await blockQuery.refetch();
      console.log("morning initialized...");

      toast.dismiss();
      toast.success("initialized morning");
    } catch (error) {
      console.error("Error initializing morning:", error);
      toast.dismiss();
      toast.error("Failed to initialize morning");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleIncrementIndex = async () => {
    const toSkip = 12 - Math.floor(deltaBlocks % 12);
    console.log("[handleIncrementIndex]: toSkip", toSkip);
    await skipBlocks(toSkip);
    invalidateField("all");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const d = await blockQuery.refetch();
    if (d.data) {
      setBlocknum(Number(d.data));
    }
    setMorning((draft) => {
      draft.index += 1;
      if (draft.index === 25) {
        draft.isMorning = false;
      }
    });
  };

  return (
    <MorningCard className="p-6 w-full justify-start">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl">Morning Auction</h2>
        {morning.isMorning && (
          <div className="flex flex-col gap-2">
            {infos.map((info) => {
              return (
                <div className="flex flex-row gap-2" key={info.label}>
                  <div className="pinto-sm text-pinto-secondary w-[200px]">{info.label}:</div>
                  <div className="pinto-sm-thin text-pinto-secondary">{info.value}</div>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="pinto-sm-thin text-pinto-secondary">
              Call sunrise & start the morning. Disables UI timers & all auto fetches
            </div>
            <Button onClick={() => handleFWDSeasonAndInitMorning(true)} disabled={isInitializing}>
              {isInitializing ? "Initializing..." : "Sunrise & Start Morning"}
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="pinto-sm-thin text-pinto-secondary">Call sunrise & start the morning. Key UI Only mode</div>
            <Button onClick={() => handleFWDSeasonAndInitMorning(false)} disabled={isInitializing}>
              {isInitializing ? "Initializing..." : "Start Morning UI only mode"}
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="pinto-sm-thin text-pinto-secondary">
              Increment morning index by 1 (12 blocks). Still WIP.
            </div>
            <Button onClick={handleIncrementIndex}>Increment index</Button>
          </div>
        </div>
      </div>
    </MorningCard>
  );
};

// Farmer Silo Deposits Component
function FarmerSiloDeposits() {
  const { address } = useAccount();
  const farmerSilo = useFarmerSilo();
  const { deposits } = farmerSilo;
  const tokenData = useTokenData();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Invalidate all queries
      await queryClient.invalidateQueries();
      toast.success("Refreshed farmer deposits data");
    } catch (error) {
      console.error("Error refreshing deposits:", error);
      toast.error("Failed to refresh deposits");
    } finally {
      setLoading(false);
    }
  };

  // Helper to format value
  const formatValue = (value) => {
    if (!value) return "0";
    return value.toHuman ? value.toHuman() : "0";
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl mb-4">Farmer Silo Deposits</h2>
      
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500">
          {address ? `Current account: ${address}` : "No account connected"}
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={loading || !address}
          className="px-4 py-2"
        >
          {loading ? "Refreshing..." : "Refresh Deposits"}
        </Button>
      </div>

      {!address ? (
        <div className="text-center py-8 text-gray-500">
          Connect your wallet to view deposits
        </div>
      ) : !deposits || deposits.size === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No deposits found for this account
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-5 gap-4 font-medium text-sm text-pinto-gray-4 p-2 border-b">
            <div>Token</div>
            <div>Amount</div>
            <div>BDV</div>
            <div>Stalk</div>
            <div>Seeds</div>
          </div>
          
          {Array.from(deposits.entries() || []).map(([token, depositData]) => (
            <div key={token.address} className="border-b pb-4">
              <div className="flex items-center gap-2 mb-2">
                <img src={token.logoURI} alt={token.symbol} className="w-6 h-6 rounded-full" />
                <span className="font-medium">{token.symbol}</span>
              </div>
              
              <div className="grid grid-cols-5 gap-4 text-sm">
                <div className="font-medium">Total:</div>
                <div className="font-mono">{formatValue(depositData.amount)}</div>
                <div>
                  <span className="font-semibold">
                    BDV:{" "}
                  </span>
                  <span className="font-mono">{depositData.currentBDV.toHuman()}</span>
                </div>
                <div className="font-mono">{formatValue(depositData.stalk?.total)}</div>
                <div className="font-mono">{formatValue(depositData.seeds)}</div>
              </div>
              
              {depositData.deposits && depositData.deposits.length > 0 ? (
                <div className="mt-4">
                  <div className="text-xs font-medium text-pinto-gray-4 mb-2">Individual Deposits:</div>
                  <div className="space-y-2 pl-4">
                    {depositData.deposits.map((deposit, i) => (
                      <div key={i} className="grid grid-cols-5 gap-4 text-xs text-pinto-gray-5">
                        <div className="font-mono">Stem: {deposit.stem.toString()}</div>
                        <div className="font-mono">{formatValue(deposit.amount)}</div>
                        <div>
                          <span className="font-semibold">
                            BDV:{" "}
                          </span>
                          <span className="font-mono">{deposit.currentBdv.toHuman()}</span>
                        </div>
                        <div className="font-mono">{formatValue(deposit.stalk?.base)}</div>
                        <div className="font-mono">{formatValue(deposit.seeds)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between font-medium mb-2">
              <span>Total Stalk:</span>
              <span className="font-mono">{formatValue(farmerSilo.activeStalkBalance)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Earned Beans:</span>
              <span className="font-mono">{formatValue(farmerSilo.earnedBeansBalance)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Seeds:</span>
              <span className="font-mono">{formatValue(farmerSilo.activeSeedsBalance)}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
