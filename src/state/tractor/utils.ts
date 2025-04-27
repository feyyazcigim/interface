import { TV } from "@/classes/TokenValue";

const BASE_TRACTOR_QK = ["TRACTOR"];

interface SowOrderV0QK {
  podIndex: TV;
  harvestableIndex: TV;
}

export const tractorQueryKeys = {
  // Sow Orders V0 api cal
  sowOrdersV0: (args: SowOrderV0QK) => [
    BASE_TRACTOR_QK,
    "sowOrdersV0",
    args.harvestableIndex.toNumber(),
    args.podIndex.toNumber(),
  ],
  // Sow Orders V0 events via parsing
  sowOrdersV0Events: (args: SowOrderV0QK) => [
    BASE_TRACTOR_QK,
    "sowOrdersV0",
    "events",
    args.harvestableIndex.toNumber(),
    args.podIndex.toNumber(),
  ],
  sowOrdersCompleteEvents: (fromBlock: bigint) => [BASE_TRACTOR_QK, "sowOrderComplete", "events", fromBlock.toString()],
  sowOrdersV0PublishedRequisitions: (fromBlock: bigint, address?: string) => [
    BASE_TRACTOR_QK,
    "sowOrdersV0",
    "publishedRequisitions",
    fromBlock.toString(),
    address,
  ],
} as const;
