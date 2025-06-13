import { Token } from "@/utils/types";

import { AdvancedFarmWorkflow } from "@/lib/farm/workflow";
import { SiloConvertContext } from "@/lib/siloConvert/types";
import { ExtendedPickedCratesDetails } from "@/utils/convert";
import { ConvertStrategyQuote, SiloConvertType } from "./types";

export abstract class SiloConvertStrategy<T extends SiloConvertType> {
  readonly context: SiloConvertContext;

  readonly sourceToken: Token;

  readonly targetToken: Token;

  constructor(source: Token, target: Token, context: SiloConvertContext) {
    this.sourceToken = source;
    this.targetToken = target;
    this.context = context;
  }

  abstract quote(
    deposits: ExtendedPickedCratesDetails,
    advancedFarm: AdvancedFarmWorkflow,
    slippage: number,
  ): Promise<ConvertStrategyQuote<T>>;
}
