import { TV } from "@/classes/TokenValue";
import { Token } from "@/utils/types";
import { HashString } from "@/utils/types.generic";
import { Address } from "viem";

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

// TRACTOR API RESPONSE TYPES

export type TractorSowOrderType = "SOW_V0";

export type TractorAPIOrderType = TractorSowOrderType;

export interface TractorAPIResponseExecution<Time extends string | number | Date = Date> {
  executionCount: number;
  latestExecution: Time | null;
}

export interface TractorAPIResponseSowOrderBlueprint<
  Value extends string | TV = TV,
  BlockTimeDiff extends string | number = number,
  TokenStrategy extends string[] | SowOrderTokenStrategy = SowOrderTokenStrategy,
> {
  blueprintHash: HashString;
  pintoSownCounter: Value;
  lastExecutedSeason: number;
  orderComplete: boolean;
  amountFunded: Value;
  cascadeAmountFunded: Value;
  sourceTokenIndices: TokenStrategy;
  totalAmountToSow: Value;
  minAmountToSowPerSeason: Value;
  maxAmountToSowPerSeason: Value;
  minTemp: Value;
  maxPodlineLength: Value;
  maxGrownStalkPerBdv: Value;
  runBlocksAfterSunrise: BlockTimeDiff;
  slippageRatio: Value;
}

export interface TractorAPIResponseOrder<
  Value extends string | TV = TV,
  BlockTime extends string | number = number,
  Time extends string | number | Date = Date,
  TokenStrategy extends string[] | SowOrderTokenStrategy = SowOrderTokenStrategy,
> {
  blueprintHash: HashString;
  orderType: TractorAPIOrderType;
  publisher: HashString;
  data: HashString;
  operatorPasteInstrs: HashString[];
  maxNonce: string;
  startTime: Time;
  endTime: Time;
  signature: HashString;
  publishedTimestamp: Time;
  publishedBlock: number;
  beanTip: Value;
  cancelled: boolean;
  blueprintData: TractorAPIResponseSowOrderBlueprint<Value, BlockTime, TokenStrategy>;
  executionStats: TractorAPIResponseExecution<Time>;
}

export interface TractorOrdersAPIResponse<
  Value extends string | TV = TV,
  BlockTimeOrBlockDiff extends string | number = number,
  Time extends string | number | Date = Date,
  TokenStrategy extends string[] | SowOrderTokenStrategy = SowOrderTokenStrategy,
> {
  lastUpdated: BlockTimeOrBlockDiff;
  orders: TractorAPIResponseOrder<Value, BlockTimeOrBlockDiff, Time, TokenStrategy>[];
  totalRecords: number;
}
