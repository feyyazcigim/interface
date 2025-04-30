import { tractorHelpersABI } from "@/constants/abi/TractorHelpersABI";
import { TRACTOR_HELPERS_ADDRESS } from "@/constants/address";
import { TIME_TO_BLOCKS } from "@/constants/blocks";
import { defaultQuerySettingsMedium } from "@/constants/query";
import { TRACTOR_DEPLOYMENT_BLOCK } from "@/lib/Tractor";
import { MinimumViableBlock } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { PublicClient, decodeEventLog } from "viem";
import { usePublicClient } from "wagmi";
import { queryKeys } from "../queryKeys";

interface UseTractorOperatorAverageTipPaidOptions {
  lookbackBlocks?: bigint;
}

export default function useTractorOperatorAverageTipPaid(options?: UseTractorOperatorAverageTipPaidOptions) {
  // hooks
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: queryKeys.tractor.operatorAverageTipPaid(options?.lookbackBlocks),
    queryFn: async () => {
      if (!publicClient) return;
      const latestBlock = await publicClient.getBlock({ blockTag: "latest" });
      return getOperatorAverageTipPaid(publicClient, latestBlock, options?.lookbackBlocks);
    },
    ...defaultQuerySettingsMedium,
  });
}

/**
 * Calculates the average tip paid from OperatorReward events in the last 14 days.
 * Returns 1 if no events are found.
 */
export async function getOperatorAverageTipPaid(
  publicClient: PublicClient,
  currentBlock: MinimumViableBlock<bigint>,
  lookbackBlocks: bigint = TIME_TO_BLOCKS.fortnight,
): Promise<number> {
  console.debug("[Tractor/getOperatorAverageTipPaid] FETCHING", { currentBlock, lookbackBlocks });

  try {
    // Calculate starting block (use max of deployment block or lookback. Default is 14 days)
    const lookback = currentBlock.number > lookbackBlocks ? currentBlock.number - lookbackBlocks : 0n;
    const fromBlock = lookback > TRACTOR_DEPLOYMENT_BLOCK ? lookback : TRACTOR_DEPLOYMENT_BLOCK;

    // Query for OperatorReward events
    const events = await publicClient.getContractEvents({
      address: TRACTOR_HELPERS_ADDRESS,
      abi: tractorHelpersABI,
      eventName: "OperatorReward",
      fromBlock,
      toBlock: "latest",
    });

    // If no events found, return default value of 1
    if (events.length === 0) {
      return 1;
    }

    // Calculate average tip amount
    let totalTipAmount = 0n;
    let validEventCount = 0;

    for (const event of events) {
      try {
        // Get the event data
        const decodedEvent = decodeEventLog({
          abi: tractorHelpersABI,
          data: event.data,
          topics: event.topics,
        });

        // Extract and use the amount parameter
        if (decodedEvent.args && "amount" in decodedEvent.args) {
          const amount = decodedEvent.args.amount;

          // Make sure it's a bigint and positive
          if (typeof amount === "bigint" && amount > 0n) {
            totalTipAmount += amount;
            validEventCount++;
          }
        }
      } catch (error) {
        // Silently continue on error
      }
    }

    // If no valid events found, return default value
    if (validEventCount === 0) {
      return 1;
    }

    // Calculate average in human-readable form
    const avgTipAmount = Number(totalTipAmount) / (validEventCount * 1e6);
    const result = avgTipAmount > 0 ? avgTipAmount : 1;

    console.debug("[Tractor/getOperatorAverageTipPaid] RESPONSE", {
      totalTipAmount,
      validEventCount,
      avgTipAmount,
      result,
    });

    // If we somehow got a non-positive number, return the default
    return result;
  } catch (error) {
    console.error("Error getting average tip amount:", error);
    // Return default value in case of error
    return 1;
  }
}
