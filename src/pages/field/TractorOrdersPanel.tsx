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
import IconImage from "@/components/ui/IconImage";
import pintoIcon from "@/assets/tokens/PINTO.png";
import { CornerBottomLeftIcon } from "@radix-ui/react-icons";
import { getTokenNameByIndex } from "@/utils/token";

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
        const totalAmount = TokenValue.fromBlockchain(data.sowAmounts.totalAmountToSow, 6);
        const minTemp = TokenValue.fromBlockchain(data.minTemp, 6);
        
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
            className="box-border flex flex-col p-4 gap-2 bg-white border border-pinto-gray-2 rounded-[24px] cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleOrderClick(req)}
          >
            <div className="flex flex-col gap-2 w-full">
              {/* Header row with all the pills and labels */}
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-0">
                  {/* Withdraw pill */}
                  <div className="flex items-center px-2 py-1 bg-pinto-green-4 rounded-xl">
                    <span className="text-white text-sm font-antarctica font-normal whitespace-nowrap">Withdraw</span>
                  </div>
                  {/* Divider */}
                  <div className="border-t-2 border-pinto-gray-2 w-6 flex-shrink-0"></div>
                  {/* From label */}
                  <div className="bg-[#F8F8F8] px-2 py-1 rounded-xl">
                    <span className="text-pinto-gray-4 text-sm font-antarctica font-thin whitespace-nowrap">from Deposited Tokens</span>
                  </div>
                  {/* Divider */}
                  <div className="border-t-2 border-pinto-gray-2 w-6 flex-shrink-0"></div>
                  {/* With best */}
                  <div className="bg-[#F8F8F8] px-2 py-1 rounded-xl">
                    <div className="flex items-center gap-1">
                      <span className="text-pinto-gray-4 text-sm font-antarctica font-thin whitespace-nowrap">
                        {data.sourceTokenIndices.includes(255) 
                          ? "with Lowest" 
                          : data.sourceTokenIndices.includes(254) 
                            ? "with Best" 
                            : "with Specific"}
                      </span>
                      <IconImage src={pintoIcon} size={4} />
                      <span className="text-black text-sm font-antarctica font-thin whitespace-nowrap overflow-hidden text-ellipsis">
                        {getTokenNameByIndex(data.sourceTokenIndices[0])}
                      </span>
                    </div>
                  </div>
                  {/* Divider */}
                  <div className="border-t-2 border-pinto-gray-2 w-6 flex-shrink-0"></div>
                  {/* Sow pill */}
                  <div className="flex items-center px-2 py-1 bg-pinto-green-4 rounded-xl">
                    <span className="text-white text-sm font-antarctica font-normal whitespace-nowrap">Sow</span>
                  </div>
                  {/* Divider */}
                  <div className="border-t-2 border-pinto-gray-2 w-6 flex-shrink-0"></div>
                  {/* Up to */}
                  <div className="bg-[#F8F8F8] px-2 py-1 rounded-xl">
                    <div className="flex items-center gap-1">
                      <span className="text-pinto-gray-4 text-sm font-antarctica font-thin whitespace-nowrap">up to</span>
                      <IconImage src={pintoIcon} size={4} />
                      <span className="text-pinto-green-4 text-sm font-antarctica font-thin whitespace-nowrap overflow-hidden text-ellipsis">{formatter.number(totalAmount)} PINTO</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-pinto-gray-4 text-sm font-antarctica whitespace-nowrap">Operator Tip:</span>
                  <div className="bg-[#F8F8F8] px-2 py-1 rounded-xl flex items-center gap-1">
                    <IconImage src={pintoIcon} size={4} />
                    <span className="text-pinto-green-4 text-sm font-antarctica font-thin whitespace-nowrap overflow-hidden text-ellipsis">{formatter.number(TokenValue.fromBlockchain(data.operatorParams.operatorTipAmount, 6))} PINTO</span>
                  </div>
                </div>
              </div>
              
              {/* Execution conditions */}
              <div className="flex justify-between items-end w-full">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center pl-6 gap-2">
                    <CornerBottomLeftIcon
                      className="h-4 w-4 text-pinto-gray-4"
                    />
                    <span className="text-pinto-gray-4 text-sm font-menlo font-thin whitespace-nowrap overflow-hidden text-ellipsis">Execute when Temperature is at least {formatPercentage(data.minTemp)}</span>
                  </div>
                  <div className="flex items-center pl-6 gap-2">
                    <CornerBottomLeftIcon
                      className="h-4 w-4 text-pinto-gray-4"
                    />
                    <span className="text-pinto-gray-4 text-sm font-menlo whitespace-nowrap overflow-hidden text-ellipsis">AND when Pod Line Length is at most {formatter.number(TokenValue.fromHuman(data.maxPodlineLengthAsString, 6))}</span>
                  </div>
                  <div className="flex items-center pl-6 gap-2">
                    <CornerBottomLeftIcon
                      className="h-4 w-4 text-pinto-gray-4"
                    />
                    <span className="text-pinto-gray-4 text-sm font-menlo whitespace-nowrap overflow-hidden text-ellipsis">AND when Available Soil is at least {data.sowAmounts.minAmountToSowPerSeasonAsString}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <IconImage src={pintoIcon} size={4} />
                  <span className="text-pinto-gray-4 text-sm font-antarctica whitespace-nowrap overflow-hidden text-ellipsis">PINTO Sown through this Order: {formatter.number(totalSown)}/{formatter.number(totalAmount)}</span>
                </div>
              </div>
              
              {/* Progress bar - only show if not at the bottom of conditions */}
              {!isComplete && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-pinto-green-4 h-2 rounded-full" 
                    style={{ width: `${percentCompleteNumber}%` }}
                  ></div>
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
            totalAmount: selectedOrder.decodedData.sowAmounts.totalAmountToSowAsString,
            temperature: selectedOrder.decodedData.minTempAsString,
            podLineLength: selectedOrder.decodedData.maxPodlineLengthAsString,
            minSoil: selectedOrder.decodedData.sowAmounts.minAmountToSowPerSeasonAsString,
            operatorTip: selectedOrder.decodedData.operatorParams.operatorTipAmountAsString,
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
          operatorPasteInstrs={[...selectedOrder.requisition.blueprint.operatorPasteInstrs]}
          blueprint={adaptBlueprintForDialog(selectedOrder.requisition.blueprint)}
          isViewOnly={true}
          executionHistory={executions.filter(exec => exec.blueprintHash === selectedOrder.requisition.blueprintHash)}
        />
      )}
    </div>
  );
};

// Helper function for formatting percentage since formatter.percentage doesn't exist
function formatPercentage(value: bigint): string {
  return `${(Number(value) / 1e6).toFixed(2)}%`;
}

export default TractorOrdersPanel; 