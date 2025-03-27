import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { CornerBottomLeftIcon } from "@radix-ui/react-icons";
import { useAccount } from "wagmi";
import { createRequisition, useSignRequisition } from "@/lib/Tractor";
import { useGetBlueprintHash } from "@/lib/Tractor/blueprint";
import { toast } from "sonner";
import { useState } from "react";
import { Blueprint } from "@/lib/Tractor/types";
import { HighlightedCallData } from "./Tractor/HighlightedCallData";
import { Switch } from "./ui/Switch";
import useTransaction from "@/hooks/useTransaction";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { diamondABI } from "@/constants/abi/diamondABI";
import { TokenValue } from "@/classes/TokenValue";
import { formatter } from "@/utils/format";
import { format } from "date-fns";

// Define the execution data type
export interface ExecutionData {
  blockNumber: number;
  operator: `0x${string}`;
  publisher: `0x${string}`;
  blueprintHash: `0x${string}`;
  transactionHash: `0x${string}`;
  timestamp?: number;
  sowEvent?: {
    account: `0x${string}`;
    fieldId: bigint;
    index: bigint;
    beans: bigint;
    pods: bigint;
  };
}

interface ReviewTractorOrderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  orderData: {
    totalAmount: string;
    temperature: string;
    podLineLength: string;
    minSoil: string;
    operatorTip: string;
  };
  encodedData: `0x${string}`;
  operatorPasteInstrs: `0x${string}`[];
  blueprint: Blueprint;
  isViewOnly?: boolean;
  executionHistory?: ExecutionData[]; // Add execution history
}

export default function ReviewTractorOrderDialog({
  open,
  onOpenChange,
  onSuccess,
  orderData,
  encodedData,
  operatorPasteInstrs,
  blueprint,
  isViewOnly = false,
  executionHistory = [], // Default to empty array
}: ReviewTractorOrderProps) {
  const { address } = useAccount();
  const signRequisition = useSignRequisition();
  const [signing, setSigning] = useState(false);
  const { data: blueprintHash } = useGetBlueprintHash(blueprint);
  const [activeTab, setActiveTab] = useState<"order" | "blueprint" | "executions">("order");
  const [decodeAbi, setDecodeAbi] = useState(false);
  const [signedRequisitionData, setSignedRequisitionData] = useState<any>(null);
  const protocolAddress = useProtocolAddress();

  const { writeWithEstimateGas, submitting, setSubmitting } = useTransaction({
    successMessage: "Order published successfully",
    errorMessage: "Failed to publish order",
    successCallback: () => {
      // Close the dialog after successful submission
      onOpenChange(false);
    },
  });

  const handleSignBlueprint = async () => {
    if (!address) return;

    if (!blueprintHash) {
      toast.error("Blueprint hash not ready yet, please try again in a moment");
      return;
    }

    try {
      setSigning(true);
      // Create and sign the requisition using the hash
      const requisition = createRequisition(blueprint, blueprintHash);
      const signedRequisition = await signRequisition(requisition);

      // Store the signed requisition data
      setSignedRequisitionData(signedRequisition);
      toast.success("Blueprint signed successfully");
    } catch (error) {
      console.error("Error signing blueprint:", error);
      toast.error("Failed to sign blueprint");
    } finally {
      setSigning(false);
    }
  };

  const handlePublishRequisition = async () => {
    if (!signedRequisitionData?.signature) {
      toast.error("Please sign the blueprint first");
      return;
    }

    try {
      // Call publish requisition
      await writeWithEstimateGas({
        address: protocolAddress,
        abi: diamondABI,
        functionName: "publishRequisition",
        args: [signedRequisitionData],
      });

      // Explicitly close the dialog after successful transaction
      toast.success("Order published successfully");
      onOpenChange(false);

      // Call the parent success callback to close the parent dialog
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error publishing requisition:", error);
    }
  };

  // Calculate total results from execution history
  const totalBeansSpent = executionHistory.reduce((acc, exec) => {
    if (exec.sowEvent) {
      return acc.add(TokenValue.fromBlockchain(exec.sowEvent.beans, 6));
    }
    return acc;
  }, TokenValue.ZERO);

  const totalPodsReceived = executionHistory.reduce((acc, exec) => {
    if (exec.sowEvent) {
      return acc.add(TokenValue.fromBlockchain(exec.sowEvent.pods, 6));
    }
    return acc;
  }, TokenValue.ZERO);

  const averagePodsPerBean = totalBeansSpent.gt(0) 
    ? totalPodsReceived.div(totalBeansSpent) 
    : TokenValue.ZERO;

  // Helper function to format dates with time
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
    return format(new Date(timestamp), "MM/dd/yyyy h:mm a"); // Include hours and minutes with AM/PM
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] backdrop-blur-sm">
        <DialogTitle>{isViewOnly ? "View Tractor Order" : "Review and Publish Tractor Order"}</DialogTitle>
        <DialogDescription>
          {isViewOnly 
            ? "This is your active Tractor Order. It allows an Operator to execute a transaction for you on the Base network when the conditions are met."
            : "A Tractor Order allows you to pay an Operator to execute a transaction for you on the Base network. This allows you to interact with the Pinto protocol autonomously when the conditions of your Order are met."
          }
        </DialogDescription>
        <div className="flex flex-col gap-6">
          {/* Tabs */}
          <div className="flex gap-4 border-b">
            <button
              className={`pb-2 ${activeTab === "order" ? "border-b-2 border-green-600 font-medium" : "text-gray-500"}`}
              onClick={() => setActiveTab("order")}
            >
              View Order
            </button>
            <button
              className={`pb-2 ${
                activeTab === "blueprint" ? "border-b-2 border-green-600 font-medium" : "text-gray-500"
              }`}
              onClick={() => setActiveTab("blueprint")}
            >
              View Blueprint and Requisition
            </button>
            {isViewOnly && executionHistory.length > 0 && (
              <button
                className={`pb-2 ${
                  activeTab === "executions" ? "border-b-2 border-green-600 font-medium" : "text-gray-500"
                }`}
                onClick={() => setActiveTab("executions")}
              >
                Execution History ({executionHistory.length})
              </button>
            )}
          </div>

          {/* Content */}
          {activeTab === "order" ? (
            /* Order Visualization */
            <div className="bg-gray-50 p-6 rounded-lg relative">
              {/* Add the dot grid as a background element */}
              <div className="absolute inset-0 opacity-50">
                <div className="w-full h-full bg-dot-grid bg-[size:24px_24px] bg-[position:center]" />
              </div>

              <div className="z-10 relative">
                {/* Withdraw Section */}
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-white rounded-xl px-8 py-3 shadow-sm flex flex-col gap-2 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="bg-pinto-green-4 text-white px-4 py-1 rounded-full">Withdraw</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-box">Deposited Tokens</span>
                      <span className="text-gray-300">—</span>
                      <span className="text-box">
                        with <span className="text-black">Best PINTO</span> Price
                      </span>
                      <span className="text-gray-300">—</span>
                      <span className="text-box">
                        as <span className="text-black">PINTO</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sow Section */}
                <div className="flex flex-col items-center gap-4 mt-8">
                  <div className="bg-white rounded-xl px-8 py-3 shadow-sm border border-gray-200">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-pinto-green-4 text-white px-4 py-1 rounded-full">Sow</div>
                        <span className="text-gray-300">—</span>
                        <span className="text-box">
                          up to <span className="text-pinto-green-4">{orderData.totalAmount}</span>{" "}
                          <span className="text-pinto-green-4">PINTO</span>
                        </span>
                      </div>
                      <ul className="list-none space-y-2">
                        <li className="flex items-center gap-2">
                          <CornerBottomLeftIcon className="text-gray-300" />
                          <span className="font-menlo text-gray-400">
                            Execute when Temperature is at least{" "}
                            <span className="text-pinto-green-4">{orderData.temperature}</span>
                            <span className="text-pinto-green-4">%</span>
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CornerBottomLeftIcon className="text-gray-300" />
                          <span className="font-menlo text-gray-400">
                            AND when Pod Line Length is at most{" "}
                            <span className="text-pinto-green-4">{orderData.podLineLength}</span>
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CornerBottomLeftIcon className="text-gray-300" />
                          <span className="font-menlo text-gray-400">
                            AND when Available Soil is at least{" "}
                            <span className="text-pinto-green-4">{orderData.minSoil}</span>
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Tip Section */}
                <div className="flex items-center justify-center mt-8">
                  <div className="bg-white rounded-xl px-8 py-3 shadow-sm flex items-center gap-2 border border-gray-200">
                    <div className="bg-pinto-green-4 text-white px-4 py-1 rounded-full">Tip</div>
                    <div className="flex items-center gap-2">
                      <span className="text-box">
                        <span className="text-pinto-green-4">{orderData.operatorTip} PINTO</span>
                      </span>
                      <span className="text-gray-300">—</span>
                      <span className="text-box">to Operator</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : activeTab === "blueprint" ? (
            /* Blueprint View */
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="space-y-6">
                {/* Decoded SowBlueprintv0 Call */}
                <div>
                  <h3 className="text-lg font-medium mb-2">SowBlueprintv0 Call</h3>
                  <div className="bg-white p-4 rounded border border-gray-200 font-mono text-sm overflow-x-auto">
                    <HighlightedCallData
                      blueprintData={encodedData}
                      targetData={encodedData}
                      showSowBlueprintParams={true}
                    />
                  </div>
                </div>

                {/* Encoded Farm Data */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Encoded Farm Data</h3>
                  <div className="bg-white p-4 rounded border border-gray-200 font-mono text-sm overflow-x-auto">
                    <HighlightedCallData
                      blueprintData={encodedData}
                      targetData={encodedData}
                      decodeAbi={decodeAbi}
                      encodedData={encodedData}
                    />
                  </div>
                </div>

                {/* Operator Instructions */}
                {/* <div>
                  <h3 className="text-lg font-medium mb-2">Operator Instructions</h3>
                  <div className="bg-white p-4 rounded border border-gray-200 font-mono text-sm overflow-x-auto">
                    {operatorPasteInstrs.map((instr, i) => (
                      <div key={i} className="mb-2">
                        <div className="text-gray-500 text-xs mb-1">Instruction {i + 1}:</div>
                        <HighlightedCallData blueprintData={encodedData} targetData={instr} decodeAbi={decodeAbi} />
                      </div>
                    ))}
                  </div>
                </div> */}

                {/* Requisition Data */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Requisition Data</h3>
                  <div className="bg-white p-4 rounded border border-gray-200 font-mono text-sm overflow-x-auto">
                    <HighlightedCallData
                      blueprintData={encodedData}
                      targetData={JSON.stringify(blueprint, null, 2)}
                      decodeAbi={decodeAbi}
                      isRequisitionData={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Table-Based Execution History View with Date & Time */
            <div>
              
              {executionHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No executions yet</div>
              ) : (
                <>
                  {/* New Summary Section  */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                    <h4 className="text-lg font-medium mb-3">Execution Summary</h4>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Total PINTO Sown</span>
                        <span className="text-lg font-medium text-pinto-green-4 mt-2">
                          {formatter.number(totalBeansSpent)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Total Pods Received</span>
                        <span className="text-lg font-medium mt-2">
                          {formatter.number(totalPodsReceived)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Average Pods per PINTO</span>
                        <span className="text-lg font-medium mt-2">
                          {formatter.number(averagePodsPerBean)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Existing Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-gray-600 border-b">Execution</th>
                          <th className="px-4 py-3 text-right text-gray-600 border-b">PINTO Sown</th>
                          <th className="px-4 py-3 text-right text-gray-600 border-b">Pods Received</th>
                          <th className="px-4 py-3 text-right text-gray-600 border-b">Pods per PINTO</th>
                          <th className="px-4 py-3 text-left text-gray-600 border-b">Operator</th>
                          <th className="px-4 py-3 text-right text-gray-600 border-b min-w-[150px]">Date & Time</th>
                          <th className="px-4 py-3 text-right text-gray-600 border-b">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Table rows - remain the same */}
                        {[...executionHistory]
                          .sort((a, b) => {
                            // If timestamps are available, use those for sorting
                            if (a.timestamp && b.timestamp) {
                              return b.timestamp - a.timestamp;
                            }
                            // Otherwise fall back to block numbers
                            return b.blockNumber - a.blockNumber;
                          })
                          .map((execution, index) => {
                            // Calculate pods per PINTO for this execution
                            const podsPerPinto = execution.sowEvent && execution.sowEvent.beans > 0n
                              ? TokenValue.fromBlockchain(execution.sowEvent.pods, 6)
                                  .div(TokenValue.fromBlockchain(execution.sowEvent.beans, 6))
                              : TokenValue.ZERO;
                                
                            return (
                              <tr key={index} className="hover:bg-gray-50 border-b">
                                <td className="px-4 py-3 font-medium">
                                  #{executionHistory.length - index}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {execution.sowEvent 
                                    ? formatter.number(TokenValue.fromBlockchain(execution.sowEvent.beans, 6))
                                    : "-"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {execution.sowEvent 
                                    ? formatter.number(TokenValue.fromBlockchain(execution.sowEvent.pods, 6))
                                    : "-"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {execution.sowEvent && execution.sowEvent.beans > 0n
                                    ? formatter.number(podsPerPinto)
                                    : "-"}
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                  {shortenAddress(execution.operator)}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-500">
                                  {execution.timestamp 
                                    ? formatDate(execution.timestamp)
                                    : `Block ${execution.blockNumber}`}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <a 
                                    href={`https://basescan.org/tx/${execution.transactionHash}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-pinto-green-4 hover:underline text-sm"
                                  >
                                    View Transaction
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Footer */}
          {!isViewOnly ? (
            <div className="flex justify-between items-center mt-4">
              <p className="text-gray-600">
                Your Order will remain active until you've Sown {orderData.totalAmount} Pods under the specified
                conditions or until Order cancellation
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleSignBlueprint}
                  disabled={signing || !!signedRequisitionData}
                  className="bg-pinto-green-4 hover:bg-pinto-green-5 text-white px-6 py-2 rounded-full"
                >
                  {signing ? "Signing..." : signedRequisitionData ? "Signed" : "Sign Order"}
                </Button>

                <Button
                  onClick={handlePublishRequisition}
                  disabled={submitting || !signedRequisitionData}
                  className={`${
                    signedRequisitionData ? "bg-pinto-green-4 hover:bg-pinto-green-5" : "bg-gray-300"
                  } text-white px-6 py-2 rounded-full`}
                >
                  {submitting ? "Publishing..." : "Publish Order"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-pinto-green-4 hover:bg-pinto-green-5 text-white px-6 py-2 rounded-full"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to shorten addresses
function shortenAddress(address: string): string {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}
