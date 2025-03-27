import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { useAccount } from "wagmi";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { loadPublishedRequisitions, fetchTractorExecutions, RequisitionEvent, decodeSowTractorData } from "@/lib/Tractor/utils";
import { TokenValue } from "@/classes/TokenValue";
import { Button } from "@/components/ui/Button";
import { formatter } from "@/utils/format";
import { Skeleton } from "@/components/ui/Skeleton";
import Text from "@/components/ui/Text";
import TooltipSimple from "@/components/TooltipSimple";
import ReviewTractorOrderDialog from "@/components/ReviewTractorOrderDialog";
import { createRequisition } from "@/lib/Tractor";
import { Blueprint } from "@/lib/Tractor/types";
import { decodeFunctionData } from "viem";
import { beanstalkAbi } from "@/generated/contractHooks";
import { sowBlueprintv0ABI } from "@/constants/abi/SowBlueprintv0ABI";

type ExecutionData = Awaited<ReturnType<typeof fetchTractorExecutions>>[number];

const TractorOrdersPanel = () => {
  const { address } = useAccount();
  const protocolAddress = useProtocolAddress();
  const publicClient = usePublicClient();
  const [loading, setLoading] = useState(true);
  const [requisitions, setRequisitions] = useState<RequisitionEvent[]>([]);
  const [executions, setExecutions] = useState<ExecutionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // State for the dialog
  const [selectedOrder, setSelectedOrder] = useState<RequisitionEvent | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [rawSowBlueprintCall, setRawSowBlueprintCall] = useState<`0x${string}` | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!address || !protocolAddress || !publicClient) {
        setRequisitions([]);
        setExecutions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch published requisitions, filtered to sowBlueprintv0 type
        const latestBlock = await publicClient.getBlock({ blockTag: 'latest' });
        const userRequisitions = await loadPublishedRequisitions(
          address,
          protocolAddress,
          publicClient,
          { number: latestBlock.number, timestamp: latestBlock.timestamp },
          "sowBlueprintv0"  // Only get sow blueprint requisitions
        );
        
        // Filter out cancelled requisitions
        const activeRequisitions = userRequisitions.filter(req => !req.isCancelled);
        
        // Fetch executions
        const userExecutions = await fetchTractorExecutions(
          publicClient,
          protocolAddress,
          address
        );
        
        setRequisitions(activeRequisitions);
        setExecutions(userExecutions);
      } catch (err) {
        console.error("Failed to load tractor orders:", err);
        setError("Failed to load tractor orders");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address, protocolAddress, publicClient]);

  // Extract the sowBlueprintv0 call from the advancedFarm call
  const extractSowBlueprintCall = (data: `0x${string}`): `0x${string}` | null => {
    try {
      // Step 1: Decode as advancedFarm
      const advancedFarmDecoded = decodeFunctionData({
        abi: beanstalkAbi,
        data: data,
      });
      
      if (advancedFarmDecoded.functionName === "advancedFarm" && advancedFarmDecoded.args[0]) {
        const farmCalls = advancedFarmDecoded.args[0] as { callData: `0x${string}`; clipboard: `0x${string}` }[];
        
        if (farmCalls.length > 0) {
          // Step 2: Decode the inner call as advancedPipe
          const pipeCallData = farmCalls[0].callData;
          const advancedPipeDecoded = decodeFunctionData({
            abi: beanstalkAbi,
            data: pipeCallData,
          });
          
          if (advancedPipeDecoded.functionName === "advancedPipe" && advancedPipeDecoded.args[0]) {
            const pipeCalls = advancedPipeDecoded.args[0] as { 
              target: `0x${string}`; 
              callData: `0x${string}`; 
              clipboard: `0x${string}` 
            }[];
            
            if (pipeCalls.length > 0) {
              // Step 3: Get the sowBlueprintv0 call data
              return pipeCalls[0].callData;
            }
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to extract sowBlueprintv0 call:", error);
      return null;
    }
  };

  const handleOrderClick = (req: RequisitionEvent) => {
    setSelectedOrder(req);
    
    // Extract the raw sowBlueprintv0 call data if available
    try {
      // Use the existing function to extract the sowBlueprintv0 call from the advancedFarm call
      const sowCall = extractSowBlueprintCall(req.requisition.blueprint.data);
      console.log("Extracted sowCall:", sowCall);
      setRawSowBlueprintCall(sowCall);
    } catch (error) {
      console.error("Failed to extract sowBlueprintv0 call data:", error);
      setRawSowBlueprintCall(null);
    }
    
    setShowDialog(true);
  };

  // Convert the blueprint to match the expected Blueprint type (fixing readonly issue)
  const adaptBlueprintForDialog = (blueprint: RequisitionEvent["requisition"]["blueprint"]): Blueprint => {
    return {
      ...blueprint,
      operatorPasteInstrs: [...blueprint.operatorPasteInstrs] // Create a mutable copy
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <div>Loading Tractor Orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <div>Error loading tractor orders</div>
        <div className="p-4 rounded-[1rem] border border-pinto-red-2 bg-white text-pinto-red-2">
          {error}
        </div>
      </div>
    );
  }

  if (requisitions.length === 0 && executions.length === 0) {
    return null; // Don't show the component if there are no active orders
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      
      {requisitions.map((req, index) => {
        if (req.requisitionType !== "sowBlueprintv0" || !req.decodedData) return null;
        
        const data = req.decodedData;
        const totalAmount = TokenValue.fromHuman(data.sowAmounts.totalAmountToSow, 6);
        const minTemp = TokenValue.fromHuman(data.minTemp, 6);
        
        // Get executions for this blueprint
        const blueprintExecutions = executions.filter(
          exec => exec.blueprintHash === req.requisition.blueprintHash
        );
        
        // Count how many times this blueprint has been executed
        const executionCount = blueprintExecutions.length;
        
        // Calculate total PINTO sown so far for this blueprint
        const totalSown = blueprintExecutions.reduce((acc, exec) => {
          if (exec.sowEvent) {
            return acc.add(TokenValue.fromBlockchain(exec.sowEvent.beans, 6));
          }
          return acc;
        }, TokenValue.ZERO);
        
        // Calculate percentage completion
        const percentComplete = totalAmount.gt(0) 
          ? totalSown.div(totalAmount).mul(100)
          : TokenValue.ZERO;
        
        // Get percentage as number for display
        const percentCompleteNumber = Math.min(
          percentComplete.toHuman ? Number(percentComplete.toHuman()) : 0, 
          100
        );
        
        const isComplete = percentComplete.gte(100);
        
        // Find latest execution for this blueprint
        const latestExecution = blueprintExecutions.length > 0
          ? blueprintExecutions.sort((a, b) => b.blockNumber - a.blockNumber)[0]
          : null;

        // Determine token strategy based on sourceTokenIndices
        let strategyText = "Unknown strategy";
        if (data.sourceTokenIndices.includes(255)) {
          strategyText = "Lowest Seeds";
        } else if (data.sourceTokenIndices.includes(254)) {
          strategyText = "Lowest Price";
        } else {
          strategyText = "Specific Token";
        }

        return (
          <div 
            key={`requisition-${index}`} 
            className={`p-4 rounded-[1rem] border ${isComplete ? 'border-pinto-green-4 bg-pinto-green-1' : 'border-pinto-gray-2 bg-pinto-off-white'} cursor-pointer hover:shadow-md transition-shadow`}
            onClick={() => handleOrderClick(req)}
          >
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="bg-pinto-green-4 text-white px-4 py-1 rounded-full">Sow</div>
                  <div className="flex items-center ml-2">
                    <span className="ml-1">{formatter.number(totalAmount)} PINTO</span>
                  </div>
                </div>
                <div className="text-pinto-gray-4 text-sm">
                  Run count: {executionCount}
                </div>
              </div>
              
              {/* Progress section */}
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-pinto-gray-4">Progress</span>
                  <span className="text-xs text-pinto-gray-4">
                    {formatter.number(totalSown)} / {formatter.number(totalAmount)} PINTO sown ({Math.round(percentCompleteNumber)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-pinto-green-4 h-2 rounded-full" 
                    style={{ width: `${percentCompleteNumber}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Token strategy indicator */}
              <div className="text-pinto-gray-4 flex gap-1 items-center">
                <span className="text-xs bg-pinto-green-1 text-pinto-green-4 px-2 py-1 rounded-md">
                  Strategy: {strategyText}
                </span>
              </div>
              
              <div className="text-pinto-gray-4 flex gap-1 items-center">
                Execute only when I can sow at least {formatter.number(TokenValue.fromHuman(data.sowAmounts.minAmountToSowPerSeason, 6))}
              </div>
              
              <div className="text-pinto-gray-4">
                Execute only Temperature is at least {formatPercentage(minTemp)}
              </div>

              {/* Add podline length condition */}
              <div className="text-pinto-gray-4">
                Execute only when Pod Line Length ≤ {formatter.number(TokenValue.fromHuman(data.maxPodlineLength, 6))}
              </div>
              
              {latestExecution && latestExecution.sowEvent && (
                <div className="mt-2 p-2 bg-white rounded-lg border border-pinto-gray-2">
                  <div className="text-xs text-pinto-gray-4">Last execution:</div>
                  <div className="flex justify-between">
                    <span>Sowed {formatter.number(TokenValue.fromBlockchain(latestExecution.sowEvent.beans, 6))} PINTO</span>
                    <span>Got {formatter.number(TokenValue.fromBlockchain(latestExecution.sowEvent.pods, 6))} Pods</span>
                  </div>
                </div>
              )}
              
              {isComplete && (
                <div className="mt-2 p-2 bg-pinto-green-1 rounded-lg border border-pinto-green-4 text-pinto-green-4 text-center font-medium">
                  Order Completed!
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Dialog for order details */}
      {selectedOrder && selectedOrder.decodedData && (
        <ReviewTractorOrderDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          orderData={{
            totalAmount: selectedOrder.decodedData.sowAmounts.totalAmountToSow,
            temperature: TokenValue.fromHuman(selectedOrder.decodedData.minTemp, 6).mul(100).toHuman(),
            podLineLength: selectedOrder.decodedData.maxPodlineLength,
            minSoil: selectedOrder.decodedData.sowAmounts.minAmountToSowPerSeason,
            operatorTip: selectedOrder.decodedData.operatorParams.operatorTipAmount,
            tokenStrategy: (() => {
              if (selectedOrder.decodedData?.sourceTokenIndices.includes(255)) {
                return "LOWEST_SEEDS";
              } else if (selectedOrder.decodedData?.sourceTokenIndices.includes(254)) {
                return "LOWEST_PRICE";
              } else {
                return "SPECIFIC_TOKEN";
              }
            })()
          }}
          encodedData={rawSowBlueprintCall || selectedOrder.requisition.blueprint.data}
          operatorPasteInstrs={[...selectedOrder.requisition.blueprint.operatorPasteInstrs]} // Create a mutable copy
          blueprint={adaptBlueprintForDialog(selectedOrder.requisition.blueprint)}
          isViewOnly={true}
          executionHistory={executions.filter(exec => exec.blueprintHash === selectedOrder.requisition.blueprintHash)}
        />
      )}
    </div>
  );
};

// Helper function for formatting percentage since formatter.percentage doesn't exist
function formatPercentage(value: TokenValue): string {
  return `${value.mul(100).toHuman()}%`;
}

export default TractorOrdersPanel; 