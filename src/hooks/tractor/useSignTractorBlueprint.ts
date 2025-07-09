import { Blueprint, Requisition, createRequisition, useSignRequisition } from "@/lib/Tractor";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";

export default function useSignTractorBlueprint() {
  const [signing, setSigning] = useState(false);

  const signRequisition = useSignRequisition();
  const [signedRequisition, setSignedRequisition] = useState<Requisition | undefined>(undefined);

  const { address } = useAccount();

  const signBlueprint = useCallback(
    async (blueprint: Blueprint, blueprintHash: `0x${string}`) => {
      try {
        if (!address) {
          throw new Error("No signer found.");
        }

        setSigning(true);

        const requisition = createRequisition(blueprint, blueprintHash);
        const signedRequisition = await signRequisition(requisition);

        setSignedRequisition(signedRequisition);
        toast.success("Blueprint signed successfully");
      } catch (e) {
        toast.error("Failed to sign blueprint");
        console.error(e);
      } finally {
        setSigning(false);
      }
    },
    [address],
  );

  return {
    signBlueprint,
    signedRequisition,
    isSigning: signing,
  } as const;
}
