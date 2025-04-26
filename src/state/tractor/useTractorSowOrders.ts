import { sowBlueprintv0ABI } from "@/constants/abi/SowBlueprintv0ABI";
import { SOW_BLUEPRINT_V0_ADDRESS } from "@/constants/address";
import { API_SERVICES } from "@/constants/endpoints";
import { defaultQuerySettingsMedium } from "@/constants/query";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { TRACTOR_DEPLOYMENT_BLOCK } from "@/lib/Tractor";
import { HashString } from "@/utils/types.generic";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useChainId, useConfig, usePublicClient } from "wagmi";
import { useFieldPodLine } from "../useFieldData";
import { tractorQueryKeys as queryKeys } from "./utils";

const endpoint = `${API_SERVICES.pinto}/tractor/orders`;

const requestBody = { orderType: "SOW_V0", cancelled: false } as const;

const fetchAPIOrders = async () => {
  const response = await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
};

export default function useAllTractorSowOrders() {
  const diamond = useProtocolAddress();

  const podline = useFieldPodLine();
  const config = useConfig();

  const chainId = useChainId();

  const client = usePublicClient();

  const query = useQuery({
    queryKey: queryKeys.sowOrdersV0({ ...podline }),
    queryFn: () => {
      // const query =
    },
  });
}

// =================================================================
// ========================= Event Queries =========================
// =================================================================

const sowCompleteEventsArgs = {
  address: SOW_BLUEPRINT_V0_ADDRESS,
  abi: sowBlueprintv0ABI,
  eventName: "SowOrderComplete",
  toBlock: "latest",
} as const;

// -------------------- Sow Order Complete --------------------
export const useTractorSowCompleteEvents = (fromBlock: bigint = TRACTOR_DEPLOYMENT_BLOCK, disabled?: boolean) => {
  const client = usePublicClient();

  return useQuery({
    queryKey: queryKeys.sowOrdersCompleteEvents(fromBlock),
    queryFn: async () => {
      if (!client) return;
      console.debug("[TRACTOR/useTractorSowCompleteEvents]", {
        fromBlock,
        toBlock: "latest",
      });
      return client.getContractEvents({ ...sowCompleteEventsArgs, fromBlock }).then((events) => {
        // Create a set of completed blueprint hashes
        return events.reduce<Set<HashString>>((prev, curr) => {
          curr.args?.blueprintHash && prev.add(curr.args.blueprintHash);
          return prev;
        }, new Set());
      });
    },
    enabled: !!client && !disabled,
    ...defaultQuerySettingsMedium,
  });
};

const useLatestBlock5Mins = () => {
  const client = usePublicClient();

  // const query = 
}

export const useTractorSowV0PublishedRequisitions = (
  fromBlock: bigint = TRACTOR_DEPLOYMENT_BLOCK, 
  disabled?: boolean
) => {
  const client = usePublicClient();

  const diamond = useProtocolAddress();

  return useQuery({
    queryKey: queryKeys.sowOrdersV0PublishedRequisitions(fromBlock),
    queryFn: async () => {
      if (!client) {
        return;
      }

      console.debug("[TRACTOR/useTractorSowV0PublishedRequisitions]", {
        fromBlock,
        toBlock: "latest",
      });

      return 
    },
    enabled: !!client && !disabled,
    ...defaultQuerySettingsMedium,
  });
};

export const useFetchTractorEvents = (fromBlock: bigint = TRACTOR_DEPLOYMENT_BLOCK, disabled?: boolean) => {
  const client = usePublicClient();
  const [fetchFromBlock, setFetchFromBlock] = useFetchFromBlockState(fromBlock);
};

const useFetchFromBlockState = (fromBlock: bigint = TRACTOR_DEPLOYMENT_BLOCK) => {
  const [fetchFromBlock, setFetchFromBlock] = useState<bigint>(fromBlock);

  // Update the fetchFromBlock if the fromBlock is less than the current fetchFromBlock
  useEffect(() => {
    setFetchFromBlock((prev) => {
      // If the fromBlock is the deployment block, update the fetchFromBlock
      if (prev === TRACTOR_DEPLOYMENT_BLOCK) return fromBlock;
      // If the fromBlock is less than the current fetchFromBlock, update the fetchFromBlock
      if (fromBlock < prev && fromBlock > TRACTOR_DEPLOYMENT_BLOCK) return fromBlock;
      // otherwise, return the previous fetchFromBlock
      return prev;
    });
  }, [fromBlock]);

  return [fetchFromBlock, setFetchFromBlock] as const;
};
