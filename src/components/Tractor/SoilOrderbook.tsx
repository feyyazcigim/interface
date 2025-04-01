import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { usePublicClient } from "wagmi";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { toast } from "sonner";
import { useEffect, useState, useCallback, useRef } from "react";
import { 
  OrderbookEntry, 
  loadOrderbookData, 
  decodeSowTractorData, 
  SowBlueprintData,
  getSowBlueprintDisplayData
} from "@/lib/Tractor/utils";
import { formatter } from "@/utils/format";
import { getChainToken } from "@/utils/token";
import { useChainId } from "wagmi";
import { TokenValue } from "@/classes/TokenValue";
import { PINTO } from "@/constants/tokens";
import IconImage from "@/components/ui/IconImage";

const BASESCAN_URL = "https://basescan.org/address/";

export function SoilOrderbook() {
  const [requisitions, setRequisitions] = useState<OrderbookEntry[]>([]);
  const [latestBlockInfo, setLatestBlockInfo] = useState<{ number: number; timestamp: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const protocolAddress = useProtocolAddress();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const isMounted = useRef(true);
  const loadAttempted = useRef(false);

  console.log("SoilOrderbook render - Dependencies:", {
    protocolAddress,
    publicClient: !!publicClient,
    latestBlockInfo,
    isLoading,
    requisitionsCount: requisitions.length,
    loadAttempted: loadAttempted.current
  });

  // Cleanup function to prevent state updates after unmount
  useEffect(() => {
    console.log("Setting up cleanup");
    return () => {
      console.log("Component unmounting, setting isMounted to false");
      isMounted.current = false;
    };
  }, []);

  // Get latest block info once when component loads
  useEffect(() => {
    const fetchLatestBlock = async () => {
      console.log("Fetching latest block...");
      if (!publicClient) {
        console.log("No publicClient available");
        return;
      }
      try {
        const latestBlock = await publicClient.getBlock();
        console.log("Got latest block:", {
          number: latestBlock.number,
          timestamp: latestBlock.timestamp
        });
        
        const blockInfo = {
          number: Number(latestBlock.number),
          timestamp: Number(latestBlock.timestamp) * 1000,
        };
        setLatestBlockInfo(blockInfo);
        console.log("Updated latestBlockInfo:", blockInfo);
      } catch (error) {
        console.error("Failed to fetch latest block:", error);
      }
    };
    fetchLatestBlock();
  }, [publicClient]);

  const getApproximateTimestamps = useCallback(
    (events: OrderbookEntry[]) => {
      console.log("Calculating timestamps for events:", {
        eventCount: events.length,
        latestBlockInfo
      });
      
      if (!latestBlockInfo || events.length === 0) return events;

      return events.map((event) => {
        const blockDiff = latestBlockInfo.number - event.blockNumber;
        const timestamp = latestBlockInfo.timestamp - blockDiff * 2000;
        return {
          ...event,
          timestamp,
        };
      });
    },
    [latestBlockInfo],
  );

  const loadAllRequisitions = useCallback(async () => {
    console.log("loadAllRequisitions called with state:", {
      isLoading,
      hasPublicClient: !!publicClient,
      hasProtocolAddress: !!protocolAddress,
      isMounted: isMounted.current,
      loadAttempted: loadAttempted.current
    });

    if (isLoading || !publicClient || !protocolAddress) {
      console.log("Skipping load - conditions not met:", {
        isLoading,
        hasPublicClient: !!publicClient,
        hasProtocolAddress: !!protocolAddress
      });
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("Starting to load orderbook data...");
      // Use the new loadOrderbookData function
      const orderbookData = await loadOrderbookData(
        undefined, 
        protocolAddress, 
        publicClient,
        latestBlockInfo ? { 
          number: BigInt(latestBlockInfo.number), 
          timestamp: BigInt(latestBlockInfo.timestamp / 1000) 
        } : undefined
      );

      console.log("Got orderbook data:", {
        dataCount: orderbookData.length,
        isMounted: isMounted.current
      });

      // Get approximate timestamps
      const dataWithTimestamps = getApproximateTimestamps(orderbookData);
      console.log("Added timestamps to data");

      // Sort by temperature
      const sortedData = dataWithTimestamps.sort((a, b) => {
        try {
          const dataA = decodeSowTractorData(a.requisition.blueprint.data);
          const dataB = decodeSowTractorData(b.requisition.blueprint.data);
          if (!dataA || !dataB) return 0;
          return parseFloat(dataA.minTempAsString) - parseFloat(dataB.minTempAsString);
        } catch (error) {
          console.error("Failed to decode data for requisition:", error);
          return 0;
        }
      });

      console.log("Setting requisitions state with sorted data");
      setRequisitions(sortedData);
      loadAttempted.current = true;
    } catch (error) {
      console.error("Failed to load soil orderbook:", error);
      toast.error("Failed to load soil orderbook");
    } finally {
      setIsLoading(false);
    }
  }, [protocolAddress, publicClient, latestBlockInfo, getApproximateTimestamps]);

  // Load requisitions once when component mounts and dependencies are ready
  useEffect(() => {
    console.log("Main effect running with state:", {
      protocolAddress,
      hasPublicClient: !!publicClient,
      latestBlockInfo,
      isLoading,
      isMounted: isMounted.current,
      loadAttempted: loadAttempted.current
    });

    if (protocolAddress && publicClient && latestBlockInfo && !isLoading && !loadAttempted.current) {
      console.log("All dependencies ready, calling loadAllRequisitions");
      loadAllRequisitions();
    } else {
      console.log("Dependencies not ready or already attempted:", {
        hasProtocolAddress: !!protocolAddress,
        hasPublicClient: !!publicClient,
        hasLatestBlockInfo: !!latestBlockInfo,
        isLoading,
        loadAttempted: loadAttempted.current
      });
    }
  }, [protocolAddress, publicClient, latestBlockInfo, loadAllRequisitions, isLoading]);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Created At</TableHead>
            <TableHead>Publisher</TableHead>
            <TableHead>Blueprint Hash</TableHead>
            <TableHead>Max Pinto</TableHead>
            <TableHead>Min Pinto</TableHead>
            <TableHead>Temperature</TableHead>
            <TableHead>Operator Tip</TableHead>
            <TableHead>Remaining Pinto to sow</TableHead>
            <TableHead>Available Pinto</TableHead>
            <TableHead>Currently Sowable</TableHead>
            <TableHead className="min-w-[300px]">Withdrawal Plan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:first-child]:border-t [&_tr:last-child]:border-b">
          {requisitions.map((req, index) => {
            let decodedData: SowBlueprintData | null = null;
            try {
              decodedData = decodeSowTractorData(req.requisition.blueprint.data);
            } catch (error) {
              console.error("Failed to decode data for requisition:", error);
            }

            const dateOptions: Intl.DateTimeFormatOptions = {
              year: "2-digit",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hourCycle: "h24",
            };

            // Get withdrawal plan details
            console.log("Withdrawal plan for order:", {
              hasWithdrawalPlan: !!req.withdrawalPlan,
              sourceTokens: req.withdrawalPlan?.sourceTokens,
              availableBeans: req.withdrawalPlan?.availableBeans
            });

            const withdrawalPlanDetails = req.withdrawalPlan ? (
              <div className="space-y-1">
                {req.withdrawalPlan?.sourceTokens?.map((token, i) => {
                  try {
                    const tokenInfo = getChainToken(chainId, token);
                    const amount = TokenValue.fromBlockchain(req.withdrawalPlan?.availableBeans[i] || 0n, 6);
                    const formattedAmount = formatter.number(amount);
                    return (
                      <div key={i} className="text-sm flex items-center gap-1">
                        <span className="flex items-center gap-1">
                          <IconImage src={tokenInfo.logoURI} size={4} />
                          {tokenInfo.symbol}:
                        </span>
                        {formattedAmount}
                        <span className="flex items-center gap-1">
                          <IconImage src={PINTO.logoURI} size={4} />
                        </span>
                      </div>
                    );
                  } catch (error) {
                    console.error("Error getting token info:", error);
                    // If we can't get the token info, show the address
                    const amount = TokenValue.fromBlockchain(req.withdrawalPlan?.availableBeans[i] || 0n, 6);
                    const formattedAmount = formatter.number(amount);
                    return (
                      <div key={i} className="text-sm flex items-center gap-1">
                        <span>{token.slice(0, 6)}...{token.slice(-4)}:</span>
                        {formattedAmount}
                        <span className="flex items-center gap-1">
                          <IconImage src={PINTO.logoURI} size={4} />
                        </span>
                      </div>
                    );
                  }
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No withdrawal plan</div>
            );

            console.log("Raw totalAvailablePinto:", req.totalAvailablePinto.toBigInt().toString());
            console.log("Formatted totalAvailablePinto:", formatter.number(req.totalAvailablePinto));

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
                <TableCell className="p-2 font-mono text-sm">
                  {decodedData ? `${decodedData.sowAmounts.totalAmountToSowAsString} PINTO` : "Failed to decode"}
                </TableCell>
                <TableCell className="p-2 font-mono text-sm">
                  {decodedData ? `${decodedData.sowAmounts.minAmountToSowPerSeasonAsString} PINTO` : "Failed to decode"}
                </TableCell>
                <TableCell className="p-2 font-mono text-sm">
                  {decodedData ? `${decodedData.minTempAsString}%` : "Failed to decode"}
                </TableCell>
                <TableCell className="p-2 font-mono text-sm">
                  {decodedData ? `${decodedData.operatorParams.operatorTipAmountAsString} PINTO` : "Failed to decode"}
                </TableCell>
                <TableCell className="p-2 font-mono text-sm">
                  {`${formatter.number(req.pintosLeftToSow)} PINTO`}
                </TableCell>
                <TableCell className="p-2 font-mono text-sm">
                  {`${formatter.number(req.totalAvailablePinto)} PINTO`}
                </TableCell>
                <TableCell className="p-2 font-mono text-sm">
                  {`${formatter.number(req.currentlySowable)} PINTO`}
                </TableCell>
                <TableCell className="p-2 min-w-[300px]">
                  {withdrawalPlanDetails}
                </TableCell>
              </TableRow>
            );
          })}
          {requisitions.length === 0 && (
            <TableRow>
              <TableCell colSpan={11} className="p-4 text-center text-gray-500">
                No active requisitions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
