import { diamondABI } from "@/constants/abi/diamondABI";
import { defaultQuerySettingsMedium } from "@/constants/query";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import {
  RequisitionData,
  RequisitionEvent,
  RequisitionType,
  TRACTOR_DEPLOYMENT_BLOCK,
  decodeSowTractorData,
} from "@/lib/Tractor/utils";
import { queryKeys } from "@/state/queryKeys";
import { MinimumViableBlock } from "@/utils/types";
import { MayArray } from "@/utils/types.generic";
import { safeJSONStringify } from "@/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { PublicClient } from "viem";
import { usePublicClient } from "wagmi";

type SelectRequisitionTypeArgs = {
  data: Awaited<ReturnType<typeof fetchTractorEvents>>;
  latestBlock: MinimumViableBlock<bigint>;
};

export default function useTractorPublishedRequisitions(address?: string, requisitionType?: MayArray<RequisitionType>) {
  const publicClient = usePublicClient();
  const diamond = useProtocolAddress();

  // Create a stable reference for the requisitionType to prevent unnecessary re-renders.
  // This is particularly important when requisitionType is passed as an inline array
  // (e.g. ["sowv0"]) which would create a new reference on every render
  const stableRequisitionRef = safeJSONStringify(requisitionType, "");

  // Memoize the selection function to prevent unnecessary recalculations
  // The function will only be recreated when the requisition type or address changes
  const selectRequisitionType = useMemo(
    () => getSelectRequisitionType(requisitionType, address),
    [stableRequisitionRef, address],
  );

  return useQuery({
    queryKey: queryKeys.tractor.tractorEvents,
    queryFn: async () => {
      if (!publicClient || !diamond) return undefined;
      const [latestBlock, data] = await Promise.all([
        publicClient.getBlock({ blockTag: "latest" }),
        fetchTractorEvents(publicClient, diamond),
      ]);

      return { data, latestBlock };
    },
    select: selectRequisitionType,
    ...defaultQuerySettingsMedium,
  });
}

// ───────────────────────────────────────────────────────────────────────────────-
// Fetch Function
// ───────────────────────────────────────────────────────────────────────────────-

// Expose the fetchTractorEvents function for use in other functions if necessary

export async function fetchTractorEvents(
  publicClient: PublicClient,
  protocolAddress: `0x${string}`,
  fromBlock: bigint = TRACTOR_DEPLOYMENT_BLOCK,
) {
  const sharedArgs = {
    address: protocolAddress,
    abi: diamondABI,
    fromBlock,
    toBlock: "latest",
  } as const;

  // Get published requisitions & cancelled blueprints
  const [publishEvents, cancelEvents] = await Promise.all([
    publicClient.getContractEvents({ eventName: "PublishRequisition", ...sharedArgs }),
    publicClient.getContractEvents({ eventName: "CancelBlueprint", ...sharedArgs }),
  ]);

  // Create a set of cancelled blueprint hashes
  const cancelledHashes = new Set(cancelEvents.map((event) => event.args?.blueprintHash ?? "0x"));
  cancelledHashes.delete("0x");

  return { publishEvents, cancelledHashes };
}

// ────────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────────────────────────────────────────────

const getRequisitionTypes = (requisitionType?: MayArray<RequisitionType>) => {
  if (!requisitionType) return new Set<RequisitionType>();
  return new Set(Array.isArray(requisitionType) ? requisitionType : [requisitionType]);
};

const getSelectRequisitionType = (requisitionsType: MayArray<RequisitionType> | undefined, address?: string) => {
  return (args: SelectRequisitionTypeArgs | undefined) => {
    if (!args) return undefined;

    const requisitionsTypes = getRequisitionTypes(requisitionsType);

    const {
      data: { publishEvents, cancelledHashes },
      latestBlock,
    } = args;

    const latestTimestamp = Number(latestBlock.timestamp);
    const latestBlockNumber = Number(latestBlock.number);

    const filteredEvents = publishEvents
      .map((event) => {
        const requisition = event.args?.requisition as RequisitionData;
        if (!requisition?.blueprint || !requisition?.blueprintHash || !requisition?.signature) return null;

        // Only filter by address if one is provided
        if (address && requisition.blueprint.publisher.toLowerCase() !== address.toLowerCase()) {
          return null;
        }

        let eventRequisitionType: RequisitionType = "unknown";
        // Try to decode the data
        const decodedData = decodeSowTractorData(requisition.blueprint.data);
        if (decodedData) {
          eventRequisitionType = "sowBlueprintv0";
        }

        // Filter by requisition type if provided
        if (!!requisitionsTypes.size) {
          if (!requisitionsTypes.has(eventRequisitionType)) return null;
        }

        // Calculate timestamp if we have the latest block info
        let timestamp: number | undefined = undefined;
        if (latestBlock) {
          // Convert all BigInt values to Number before arithmetic operations
          const eventBlockNumber = Number(event.blockNumber);

          // Calculate timestamp (approximately 2 seconds per block)
          timestamp = latestTimestamp * 1000 - (latestBlockNumber - eventBlockNumber) * 2000;
        }

        return {
          requisition,
          blockNumber: Number(event.blockNumber),
          timestamp,
          isCancelled: cancelledHashes.has(requisition.blueprintHash),
          requisitionType: eventRequisitionType,
          decodedData,
        } as RequisitionEvent;
      })
      .filter((event): event is NonNullable<typeof event> => event !== null);

    return filteredEvents;
  };
};
