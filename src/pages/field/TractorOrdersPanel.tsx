import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { useAccount } from "wagmi";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { loadPublishedRequisitions, fetchTractorExecutions, RequisitionEvent } from "@/lib/Tractor/utils";
import { TokenValue } from "@/classes/TokenValue";
import { Button } from "@/components/ui/Button";
import { formatter } from "@/utils/format";
import { Skeleton } from "@/components/ui/Skeleton";
import Text from "@/components/ui/Text";
import TooltipSimple from "@/components/TooltipSimple";

type ExecutionData = Awaited<ReturnType<typeof fetchTractorExecutions>>[number];

const TractorOrdersPanel = () => {
  const { address } = useAccount();
  const protocolAddress = useProtocolAddress();
  const publicClient = usePublicClient();
  const [loading, setLoading] = useState(true);
  const [requisitions, setRequisitions] = useState<RequisitionEvent[]>([]);
  const [executions, setExecutions] = useState<ExecutionData[]>([]);
  const [error, setError] = useState<string | null>(null);

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
        
        // Fetch published requisitions
        const latestBlock = await publicClient.getBlock({ blockTag: 'latest' });
        const userRequisitions = await loadPublishedRequisitions(
          address,
          protocolAddress,
          publicClient,
          { number: latestBlock.number, timestamp: latestBlock.timestamp }
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
        
        // Count how many times this blueprint has been executed
        const executionCount = executions.filter(
          exec => exec.blueprintHash === req.requisition.blueprintHash
        ).length;
        
        // Find latest execution for this blueprint
        const latestExecution = executions
          .filter(exec => exec.blueprintHash === req.requisition.blueprintHash)
          .sort((a, b) => b.blockNumber - a.blockNumber)[0];

        return (
          <div 
            key={`requisition-${index}`} 
            className="p-4 rounded-[1rem] border border-pinto-gray-2 bg-pinto-off-white"
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
              
              <div className="text-pinto-gray-4 flex gap-1 items-center">
                Execute only when I can sow at least {formatter.number(TokenValue.fromHuman(data.sowAmounts.minAmountToSowPerSeason, 6))}
              </div>
              
              <div className="text-pinto-gray-4">
                Execute only Temperature is at least {formatPercentage(minTemp)}
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
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Helper function for formatting percentage since formatter.percentage doesn't exist
function formatPercentage(value: TokenValue): string {
  return `${value.mul(100).toHuman()}%`;
}

export default TractorOrdersPanel; 