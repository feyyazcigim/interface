import { AdvancedFarmCall, Token } from "@/utils/types";

import { TV } from "@/classes/TokenValue";
import { AdvancedFarmWorkflow } from "@/lib/farm/workflow";
import { SiloConvertContext } from "@/lib/siloConvert/types";
import { ExtendedPickedCratesDetails } from "@/utils/convert";
import { AnyRecord } from "@/utils/types.generic";
import { ConvertStrategyErrorHandler } from "../validation/ConvertStrategyErrorHandler";
import { ConvertStrategyQuote, SiloConvertType } from "./types";

export abstract class SiloConvertStrategy<T extends SiloConvertType> {
  readonly context: SiloConvertContext;
  readonly sourceToken: Token;
  readonly targetToken: Token;

  abstract readonly name: string;

  // Error handler instance available to all strategies
  protected readonly errorHandler: ConvertStrategyErrorHandler;

  constructor(source: Token, target: Token, context: SiloConvertContext) {
    this.sourceToken = source;
    this.targetToken = target;
    this.context = context;
    this.errorHandler = new ConvertStrategyErrorHandler(source.symbol, target.symbol);
  }

  abstract quote(
    deposits: ExtendedPickedCratesDetails,
    advancedFarm: AdvancedFarmWorkflow,
    slippage: number,
    signal?: AbortSignal,
  ): Promise<ConvertStrategyQuote<T>>;

  // ------------------------------ Validation Methods ------------------------------ //

  abstract encodeFromQuote(quote: ConvertStrategyQuote<T>): AdvancedFarmCall;

  protected validateSlippage(slippage: number) {
    this.errorHandler.validateAmount(slippage, "slippage");
  }

  protected validateAmountIn(amountIn: TV) {
    this.errorHandler.validateAmount(amountIn, "amount in");
  }

  protected validatePickedCrates(data: ExtendedPickedCratesDetails) {
    this.errorHandler.assert(data.crates.length > 0, "No crates provided for conversion", {
      cratesCount: data.crates.length,
    });

    this.errorHandler.validateAmount(data.totalAmount, "total crates amount", { cratesCount: data.crates.length });
  }

  protected validateQuoteArgs(deposits: ExtendedPickedCratesDetails, slippage: number) {
    this.validatePickedCrates(deposits);
    this.validateAmountIn(deposits.totalAmount);
    this.validateSlippage(slippage);
  }

  protected initErrorHandlerCtx(moreCtx?: AnyRecord) {
    this.errorHandler.addCtx({
      objectName: this.name,
      ...(moreCtx ?? {}),
    });
  }
}
