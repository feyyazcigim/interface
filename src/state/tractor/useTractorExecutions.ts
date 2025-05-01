import { TV } from "@/classes/TokenValue";
import { TIME_TO_BLOCKS } from "@/constants/blocks";
import { PODS } from "@/constants/internalTokens";
import { defaultQuerySettingsMedium } from "@/constants/query";
import { MAIN_TOKEN } from "@/constants/tokens";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { getChainConstant } from "@/hooks/useChainConstant";
import { TractorAPIExecutionSowOrderItem, TractorAPIResponseExecution } from "@/lib/Tractor/api";
import TractorAPI from "@/lib/Tractor/api";
import { PublisherTractorExecution, fetchTractorExecutions } from "@/lib/Tractor/utils";
import { queryKeys } from "@/state/queryKeys";
import { resolveChainId } from "@/utils/chain";
import { HashString } from "@/utils/types.generic";
import { isDev } from "@/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useChainId, usePublicClient } from "wagmi";

// ────────────────────────────────────────────────────────────────────────────────
// Fetch ALL EXECUTIONS QUERY
// ────────────────────────────────────────────────────────────────────────────────

export const useTractorAPIExecutionsQuery = (publisher: HashString | undefined, enabled: boolean = true) => {
  const chainId = useChainId();

  const selectTractorExecutions = useMemo(() => getSelectTractorExecutions(resolveChainId(chainId)), [chainId]);

  return useQuery({
    queryKey: queryKeys.tractor.tractorExecutions(publisher),
    queryFn: async () => {
      if (!publisher) return undefined;
      return TractorAPI.getExecutions({ publisher });
    },
    select: selectTractorExecutions,
    enabled: !!publisher && enabled,
    ...defaultQuerySettingsMedium,
  });
};

const getLookbackBlocks = (chainOnly: boolean, error: boolean) => {
  if (chainOnly || error) return undefined;
  return isDev() ? TIME_TO_BLOCKS.day : TIME_TO_BLOCKS.hour;
};

export default function usePublisherTractorExecutions(publisher: HashString | undefined, chainOnly: boolean = false) {
  const client = usePublicClient();
  const diamond = useProtocolAddress();

  const { data: executionData, ...executionsQuery } = useTractorAPIExecutionsQuery(publisher, !chainOnly);

  // Check if the API data exists and has any executions
  const executionsExist = executionData && Object.values(executionData.executions).some((d) => !!d.length);

  // Only run the on-chain event query if we have a client, a publisher AND (the API data exists OR the API request failed)
  const executionsChainQueryEnabled =
    chainOnly || Boolean(client && publisher && Boolean(executionsExist || executionsQuery.error));

  /**
   * If the exeuction API request failed, fetch since the TRACTOR_DEPLOYMENT_BLOCK
   * otherwise,
   * - DEV, use a 24 hour lookback to allow for forwarding seasons locally
   * - PROD, use a 1 hour lookback
   */
  const lookbackBlocks = getLookbackBlocks(chainOnly, !!executionsQuery.error);

  // Merge the on-chain executions with the API data. Use useCallback to create a stable reference to the function
  const mergeExecutions = useCallback(
    (onChainExecutions: Awaited<ReturnType<typeof fetchTractorExecutions>> | undefined) => {
      if (!executionData?.executions || !onChainExecutions?.length) return undefined;

      // Create a Set of existing transaction hashes for O(1) lookup
      const existingTxHashes = new Set([
        ...executionData.executions.sowBlueprintv0.map((exec) => exec.transactionHash.toLowerCase()),
        ...executionData.executions.unknown.map((exec) => exec.executedTxn.toLowerCase()),
      ]);

      const allExecutions = [...executionData.executions.sowBlueprintv0];

      // Filter out any on-chain executions that already exist in the API data & add the SOW_V0 executions if sowEvent is present
      onChainExecutions.forEach((exec) => {
        if (!existingTxHashes.has(exec.transactionHash.toLowerCase())) {
          allExecutions.push(exec);
        }
      });

      // Combine and sort all executions
      allExecutions.sort((a, b) => b.blockNumber - a.blockNumber);

      return allExecutions;
    },
    [executionData?.executions],
  );

  const executionsChainQuery = useQuery({
    queryKey: queryKeys.tractor.tractorExecutionsChain(publisher, lookbackBlocks),
    queryFn: async () => {
      if (!publisher || !client) return undefined;
      return fetchTractorExecutions(client, diamond, publisher, lookbackBlocks);
    },
    enabled: executionsChainQueryEnabled,
    select: mergeExecutions,
    ...defaultQuerySettingsMedium,
  });

  const refetch = useCallback(() => {
    return Promise.all([executionsChainQuery.refetch(), executionsQuery.refetch()]);
  }, [executionsChainQuery, executionsQuery]);

  const isLoading = executionsChainQuery.isLoading || executionsQuery.isLoading;

  return useMemo(
    () => ({
      data: executionsChainQuery.data,
      isLoading,
      error: executionsChainQuery.error || executionsQuery.error,
      refetch,
    }),
    [executionsChainQuery.data, executionsChainQuery.error, executionsQuery.error, isLoading, refetch],
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Helper Functions & Interfaces
// ────────────────────────────────────────────────────────────────────────────────

const getSelectTractorExecutions = (chainId: number) => {
  return (args: Awaited<ReturnType<typeof TractorAPI.getExecutions>> | undefined) => {
    if (!args) return undefined;
    const { executions } = args;

    const mainToken = getChainConstant(resolveChainId(chainId), MAIN_TOKEN);

    const executionsByType = {
      sowBlueprintv0: [] as PublisherTractorExecution[],
      unknown: [] as TractorAPIResponseExecution<unknown>[],
    };

    const knownOrderTypes = new Set(["SOW_V0"]);

    for (const execution of executions) {
      if (!knownOrderTypes.has(execution.orderInfo.orderType)) {
        // Add unknown executions to the unknown array
        executionsByType.unknown.push(execution);
        continue;
      }
      if (execution.orderInfo.orderType === "SOW_V0") {
        const e = execution as TractorAPIExecutionSowOrderItem<string>;
        executionsByType.sowBlueprintv0.push({
          blockNumber: e.executedBlock,
          operator: e.operator,
          publisher: e.orderInfo.publisher,
          blueprintHash: e.blueprintHash,
          transactionHash: e.executedTxn,
          timestamp: Number(e.executedTimestamp),
          sowEvent: {
            account: e.orderInfo.publisher,
            fieldId: 0n,
            index: TV.fromBlockchain(e.blueprintData.index, PODS.decimals),
            beans: TV.fromBlockchain(e.blueprintData.beans, mainToken.decimals),
            pods: TV.fromBlockchain(e.blueprintData.pods, PODS.decimals),
          },
        });
      }
    }
    return {
      lastUpdated: args.lastUpdated,
      totalRecords: args.totalRecords,
      executions: executionsByType,
    };
  };
};
