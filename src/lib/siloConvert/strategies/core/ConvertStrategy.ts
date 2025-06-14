import { DepositData, Token } from "@/utils/types";

import { TV } from "@/classes/TokenValue";
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

  // ------------------------------ Validation Methods ------------------------------ //

  protected validateSlippage(slippage: number) {
    if (slippage < 0) {
      throw new Error("Invalid slippage");
    }
  }

  protected validateAmountIn(amountIn: TV) {
    if (amountIn.lte(0)) {
      throw new Error("Cannot convert 0 or less tokens");
    }
  }

  protected validatePickedCrates(data: ExtendedPickedCratesDetails) {
    const isValid = data.crates.length > 0;

    if (!isValid) {
      throw new Error("Invalid picked crates");
    }

    if (data.totalAmount.lte(0)) {
      throw new Error("Total amount is 0 or less");
    }
  }

  protected validateQuoteArgs(deposits: ExtendedPickedCratesDetails, slippage: number) {
    this.validatePickedCrates(deposits);
    this.validateAmountIn(deposits.totalAmount);
    this.validateSlippage(slippage);
  }
}
