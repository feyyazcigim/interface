import { TV } from "@/classes/TokenValue";
import { HashString, Prettify } from "@/utils/types.generic";
import { Address } from "viem";
import { BaseTractorAPIResponse } from "./api";

export interface Blueprint {
  publisher: Address;
  data: `0x${string}`;
  operatorPasteInstrs: `0x${string}`[];
  maxNonce: bigint;
  startTime: bigint;
  endTime: bigint;
}

export interface Requisition {
  blueprint: Blueprint;
  blueprintHash: `0x${string}`;
  signature?: `0x${string}`;
}

export interface PublishedRequisition {
  blueprint: {
    publisher: string;
    data: string;
    maxNonce: bigint;
  };
  blueprintHash: string;
  blockNumber: number;
}

// Add the TokenStrategy type
export type SowOrderTokenStrategy =
  | { type: "LOWEST_SEEDS" }
  | { type: "LOWEST_PRICE" }
  | { type: "SPECIFIC_TOKEN"; address: `0x${string}` };

// ────────────────────────────────────────────────────────────────────────────────
// TRACTOR API RESPONSE TYPES
// ────────────────────────────────────────────────────────────────────────────────

export type TractorSowOrderType = "SOW_V0";

export type TractorAPIOrderType = TractorSowOrderType;

export type TractorAPIOrdersResponse = BaseTractorAPIResponse<{
  orders: TractorAPIOrder[];
}>;

export interface TractorAPIOrdersExecutionInfo {
  executionCount: number;
  latestExecution: string | null;
}

export interface TractorAPISowOrderBlueprint {
  blueprintHash: HashString;
  pintoSownCounter: string;
  lastExecutedSeason: number;
  orderComplete: boolean;
  amountFunded: string;
  cascadeAmountFunded: string;
  sourceTokenIndices: string[];
  totalAmountToSow: string;
  minAmountToSowPerSeason: string;
  maxAmountToSowPerSeason: string;
  minTemp: string;
  maxPodlineLength: string;
  maxGrownStalkPerBdv: string;
  runBlocksAfterSunrise: string;
  slippageRatio: string;
}

export interface TractorAPIOrder {
  blueprintHash: HashString;
  orderType: TractorAPIOrderType;
  publisher: HashString;
  data: HashString;
  operatorPasteInstrs: HashString[];
  maxNonce: string;
  startTime: string;
  endTime: string;
  signature: HashString;
  publishedTimestamp: string;
  publishedBlock: number;
  beanTip: string;
  cancelled: boolean;
  blueprintData: Blueprint;
  executionStats: TractorAPIOrdersExecutionInfo;
}
