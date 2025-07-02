import { TV } from "@/classes/TokenValue";
import { AdvancedPipeWorkflow } from "@/lib/farm/workflow";
import { ExtendedPoolData } from "@/lib/siloConvert/SiloConvert.cache";
import {
  IConvertQuoteMaySwap,
  SiloConvertSwapQuote,
  SiloConvertSwapQuoter,
} from "@/lib/siloConvert/siloConvert.swapQuoter";
import { ExtendedPickedCratesDetails } from "@/utils/convert";
import { Token } from "@/utils/types";
import { HashString, Prettify } from "@/utils/types.generic";

export type SiloConvertType = "LP2LP" | "LPAndMain" | "LP2MainPipeline";

type ISourceAndTarget<T, K> = IConvertQuoteMaySwap & {
  source: T;
  target: K;
};

interface BaseConvertSourceSummary {
  token: Token;
  amountIn: TV;
}

interface BaseConvertTargetSummary {
  token: Token;
  amountOut: TV;
}

interface LP2LPConvertSourceSummary extends BaseConvertSourceSummary {
  well: ExtendedPoolData;
  removeTokens: Token[];
  amountOut: TV[];
  minAmountOut: TV[];
}

interface LP2LPConvertTargetSummary extends BaseConvertTargetSummary {
  well: ExtendedPoolData;
  addTokens: Token[];
  minAmountOut: TV;
}

export type ConvertSummariesLookup = {
  LP2LP: ISourceAndTarget<LP2LPConvertSourceSummary, LP2LPConvertTargetSummary>;
  LPAndMain: ISourceAndTarget<BaseConvertSourceSummary, BaseConvertTargetSummary>;
  LP2MainPipeline: ISourceAndTarget<LP2LPConvertSourceSummary, BaseConvertTargetSummary>;
};

export type ConvertQuoteSummary<T extends SiloConvertType> = Prettify<{
  source: ConvertSummariesLookup[T]["source"];
  target: ConvertSummariesLookup[T]["target"];
  swap?: SiloConvertSwapQuote;
}>;

/**
 * The results of the convert.
 */
export type ConvertStrategyQuote<T extends SiloConvertType> = Prettify<{
  pickedCrates: ExtendedPickedCratesDetails;
  advPipeCalls: AdvancedPipeWorkflow | undefined;
  amountOut: TV;
  summary: ConvertQuoteSummary<T>;
  convertData?: HashString;
}>;

export interface ConvertStrategyWithSwap {
  swapQuoter: SiloConvertSwapQuoter;
}
