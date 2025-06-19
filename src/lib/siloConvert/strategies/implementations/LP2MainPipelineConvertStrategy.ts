import { Clipboard } from "@/classes/Clipboard";
import { TV } from "@/classes/TokenValue";
import { abiSnippets } from "@/constants/abiSnippets";
import { PIPELINE_ADDRESS } from "@/constants/address";
import { AdvancedFarmWorkflow, AdvancedPipeWorkflow } from "@/lib/farm/workflow";
import { ZeroX } from "@/lib/matcha/ZeroX";
import { ExtendedPoolData } from "@/lib/siloConvert/SiloConvert.cache";
import { SiloConvertSwapQuoter } from "@/lib/siloConvert/siloConvert.swapQuoter";
import {
  ConvertQuoteSummary,
  ConvertStrategyQuote,
  ConvertStrategyWithSwap,
  PipelineConvertStrategy,
} from "@/lib/siloConvert/strategies/core";
import { SiloConvertContext } from "@/lib/siloConvert/types";
import { ExtendedPickedCratesDetails } from "@/utils/convert";
import { Token } from "@/utils/types";
import { HashString } from "@/utils/types.generic";
import { decodeFunctionResult, encodeFunctionData } from "viem";

/**
 * Strategy for converting from LP -> Main Token
 *
 * Uses PipelineConvert to convert from LP -> Main Token
 *
 * Strategy:
 *  -> remove in equal proportions from LP
 *  -> swap pair token for main token via dex aggregator
 *  -> deposit main token into silo
 */

class LP2MainStrategy extends PipelineConvertStrategy<"LP2MainPipeline"> implements ConvertStrategyWithSwap {
  swapQuoter: SiloConvertSwapQuoter;

  readonly sourceWell: ExtendedPoolData;

  constructor(source: ExtendedPoolData, target: Token, context: SiloConvertContext) {
    super(source.pool, target, context);

    this.swapQuoter = new SiloConvertSwapQuoter(context);
    this.sourceWell = source;
  }

  get sourceIndexes() {
    const pairIndex = this.sourceWell.pair.index;
    return {
      pair: pairIndex,
      main: pairIndex === 1 ? 0 : 1,
    };
  }

  private get pairToken() {
    return this.sourceWell.tokens[this.sourceIndexes.pair];
  }

  async quote(
    deposits: ExtendedPickedCratesDetails,
    advancedFarm: AdvancedFarmWorkflow,
    slippage: number,
  ): Promise<ConvertStrategyQuote<"LP2MainPipeline">> {
    // Validation
    this.validateQuoteArgs(deposits, slippage);

    // Remove liquidity in equal proportions
    const removeLPResult = await this.errorHandler.wrapAsync(
      () => this.getRemoveLiquidityOut(deposits, advancedFarm),
      "remove liquidity simulation",
      { amountIn: deposits.totalAmount.toHuman() },
    );

    const mainTokenAmountRemoved = removeLPResult[this.sourceIndexes.main];
    this.errorHandler.validateAmount(mainTokenAmountRemoved, "main token amount from remove liquidity");

    const pairAmount = removeLPResult[this.sourceIndexes.pair];
    this.errorHandler.validateAmount(pairAmount, "pair token amount from remove liquidity");

    const swapParams = this.errorHandler.wrap(
      () => this.swapQuoter.generateSwapQuoteParams(this.targetToken, this.pairToken, pairAmount, slippage, false),
      "generate swap quote params",
      {
        sellToken: this.pairToken.symbol,
        buyToken: this.targetToken.symbol,
        amount: pairAmount.toHuman(),
      },
    );

    const swapQuotes = await this.errorHandler.wrapAsync(() => ZeroX.quote(swapParams), "0x swap quotation", {
      sellToken: this.pairToken.symbol,
      buyToken: this.targetToken.symbol,
      amount: pairAmount.toHuman(),
    });

    // Should always be the 1 quote b/c we are going from pair token -> main token.
    this.errorHandler.assert(swapQuotes.length === 1, "Expected exactly 1 swap quote from 0x", {
      quotesCount: swapQuotes.length,
    });

    const swapQuote = swapQuotes[0];

    const swapSummary = this.errorHandler.wrap(
      () =>
        this.swapQuoter.makeSwapSummary(
          swapQuote,
          this.pairToken,
          this.targetToken,
          this.sourceWell.pair.price,
          this.sourceWell.price, // TODO: get price of main token after the swap... fix me.
        ),
      "create swap summary",
      { sellToken: this.pairToken.symbol, buyToken: this.targetToken.symbol },
    );

    const totalAmountOut = this.errorHandler.wrap(
      () => swapSummary.buyAmount.add(mainTokenAmountRemoved),
      "calculate total amount out",
      {
        swapBuyAmount: swapSummary.buyAmount.toHuman(),
        mainTokenRemoved: mainTokenAmountRemoved.toHuman(),
      },
    );

    const summary: ConvertQuoteSummary<"LP2MainPipeline"> = {
      source: {
        token: this.sourceWell.pool,
        removeTokens: this.sourceWell.tokens,
        well: this.sourceWell,
        amountIn: deposits.totalAmount,
        amountOut: removeLPResult,
        minAmountOut: removeLPResult.map((amount) => amount.subSlippage(slippage)),
      },
      swap: swapSummary,
      target: {
        token: this.targetToken,
        amountOut: totalAmountOut,
      },
    };

    return {
      pickedCrates: deposits,
      summary,
      advPipeCalls: this.errorHandler.wrap(() => this.buildAdvancedPipeCalls(summary), "build advanced pipe calls", {
        sourceWell: this.sourceWell.pool.symbol,
        targetToken: this.targetToken.symbol,
      }),
      amountOut: totalAmountOut,
      convertData: undefined,
    };
  }

  buildAdvancedPipeCalls({ source, swap }: ConvertStrategyQuote<"LP2MainPipeline">["summary"]) {
    // Validation
    const validatedSwap = this.errorHandler.assertDefined(swap, "Swap required for LP2MainPipeline Strategy");
    this.errorHandler.assert(!!source.well, "Source well is required", { hasSourceWell: !!source.well });
    this.errorHandler.validateAmount(source.amountIn, "source amount in");

    const pipe = new AdvancedPipeWorkflow(this.context.chainId, this.context.wagmiConfig);

    // 1. Approve source well to use LP token
    pipe.add(LP2MainStrategy.snippets.erc20Approve(source.well.pool, source.well.pool.address));

    // 2. Remove liquidity in equal proportions
    pipe.add(
      LP2MainStrategy.snippets.removeLiquidity(source.well, source.amountIn, source.minAmountOut, PIPELINE_ADDRESS),
    );

    // 3. Approve swap contract to spend main token
    pipe.add(LP2MainStrategy.snippets.erc20Approve(validatedSwap.sellToken, validatedSwap.quote.transaction.to));

    // 4. Swap pair token for PINTO
    pipe.add({
      target: validatedSwap.quote.transaction.to,
      callData: validatedSwap.quote.transaction.data,
      clipboard: Clipboard.encode([]),
    });

    return pipe;
  }

  async getRemoveLiquidityOut(
    pickedCratesDetails: ExtendedPickedCratesDetails,
    advancedFarm: AdvancedFarmWorkflow,
  ): Promise<TV[]> {
    // Validation
    this.errorHandler.validateAmount(pickedCratesDetails.totalAmount, "remove liquidity amount");

    const pipe = new AdvancedPipeWorkflow(this.context.chainId, this.context.wagmiConfig);
    const [token0, token1] = this.sourceWell.tokens;

    const callData = this.errorHandler.wrap(
      () =>
        encodeFunctionData({
          abi: abiSnippets.wells.getRemoveLiquidityOut,
          functionName: "getRemoveLiquidityOut",
          args: [pickedCratesDetails.totalAmount.toBigInt()],
        }),
      "encode remove liquidity call data",
      { amountIn: pickedCratesDetails.totalAmount.toHuman() },
    );

    pipe.add({
      target: this.sourceWell.pool.address,
      callData,
      clipboard: Clipboard.encode([]),
    });

    const simulate = await this.errorHandler.wrapAsync(
      () =>
        advancedFarm.simulate({
          after: pipe,
          account: this.context.account,
        }),
      "remove liquidity simulation",
      { amountIn: pickedCratesDetails.totalAmount.toHuman(), account: this.context.account },
    );

    // Validate simulation results
    this.errorHandler.validateSimulation(simulate, "remove liquidity simulation");

    const result = this.errorHandler.wrap(
      () => this.decodeRemoveLiquidityResult(simulate.result),
      "decode remove liquidity result",
      { resultLength: simulate.result.length },
    );

    const amounts: TV[] = this.errorHandler.wrap(
      () => [TV.fromBigInt(result[0], token0.decimals), TV.fromBigInt(result[1], token1.decimals)],
      "convert remove liquidity amounts",
      { token0: token0.symbol, token1: token1.symbol },
    );

    console.debug("[LP2MainPipelineStrategy] getRemoveLiquidityOut: ", {
      well: this.sourceWell.pool.name,
      amountIn: pickedCratesDetails.totalAmount,
      amountsOut: amounts,
    });

    return amounts;
  }

  private decodeRemoveLiquidityResult(data: readonly HashString[]) {
    this.errorHandler.assert(data.length > 0, "Remove liquidity result data is empty", {
      dataLength: data.length,
    });

    const decoded = this.errorHandler.wrap(
      () =>
        decodeFunctionResult({
          abi: abiSnippets.advancedPipe,
          functionName: "advancedPipe",
          data: data[data.length - 1],
        }),
      "decode advanced pipe result",
      { dataLength: data.length },
    );

    this.errorHandler.assert(decoded.length > 0, "Decoded advanced pipe result is empty", {
      decodedLength: decoded.length,
    });

    const removeLiquidityResult = this.errorHandler.wrap(
      () =>
        decodeFunctionResult({
          abi: abiSnippets.wells.getRemoveLiquidityOut,
          functionName: "getRemoveLiquidityOut",
          data: decoded[decoded.length - 1],
        }),
      "decode remove liquidity result",
      { decodedLength: decoded.length },
    );

    return removeLiquidityResult;
  }
}

export { LP2MainStrategy as SiloConvertLP2MainPipelineConvertStrategy };
