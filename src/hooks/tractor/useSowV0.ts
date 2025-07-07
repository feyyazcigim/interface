import { diamondABI } from "@/constants/abi/diamondABI";
import { Blueprint, Requisition, createRequisition, signRequisition, useSignRequisition } from "@/lib/Tractor";
import { useState } from "react";
import { toast } from "sonner";
import { encodeFunctionData } from "viem";
import { useAccount } from "wagmi";
import { useProtocolAddress } from "../pinto/useProtocolAddress";
import useTransaction from "../useTransaction";

export default function useSowOrderV0({
  onSuccess,
  onOrderPublished,
}: {
  onSuccess?: () => void;
  onOrderPublished?: () => void;
}) {
  const { address } = useAccount();
  const protocolAddress = useProtocolAddress();
  const [isSigning, setIsSigning] = useState(false);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [blueprintHash, setBlueprintHash] = useState<`0x${string}` | null>(null);
  const [signedRequisitionData, setSignedRequisitionData] = useState<Requisition | null>(null);
  const [depositOptimizationCalls, setDepositOptimizationCalls] = useState<`0x${string}`[]>([]);

  const signRequisition = useSignRequisition();

  const { writeWithEstimateGas, submitting, setSubmitting, isConfirming } = useTransaction({
    successMessage: "Order published successfully",
    errorMessage: "Failed to publish order",
    successCallback: () => {
      // Close the dialog after successful submission
      onSuccess?.();
    },
  });

  const handleSignBlueprint = async (bpHash: `0x${string}`, bp: Blueprint) => {
    if (!address) {
      throw new Error("Signer not found");
    }
    if (!bpHash) {
      throw new Error("Blueprint hash not found");
    }

    try {
      setIsSigning(true);
      // Create and sign the requisition using the hash
      const requisition = createRequisition(bp, bpHash);
      // Store the signed requisition data
      const signedRequisition = await signRequisition(requisition);

      setSignedRequisitionData(signedRequisition);
      toast.success("Blueprint signed successfully");
      return signedRequisition;
    } catch (error) {
      console.error("Error signing blueprint:", error);
      toast.error("Failed to sign blueprint");
    } finally {
      setIsSigning(false);
    }
  };

  const handlePublishRequisition = async (before?: () => Promise<void>, after?: () => Promise<void>) => {
    if (!address) {
      throw new Error("Signer not found");
    }

    const signature = signedRequisitionData?.signature;
    if (!signature) {
      toast.error("Please sign the blueprint first");
      throw new Error("Please sign the blueprint first");
    }

    setSubmitting(true);

    await before?.();

    try {
      // Check if we need to include deposit optimization calls
      if (depositOptimizationCalls && depositOptimizationCalls.length > 0) {
        console.debug(`Publishing requisition with ${depositOptimizationCalls.length} deposit optimization calls`);

        // Create publish requisition call
        const publishRequisitionCall = encodeFunctionData({
          abi: diamondABI,
          functionName: "publishRequisition",
          args: [
            {
              ...signedRequisitionData,
              signature,
            },
          ],
        });

        // Combine optimization calls with publish requisition call
        const farmCalls = [...depositOptimizationCalls, publishRequisitionCall];

        // Execute as farm call
        await writeWithEstimateGas({
          address: protocolAddress,
          abi: diamondABI,
          functionName: "farm",
          args: [farmCalls],
        });
      } else {
        console.debug("Publishing requisition without deposit optimization");

        // Call publish requisition directly (like before)
        await writeWithEstimateGas({
          address: protocolAddress,
          abi: diamondABI,
          functionName: "publishRequisition",
          args: [signedRequisitionData],
        });
      }

      // Success handling
      toast.success("Order published successfully");

      // Call the parent success callback to refresh data
      onSuccess?.();

      // Navigate to the Field page with tractor tab active
      // navigate("/field?tab=tractor");

      // Call the onOrderPublished callback if provided
      onOrderPublished?.();
    } catch (error) {
      console.error("Error publishing requisition:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const publishing = submitting || isConfirming;

  return {
    // State
    isSigning,
    isPublishing: publishing,

    blueprint,
    blueprintHash,
    // Setters
    setBlueprint,
    setBlueprintHash,
    // Handlers
    handleSignBlueprint,
    handlePublishRequisition,
  };
}
