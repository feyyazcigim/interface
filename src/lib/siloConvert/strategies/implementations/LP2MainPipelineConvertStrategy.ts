import { Clipboard } from "@/classes/Clipboard";
import { TV } from "@/classes/TokenValue";
import { abiSnippets } from "@/constants/abiSnippets";
import { PIPELINE_ADDRESS } from "@/constants/address";
import { pipelineAddress } from "@/generated/contractHooks";
import { AdvancedFarmWorkflow, AdvancedPipeWorkflow } from "@/lib/farm/workflow";
import { ZeroX } from "@/lib/matcha/ZeroX";
import { ZeroXQuoteV2Response } from "@/lib/matcha/types";
import { ExtendedPoolData } from "@/lib/siloConvert/SiloConvert.cache";
import { SiloConvertSwapQuote, SiloConvertSwapQuoter } from "@/lib/siloConvert/siloConvert.swapQuoter";
import {
  ConvertQuoteSummary,
  ConvertStrategyQuote,
  ConvertStrategyWithSwap,
  PipelineConvertStrategy,
} from "@/lib/siloConvert/strategies/core";
import { SiloConvertContext } from "@/lib/siloConvert/types";
import { resolveChainId } from "@/utils/chain";
import { ExtendedPickedCratesDetails } from "@/utils/convert";
import { AdvancedFarmCall, Token } from "@/utils/types";
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

  async quote(
    deposits: ExtendedPickedCratesDetails,
    advancedFarm: AdvancedFarmWorkflow,
    slippage: number,
  ): Promise<ConvertStrategyQuote<"LP2MainPipeline">> {
    this.validateQuoteArgs(deposits, slippage);

    // Remove liquidity in equal proportions
    // const removeLPResult = await this.#getRemoveLiquidityOut(deposits, advancedFarm);
    // const pairAmount = removeLPResult[this.pairIndex];

    // // Get swap quote for pair token -> PINTO
    // const swapParams = this.generateSwapQuoteParams(this.targetToken, this.pairToken, pairAmount, slippage);
    // const swapQuotes = await ZeroX.quote(swapParams);
    // if (swapQuotes.length !== 1) {
    //   throw new Error("Expected 1 swap quote");
    // }

    // const swapQuote = swapQuotes[0];
    // const pintoAmount = TV.fromBlockchain(swapQuote.minBuyAmount, this.targetToken.decimals);

    // const swapSummary = this.makeSwapSummary(
    //   swapQuote,
    //   this.pairToken,
    //   this.targetToken,
    //   this.sourceWell.pair.price,
    //   TV.fromHuman("1", 6), // PINTO price is $1
    // );

    // const summary: ConvertQuoteSummary<"LPAndMain"> = {
    //   source: {
    //     token: this.sourceToken,
    //     removeTokens: this.sourceWell.tokens,
    //     well: this.sourceWell,
    //     amountIn: deposits.totalAmount,
    //     amountOut: removeLPResult,
    //     minAmountOut: removeLPResult.map((amount) => amount.subSlippage(slippage)),
    //   },
    //   swap: swapSummary,
    //   target: {
    //     token: this.targetToken,
    //     addTokens: [this.targetToken],
    //     well: this.targetWell,
    //     amountOut: pintoAmount,
    //     minAmountOut: pintoAmount.subSlippage(slippage),
    //   },
    // };

    // return {
    //   pickedCrates: deposits,
    //   advPipeCalls: this.buildAdvancedPipeCalls(summary),
    //   amountOut: pintoAmount,
    //   summary,
    // };

    throw new Error("Not implemented");
  }

  encodeConvertResults(quote: ConvertStrategyQuote<"LPAndMain">): AdvancedFarmCall {
    throw new Error("Not implemented");
  }

  buildAdvancedPipeCalls({ source, swap, target }: ConvertStrategyQuote<"LPAndMain">["summary"]) {
    if (!swap) {
      throw new Error("Swap is required for LP2PINTO below dollar strategy");
    }

    const pipe = new AdvancedPipeWorkflow(this.context.chainId, this.context.wagmiConfig);

    // // 1. Approve source well to use LP token
    // pipe.add(LP2MainStrategy.snippets.erc20Approve(source.well.pool, source.well.pool.address));

    // // 2. Remove liquidity in equal proportions
    // pipe.add(
    //   LP2MainStrategy.snippets.removeLiquidity(
    //     source.well,
    //     source.amountIn,
    //     source.minAmountOut,
    //     PIPELINE_ADDRESS,
    //   ),
    // );

    // // 3. Approve swap contract to spend pair token
    // pipe.add(LP2MainStrategy.snippets.erc20Approve(swap.sellToken, swap.quote.transaction.to));

    // // 4. Swap pair token for PINTO
    // pipe.add({
    //   target: swap.quote.transaction.to,
    //   callData: swap.quote.transaction.data,
    //   clipboard: Clipboard.encode([]),
    // });

    // // 5. Get balance of PINTO
    // pipe.add(
    //   LP2PINTOBelowDollarStrategy.snippets.erc20BalanceOf(
    //     swap.buyToken,
    //     pipelineAddress[resolveChainId(this.context.chainId)],
    //   ),
    // );

    // // 6. Transfer PINTO to Silo
    // pipe.add(
    //   LP2PINTOBelowDollarStrategy.snippets.erc20Transfer(
    //     swap.buyToken,
    //     this.context.diamond,
    //     TV.MAX_UINT256, // overriden w/ clipboard
    //     Clipboard.encodeSlot(4, 0, 1),
    //   ),
    // );

    return pipe;
  }

  async #getRemoveLiquidityOut(
    pickedCratesDetails: ExtendedPickedCratesDetails,
    advancedFarm: AdvancedFarmWorkflow,
  ): Promise<TV[]> {
    // const pipe = new AdvancedPipeWorkflow(this.context.chainId, this.context.wagmiConfig);
    // const [token0, token1] = this.sourceWell.tokens;

    // pipe.add({
    //   target: this.sourceWell.pool.address,
    //   callData: encodeFunctionData({
    //     abi: abiSnippets.wells.getRemoveLiquidityOut,
    //     functionName: "getRemoveLiquidityOut",
    //     args: [pickedCratesDetails.totalAmount.toBigInt()],
    //   }),
    //   clipboard: Clipboard.encode([]),
    // });

    // const simulate = await advancedFarm.simulate({
    //   after: pipe,
    //   account: this.context.account,
    // });

    // const result = this.#decodeRemoveLiquidityResult(simulate.result);

    // const amounts: TV[] = [TV.fromBigInt(result[0], token0.decimals), TV.fromBigInt(result[1], token1.decimals)];

    // console.debug("[LP2PINTOBelowDollarStrategy] getRemoveLiquidityOut: ", {
    //   well: this.sourceWell.pool.name,
    //   amountIn: pickedCratesDetails.totalAmount,
    //   amountsOut: amounts,
    // });

    // return amounts;

    throw new Error("Not implemented");
  }

  #decodeRemoveLiquidityResult(data: readonly HashString[]) {
    const decoded = decodeFunctionResult({
      abi: abiSnippets.advancedPipe,
      functionName: "advancedPipe",
      data: data[data.length - 1],
    });

    const removeLiquidityResult = decodeFunctionResult({
      abi: abiSnippets.wells.getRemoveLiquidityOut,
      functionName: "getRemoveLiquidityOut",
      data: decoded[decoded.length - 1],
    });

    return removeLiquidityResult;
  }
}

export { LP2MainStrategy as SiloConvertLP2MainPipelineConvertStrategy };
