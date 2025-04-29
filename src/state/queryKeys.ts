import { MinimumViableBlock } from "@/utils/types";

// ────────────────────────────────────────────────────────────────────────────────
// BASE QueryKey
// ────────────────────────────────────────────────────────────────────────────────

const BASE_QKS = {
  tractor: ["TRACTOR"] as const,
  events: ["EVENTS"] as const,
  network: ["NETWORK"] as const,
} as const;

// ────────────────────────────────────────────────────────────────────────────────
// TRACTOR Query Keys
// ────────────────────────────────────────────────────────────────────────────────

const tractorQueryKeys = {
  // Sow Orders V0 api cal
  sowOrdersV0: () => [BASE_QKS.tractor, "sowOrdersV0", "api"],
  sowOrdersV0Chain: (args: {
    lookbackBlocks: bigint | undefined;
    lastUpdated: number | undefined;
    blockInfo: { number: bigint; timestamp: bigint };
  }) => [
    BASE_QKS.tractor,
    "sowOrdersV0",
    "chain",
    args.lastUpdated?.toString() ?? "no-last-updated",
    args.lookbackBlocks?.toString() ?? "no-lookback",
    args.blockInfo.number,
    args.blockInfo.timestamp.toString(),
  ],
} as const;

// ────────────────────────────────────────────────────────────────────────────────
// Events Query Keys
// ────────────────────────────────────────────────────────────────────────────────

const eventsQueryKeys = {
  fieldSowEvents: (args: MinimumViableBlock<bigint> | undefined) => [
    BASE_QKS.events,
    "fieldSowEvents",
    args?.number.toString() ?? "0",
    args?.timestamp.toString() ?? "0",
  ],
} as const;

// ────────────────────────────────────────────────────────────────────────────────
// CHAIN Query Keys
// ────────────────────────────────────────────────────────────────────────────────

const networkQueryKeys = {
  latestBlock: (key: string = "default") => [BASE_QKS.network, "latestBlock", key] as const,
} as const;

// ────────────────────────────────────────────────────────────────────────────────
// AGGREGATE QUERY KEYS
// ────────────────────────────────────────────────────────────────────────────────

export const queryKeys = {
  tractor: tractorQueryKeys,
  events: eventsQueryKeys,
  network: networkQueryKeys,
} as const;
