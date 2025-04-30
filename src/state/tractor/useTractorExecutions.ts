import { TV } from "@/classes/TokenValue";
import { diamondABI } from "@/constants/abi/diamondABI";
import { TIME_TO_BLOCKS } from "@/constants/blocks";
import { PODS } from "@/constants/internalTokens";
import { defaultQuerySettingsMedium } from "@/constants/query";
import { MAIN_TOKEN } from "@/constants/tokens";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { getChainConstant } from "@/hooks/useChainConstant";
import { TractorAPIExecutionSowOrderItem, TractorAPIResponseExecution } from "@/lib/Tractor/api";
import TractorAPI from "@/lib/Tractor/api";
import { TRACTOR_DEPLOYMENT_BLOCK } from "@/lib/Tractor/utils";
import { resolveChainId } from "@/utils/chain";
import { HashString } from "@/utils/types.generic";
import { isDev } from "@/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { PublicClient, decodeEventLog } from "viem";
import { useChainId, usePublicClient } from "wagmi";
import { queryKeys } from "../queryKeys";

// ────────────────────────────────────────────────────────────────────────────────
// Fetch ALL EXECUTIONS QUERY
// ────────────────────────────────────────────────────────────────────────────────

export const useTractorAPIExecutionsQuery = (publisher: HashString | undefined) => {
  const chainId = useChainId();

  const selectTractorExecutions = useMemo(() => getSelectTractorExecutions(resolveChainId(chainId)), [chainId]);

  return useQuery({
    queryKey: [["TRACTOR", "EXECUTIONS"], publisher],
    queryFn: async () => {
      if (!publisher) return undefined;
      return TractorAPI.getExecutions({ publisher });
    },
    select: selectTractorExecutions,
    enabled: !!publisher,
    ...defaultQuerySettingsMedium,
  });
};

export default function usePublisherTractorExecutions(publisher: HashString | undefined) {
  const client = usePublicClient();
  const diamond = useProtocolAddress();

  const { data: executionData, ...executionsQuery } = useTractorAPIExecutionsQuery(publisher);

  // Check if the API data exists and has any executions
  const executionsExist = executionData && Object.values(executionData.executions).some((d) => !!d.length);

  // Only run the on-chain event query if we have a client, a publisher AND (the API data exists OR the API request failed)
  const executionsChainQueryEnabled = Boolean(client && publisher && Boolean(executionsExist || executionsQuery.error));

  /**
   * If the exeuction API request failed, fetch since the TRACTOR_DEPLOYMENT_BLOCK
   * otherwise,
   * - DEV, use a 24 hour lookback
   * - PROD, use a 1 hour lookback
   */
  const lookbackBlocks = !executionsQuery.error ? (isDev() ? TIME_TO_BLOCKS.day : TIME_TO_BLOCKS.hour) : undefined;

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

export interface PublisherTractorExecution {
  blockNumber: number;
  operator: `0x${string}`;
  publisher: `0x${string}`;
  blueprintHash: `0x${string}`;
  transactionHash: `0x${string}`;
  timestamp: number | undefined;
  sowEvent: SowEventArgs | undefined;
}

interface SowEventArgs<T extends bigint | TV = TV> {
  account: `0x${string}`;
  fieldId: bigint;
  index: T;
  beans: T;
  pods: T;
}

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

export async function fetchTractorExecutions(
  publicClient: PublicClient,
  protocolAddress: `0x${string}`,
  publisher: `0x${string}`,
  lookbackBlocks?: bigint,
) {
  const chainId = publicClient.chain?.id;
  if (!chainId) throw new Error("[Tractor/fetchTractorExecutions] No chain ID found");

  console.debug("[Tractor/fetchTractorExecutions] FETCHING(executions for publisher):", publisher);
  const latestBlock = await publicClient.getBlock();

  let fromBlock = TRACTOR_DEPLOYMENT_BLOCK;

  if (lookbackBlocks && latestBlock.number > TRACTOR_DEPLOYMENT_BLOCK) {
    const newFromBlock = latestBlock.number - BigInt(lookbackBlocks);
    fromBlock = newFromBlock > TRACTOR_DEPLOYMENT_BLOCK ? newFromBlock : TRACTOR_DEPLOYMENT_BLOCK;
  }

  // Get Tractor events
  const tractorEvents = await publicClient.getContractEvents({
    address: protocolAddress,
    abi: diamondABI,
    eventName: "Tractor",
    args: {
      publisher: publisher,
    },
    fromBlock: fromBlock ?? TRACTOR_DEPLOYMENT_BLOCK,
    toBlock: "latest",
  });

  console.debug("[Tractor/fetchTractorExecutions] RESPONSE(Tractor events):", tractorEvents);

  // Process transaction receipts and collect block numbers
  const blockNumbers = new Set<bigint>();
  const processingResults = await Promise.all(
    tractorEvents.map(async (event) => {
      const receipt = await publicClient.getTransactionReceipt({
        hash: event.transactionHash,
      });

      // Add block number to the set for batch fetching
      blockNumbers.add(receipt.blockNumber);

      // Find the Sow event in the transaction logs
      const sowEvent = receipt.logs.find((log) => {
        try {
          const decoded = decodeEventLog({
            abi: diamondABI,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === "Sow";
        } catch {
          return false;
        }
      });

      const mainToken = getChainConstant(resolveChainId(chainId), MAIN_TOKEN);

      // Decode the Sow event if found
      let sowData: SowEventArgs | undefined;
      if (sowEvent) {
        try {
          const decoded = decodeEventLog({
            abi: diamondABI,
            data: sowEvent.data,
            topics: sowEvent.topics,
          }) as { args: SowEventArgs<bigint> };

          sowData = {
            account: decoded.args.account,
            fieldId: decoded.args.fieldId,
            index: TV.fromBigInt(decoded.args.index, PODS.decimals),
            beans: TV.fromBigInt(decoded.args.beans, mainToken.decimals),
            pods: TV.fromBigInt(decoded.args.pods, PODS.decimals),
          };
        } catch (error) {
          console.error("Failed to decode Sow event:", error);
        }
      }

      return {
        blockNumber: receipt.blockNumber,
        event,
        receipt,
        sowData,
      };
    }),
  );

  // Fetch all required blocks in a batch
  const blocks = await Promise.all(
    Array.from(blockNumbers).map((blockNumber) => publicClient.getBlock({ blockNumber })),
  );

  // Build a map of block numbers to timestamps
  const blockTimestamps = new Map<string, number>();
  blocks.forEach((block) => {
    blockTimestamps.set(block.number.toString(), Number(block.timestamp) * 1000);
  });

  // Assemble the final result
  const processed = processingResults.map((result): PublisherTractorExecution => {
    return {
      blockNumber: Number(result.blockNumber),
      operator: result.event.args?.operator as `0x${string}`,
      publisher: result.event.args?.publisher as `0x${string}`,
      blueprintHash: result.event.args?.blueprintHash as `0x${string}`,
      transactionHash: result.event.transactionHash,
      timestamp: blockTimestamps.get(result.blockNumber.toString()),
      sowEvent: result.sowData,
    } as PublisherTractorExecution;
  });

  console.debug("[Tractor/fetchTractorExecutions] RESPONSE", processed);

  return processed;
}
