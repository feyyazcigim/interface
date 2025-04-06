import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { usePublicClient } from "wagmi";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { toast } from "sonner";
import { useEffect, useState, useCallback } from "react";
import { RequisitionEvent, loadPublishedRequisitions, decodeSowTractorData } from "@/lib/Tractor/utils";
import { Button } from "@/components/ui/Button";
import { PlowDetails } from "./PlowDetails";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLatestBlock } from "@/hooks/useLatestBlock";
import { diamondABI } from "@/constants/abi/diamondABI";
import useTransaction from "@/hooks/useTransaction";
import { TokenValue } from "@/classes/TokenValue";
import { formatter } from "@/utils/format";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import TooltipSimple from "@/components/TooltipSimple";
import { usePriceData } from "@/state/usePriceData";
import useTokenData from "@/state/useTokenData";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { BASE_RPC_URL } from "@/utils/wagmi/chains";

const BASESCAN_URL = "https://basescan.org/address/";
const UINT256_MAX = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935");

// Create a client specifically for fetching Base network gas price
const baseGasClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL),
});

// Helper function to extract error message from error
const extractErrorMessage = (error: unknown): string => {
  if (!error) return "Unknown error";
  
  if (typeof error === 'object' && error !== null) {
    // Check for common error properties
    if ('message' in error && typeof error.message === 'string') {
      const message = error.message;
      
      // Extract the error message between "following reason:" and "Contract Call:"
      const reasonPattern = /following reason:\s*(.*?)(?:\s*\n\s*Contract Call:|$)/s;
      const reasonMatch = message.match(reasonPattern);
      
      if (reasonMatch && reasonMatch[1]) {
        return reasonMatch[1].trim();
      }
      
      // Fallback to simpler pattern
      const simpleMatch = message.match(/execution reverted: (.+?)(?:\n|$)/);
      if (simpleMatch && simpleMatch[1]) {
        return simpleMatch[1].trim();
      }
      
      return message;
    }
    
    if ('reason' in error && typeof (error as any).reason === 'string') {
      return (error as any).reason;
    }
  }
  
  return String(error);
};

// Helper function to format operator tip properly
const formatOperatorTip = (amount: bigint | undefined): string => {
  if (amount === undefined) return "Failed to decode";
  // Convert the bigint amount to a TokenValue with 6 decimals (PINTO)
  const tokenAmount = TokenValue.fromBlockchain(amount, 6);
  return `${formatter.number(tokenAmount)} PINTO`;
};


export function Plow() {
  const [selectedRequisition, setSelectedRequisition] = useState<RequisitionEvent | null>(null);
  const protocolAddress = useProtocolAddress();
  const publicClient = usePublicClient();
  const { data: latestBlock } = useLatestBlock();
  const queryClient = useQueryClient();
  const { tokenPrices } = usePriceData();
  const { nativeToken } = useTokenData();
  
  // Add state for gas estimates
  const [gasEstimates, setGasEstimates] = useState<Map<string, bigint>>(new Map());
  const [gasPrice, setGasPrice] = useState<bigint | null>(null);

  // Fetch gas price periodically
  useEffect(() => {
    const fetchGasPrice = async () => {
      try {
        // Use the baseGasClient to fetch gas price from Base network
        const price = await baseGasClient.getGasPrice();
        console.log("Current Base network gas price:", price.toString(), "wei");
        console.log("Current Base network gas price:", (Number(price) / 1e9).toFixed(2), "gwei");
        setGasPrice(price);
      } catch (error) {
        console.error("Failed to fetch gas price:", error);
      }
    };
    
    fetchGasPrice();
    const interval = setInterval(fetchGasPrice, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const { data: requisitions = [], isLoading } = useQuery({
    queryKey: ["requisitions", protocolAddress, latestBlock?.number],
    queryFn: async () => {
      console.log("Loading requisitions...");
      if (!publicClient || !protocolAddress) return [];

      const events = await loadPublishedRequisitions(undefined, protocolAddress, publicClient, latestBlock, "sowBlueprintv0");
      console.log("Loaded requisitions:", events);

      // Filter out requisitions with zero or negative tip
      const filteredEvents = events.filter(req => {
        if (!req.decodedData || !req.decodedData.operatorParams) return false;
        const tipAmount = req.decodedData.operatorParams.operatorTipAmount;
        return tipAmount > 0n;
      });
      console.log("Filtered requisitions (positive tips only):", filteredEvents.length);

      return filteredEvents;
    },
    enabled: !!protocolAddress && !!publicClient && !!latestBlock,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const handlePlow = useCallback((requisition: RequisitionEvent) => {
    setSelectedRequisition(requisition);
  }, []);

  // Add state for simulation loading
  const [simulatingReq, setSimulatingReq] = useState<string | null>(null);

  // Add state for tracking failed simulations
  const [failedSimulations, setFailedSimulations] = useState<Set<string>>(new Set());
  
  // Add state for tracking error messages for each failed simulation
  const [simulationErrors, setSimulationErrors] = useState<Map<string, string>>(new Map());

  // Add state for tracking successful simulations
  const [successfulSimulations, setSuccessfulSimulations] = useState<Set<string>>(new Set());

  // Add state for tracking if we're simulating all
  const [simulatingAll, setSimulatingAll] = useState(false);

  // Add state for tracking completed executions
  const [completedExecutions, setCompletedExecutions] = useState<Set<string>>(new Set());

  // Add state for tracking which requisition is being executed
  const [executingReq, setExecutingReq] = useState<string | null>(null);

  // Setup transaction handler
  const { writeWithEstimateGas, submitting, setSubmitting } = useTransaction({
    successMessage: "Plow successful",
    errorMessage: "Plow failed",
    successCallback: (receipt) => {
      if (!receipt?.transactionHash) return;
      // Add to completed executions
      setCompletedExecutions(prev => new Set(prev).add(receipt.transactionHash));
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["requisitions"] });
    },
  });

  // Add handler for simulating all requisitions
  const handleSimulateAll = useCallback(async () => {
    if (!protocolAddress || !publicClient || simulatingAll) return;
    setSimulatingAll(true);

    try {
      for (const req of requisitions) {
        setSimulatingReq(req.requisition.blueprintHash);
        // Clear previous states
        setFailedSimulations(prev => {
          const next = new Set(prev);
          next.delete(req.requisition.blueprintHash);
          return next;
        });
        setSuccessfulSimulations(prev => {
          const next = new Set(prev);
          next.delete(req.requisition.blueprintHash);
          return next;
        });
        setSimulationErrors(prev => {
          const next = new Map(prev);
          next.delete(req.requisition.blueprintHash);
          return next;
        });

        try {
          await publicClient.simulateContract({
            address: protocolAddress,
            abi: diamondABI,
            functionName: "tractor",
            args: [
              {
                blueprint: req.requisition.blueprint,
                blueprintHash: req.requisition.blueprintHash,
                signature: req.requisition.signature,
              },
              "0x",
            ] as const,
          });

          // Get gas estimate separately
          const gasEstimate = await publicClient.estimateContractGas({
            address: protocolAddress,
            abi: diamondABI,
            functionName: "tractor",
            args: [
              {
                blueprint: req.requisition.blueprint,
                blueprintHash: req.requisition.blueprintHash,
                signature: req.requisition.signature,
              },
              "0x",
            ] as const,
          });

          // Debug log
          console.log(`Gas estimate for ${req.requisition.blueprintHash}:`, gasEstimate.toString());

          // Store gas estimate
          setGasEstimates(prev => {
            const next = new Map(prev);
            next.set(req.requisition.blueprintHash, gasEstimate);
            return next;
          });

          console.log(`Simulation successful for ${req.requisition.blueprintHash}`);
          setSuccessfulSimulations(prev => new Set(prev).add(req.requisition.blueprintHash));
        } catch (error) {
          console.error(`Simulation failed for ${req.requisition.blueprintHash}:`, error);
          setFailedSimulations(prev => new Set(prev).add(req.requisition.blueprintHash));
          
          // Store the error message
          const errorMsg = extractErrorMessage(error);
          setSimulationErrors(prev => {
            const next = new Map(prev);
            next.set(req.requisition.blueprintHash, errorMsg);
            return next;
          });
        }
        setSimulatingReq(null);
      }
      toast.success("Completed simulating all requisitions");
    } catch (error) {
      console.error("Failed during simulate all:", error);
      toast.error("Failed to simulate all requisitions");
    } finally {
      setSimulatingAll(false);
    }
  }, [protocolAddress, publicClient, requisitions]);

  // Update handleSimulate function to include gas estimation
  const handleSimulate = useCallback(async (req: RequisitionEvent) => {
    if (!protocolAddress || !publicClient) return;
    setSimulatingReq(req.requisition.blueprintHash);
    // Clear previous states
    setFailedSimulations(prev => {
      const next = new Set(prev);
      next.delete(req.requisition.blueprintHash);
      return next;
    });
    setSuccessfulSimulations(prev => {
      const next = new Set(prev);
      next.delete(req.requisition.blueprintHash);
      return next;
    });
    setSimulationErrors(prev => {
      const next = new Map(prev);
      next.delete(req.requisition.blueprintHash);
      return next;
    });
    setGasEstimates(prev => {
      const next = new Map(prev);
      next.delete(req.requisition.blueprintHash);
      return next;
    });

    try {
      const result = await publicClient.simulateContract({
        address: protocolAddress,
        abi: diamondABI,
        functionName: "tractor",
        args: [
          {
            blueprint: req.requisition.blueprint,
            blueprintHash: req.requisition.blueprintHash,
            signature: req.requisition.signature,
          },
          "0x",
        ] as const,
      });

      // Get gas estimate separately
      const gasEstimate = await publicClient.estimateContractGas({
        address: protocolAddress,
        abi: diamondABI,
        functionName: "tractor",
        args: [
          {
            blueprint: req.requisition.blueprint,
            blueprintHash: req.requisition.blueprintHash,
            signature: req.requisition.signature,
          },
          "0x",
        ] as const,
      });

      // Debug log
      console.log("Gas estimate:", gasEstimate.toString());

      // Store gas estimate
      setGasEstimates(prev => {
        const next = new Map(prev);
        next.set(req.requisition.blueprintHash, gasEstimate);
        return next;
      });

      toast.success("Simulation successful");
      setSuccessfulSimulations(prev => new Set(prev).add(req.requisition.blueprintHash));
    } catch (error) {
      console.error("Simulation failed:", error);
      toast.error(`Simulation failed: ${extractErrorMessage(error)}`);
      setFailedSimulations(prev => new Set(prev).add(req.requisition.blueprintHash));
      
      // Store the error message
      const errorMsg = extractErrorMessage(error);
      setSimulationErrors(prev => {
        const next = new Map(prev);
        next.set(req.requisition.blueprintHash, errorMsg);
        return next;
      });
    } finally {
      setSimulatingReq(null);
    }
  }, [protocolAddress, publicClient]);

  // Add execute handler
  const handleExecute = useCallback(async (req: RequisitionEvent) => {
    if (!protocolAddress) return;
    setExecutingReq(req.requisition.blueprintHash);
    setSubmitting(true);

    try {
      await writeWithEstimateGas({
        address: protocolAddress,
        abi: diamondABI,
        functionName: "tractor",
        args: [
          {
            blueprint: req.requisition.blueprint,
            blueprintHash: req.requisition.blueprintHash,
            signature: req.requisition.signature,
          },
          "0x",
        ] as const,
      });
    } catch (error) {
      console.error("Failed to execute plow:", error);
    } finally {
      setExecutingReq(null);
      setSubmitting(false);
    }
  }, [protocolAddress, writeWithEstimateGas, setSubmitting]);

  if (isLoading) {
    return <div>Loading requisitions...</div>;
  }

  // Rest of the component is identical to SoilOrderbook
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-pinto-gray-3/20">
            <TableHead className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4">Created At</TableHead>
            <TableHead className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4">Publisher</TableHead>
            <TableHead className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4">Blueprint Hash</TableHead>
            <TableHead className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4">Type</TableHead>
            <TableHead className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4">Operator Tip</TableHead>
            <TableHead className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4 min-w-[200px]">
              <div className="flex flex-col gap-2">
                <span>Simulate</span>
                <div className="text-xs text-pinto-gray-4">
                  {(() => {
                    if (!gasPrice) return "Loading gas price...";
                    return `Gas Price: ${(Number(gasPrice) / 1e9).toFixed(6)} gwei`;
                  })()}
                </div>
              </div>
            </TableHead>
            <TableHead className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:first-child]:border-t [&_tr:last-child]:border-b">
          {/* Rest of the JSX is identical to SoilOrderbook */}
          {requisitions.map((req, index) => {
            const dateOptions: Intl.DateTimeFormatOptions = {
              year: "2-digit",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hourCycle: "h24",
            };

            return (
              <TableRow key={index} className="h-[4.5rem] bg-transparent items-center hover:bg-pinto-green-1/50">
                <TableCell className="p-2">
                  {req.timestamp ? new Date(req.timestamp).toLocaleString(undefined, dateOptions) : "Unknown"}
                </TableCell>
                <TableCell className="p-2 font-mono text-sm">
                  <a
                    href={`${BASESCAN_URL}${req.requisition.blueprint.publisher}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pinto-green-4 hover:text-pinto-green-5 hover:underline"
                  >
                    {`${req.requisition.blueprint.publisher.slice(0, 6)}...${req.requisition.blueprint.publisher.slice(-4)}`}
                  </a>
                </TableCell>
                <TableCell className="p-2 font-mono text-sm">
                  {`${req.requisition.blueprintHash.slice(0, 6)}...${req.requisition.blueprintHash.slice(-4)}`}
                </TableCell>
                <TableCell className="p-2 font-mono text-sm">{req.requisitionType}</TableCell>
                <TableCell className="p-2 font-mono text-sm">
                  {req.decodedData ? formatOperatorTip(req.decodedData.operatorParams.operatorTipAmount) : "Failed to decode"}
                </TableCell>
                <TableCell className="p-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (successfulSimulations.has(req.requisition.blueprintHash)) {
                          handleExecute(req);
                        } else {
                          handleSimulate(req);
                        }
                      }}
                      disabled={
                        simulatingReq === req.requisition.blueprintHash || 
                        failedSimulations.has(req.requisition.blueprintHash) ||
                        executingReq === req.requisition.blueprintHash ||
                        completedExecutions.has(req.requisition.blueprintHash)
                      }
                      className={`
                        ${successfulSimulations.has(req.requisition.blueprintHash) && !completedExecutions.has(req.requisition.blueprintHash)
                          ? 'bg-pinto-green-4 text-white hover:bg-pinto-green-5' 
                          : completedExecutions.has(req.requisition.blueprintHash)
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'text-pinto-gray-4 hover:text-pinto-gray-5'
                        } 
                        ${failedSimulations.has(req.requisition.blueprintHash) ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {simulatingReq === req.requisition.blueprintHash 
                        ? "Simulating..." 
                        : executingReq === req.requisition.blueprintHash
                          ? "Executing..."
                          : failedSimulations.has(req.requisition.blueprintHash)
                            ? "Reverted"
                            : completedExecutions.has(req.requisition.blueprintHash)
                              ? "Plowed"
                              : successfulSimulations.has(req.requisition.blueprintHash)
                                ? "Execute"
                                : "Simulate"
                      }
                    </Button>
                    {successfulSimulations.has(req.requisition.blueprintHash) && (
                      <div className="flex items-center text-pinto-gray-4 flex-1 min-w-0">
                        <div className="inline-flex items-center gap-1 text-xs">
                          Est. Gas: {(() => {
                            const gas = gasEstimates.get(req.requisition.blueprintHash);
                            if (!gas) return "0";
                            
                            // Get ETH price in USD
                            const ethPrice = tokenPrices.get(nativeToken)?.instant;
                            if (!ethPrice) return formatter.number(gas.toString());
                            
                            // Use current gas price from network, fallback to 1 gwei if not available
                            const currentGasPrice = gasPrice || BigInt(1_000_000_000);
                            
                            // Debug log the values
                            console.log("Gas estimate:", gas.toString());
                            console.log("Gas price:", currentGasPrice.toString());
                            console.log("ETH price:", ethPrice.toString());
                            
                            // Calculate gas cost in wei, then convert to USD
                            const gasCostInWei = gas * currentGasPrice;
                            // Convert wei to ETH (as a number) for calculation and display
                            const gasCostInEth = Number(gasCostInWei) / 1e18;
                            // Convert ETH price from its stored format (with 6 decimals) to actual USD
                            const ethPriceInUsd = Number(ethPrice.toString()) / 1e6;
                            // Calculate USD directly from ETH amount
                            const gasCostInUsd = gasCostInEth * ethPriceInUsd;
                            
                            console.log("Gas cost in Wei:", gasCostInWei.toString());
                            console.log("Gas cost in ETH:", gasCostInEth.toFixed(18));
                            console.log("ETH price in USD:", ethPriceInUsd.toFixed(2));
                            console.log("Gas cost in USD:", gasCostInUsd.toFixed(6));
                            
                            return `${formatter.number(gas.toString())} ($${gasCostInUsd.toFixed(6)})`;
                          })()}
                        </div>
                      </div>
                    )}
                    {failedSimulations.has(req.requisition.blueprintHash) && simulationErrors.get(req.requisition.blueprintHash) && (
                      <div className="flex items-center text-pinto-red-4 flex-1 min-w-0">
                        <TooltipSimple
                          content={simulationErrors.get(req.requisition.blueprintHash) || "Unknown error"}
                          variant="gray"
                        >
                          <div className="inline-flex items-center gap-1 text-xs text-pinto-red-4 max-w-full">
                            <InfoCircledIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{simulationErrors.get(req.requisition.blueprintHash)}</span>
                          </div>
                        </TooltipSimple>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlow(req)}
                    className="text-pinto-gray-4 hover:text-pinto-gray-5"
                  >
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {requisitions.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="p-4 text-center text-gray-500">
                No active requisitions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <PlowDetails
        requisition={selectedRequisition}
        isOpen={selectedRequisition !== null}
        onClose={() => setSelectedRequisition(null)}
      />
      
      <div className="mt-6 py-4 flex justify-between items-center">
        <div className="text-sm font-antarctica font-light text-pinto-gray-4">
          Select Soil Orders to Simulate and Execute for a tip
        </div>
        <div className="flex gap-4">
          <Button
            variant="gradient"
            onClick={handleSimulateAll}
            disabled={simulatingAll || requisitions.length === 0}
            size="xxl"
            rounded="full"
          >
            {simulatingAll ? "Simulating All..." : "Simulate all transactions"}
          </Button>
          
          {/* You can add additional buttons like "Simulate 2 Transactions" or "Execute 2 Soil Orders" here later */}
        </div>
      </div>
    </div>
  );
}
