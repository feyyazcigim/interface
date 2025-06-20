import { Clipboard } from "@/classes/Clipboard";
import { TV } from "@/classes/TokenValue";
import { abiSnippets } from "@/constants/abiSnippets";
import { PIPELINE_ADDRESS } from "@/constants/address";
import { pipelineAddress } from "@/generated/contractHooks";
import { AdvancedFarmWorkflow, AdvancedPipeWorkflow } from "@/lib/farm/workflow";
import { ZeroX } from "@/lib/matcha/ZeroX";
import { ZeroXQuoteV2Response } from "@/lib/matcha/types";
import { resolveChainId } from "@/utils/chain";
import { ExtendedPickedCratesDetails } from "@/utils/convert";
import { tokensEqual } from "@/utils/token";
import { Token } from "@/utils/types";
import { HashString } from "@/utils/types.generic";
import { decodeFunctionResult, encodeFunctionData } from "viem";

import { SiloConvertSwapQuoter } from "@/lib/siloConvert/siloConvert.swapQuoter";
import {
  ConvertStrategyQuote,
  ConvertStrategyWithSwap,
  LP2LPStrategy,
  SiloConvertLP2LPConvertStrategy,
} from "@/lib/siloConvert/strategies/core";

class OneSidedPairToken extends LP2LPStrategy implements ConvertStrategyWithSwap {
  readonly name = "LP2LP_SingleSidedPairToken";

  swapQuoter: SiloConvertSwapQuoter;

  // The index of the token in the well to remove liquidity from.
  readonly removeIndex: number;

  // The index of the token in the well to add liquidity to.
  readonly addIndex: number;

  // The token to remove liquidity from.
  readonly removeToken: Token;

  // The token to add liquidity to.
  readonly addToken: Token;

  constructor(...args: ConstructorParameters<typeof SiloConvertLP2LPConvertStrategy>) {
    super(...args);
    this.swapQuoter = new SiloConvertSwapQuoter(this.context);
    this.initErrorHandlerCtx();

    this.removeIndex = this.sourceIndexes.pair;
    this.addIndex = this.targetIndexes.pair;

    const removeToken = this.sourceWell.tokens[this.removeIndex];
    const addToken = this.targetWell.tokens[this.addIndex];

    this.errorHandler.assert(!removeToken.isMain, `Remove index ${this.removeIndex} must not be the main token`, {
      removeIndex: this.removeIndex,
      removeToken: removeToken.symbol,
      isMain: removeToken.isMain,
    });

    this.errorHandler.assert(!addToken.isMain, `Add index ${this.addIndex} must not be the main token`, {
      addIndex: this.addIndex,
      addToken: addToken.symbol,
      isMain: addToken.isMain,
    });

    this.errorHandler.assert(!tokensEqual(removeToken, addToken), "Remove and add indexes must be different tokens", {
      removeToken: removeToken.symbol,
      addToken: addToken.symbol,
      removeIndex: this.removeIndex,
      addIndex: this.addIndex,
    });

    this.removeToken = removeToken;
    this.addToken = addToken;
  }

  // ------------------------------ Quote ------------------------------ //

  async quote(deposits: ExtendedPickedCratesDetails, advancedFarm: AdvancedFarmWorkflow, slippage: number) {
    // Validation
    this.validateQuoteArgs(deposits, slippage);

    const amountsOut = await this.errorHandler.wrapAsync(
      () => this.getRemoveLiquidityOut(deposits, advancedFarm),
      "remove liquidity simulation",
      { amountIn: deposits.totalAmount.toHuman() },
    );

    const pairAmountOut = amountsOut[this.removeIndex];
    this.errorHandler.validateAmount(pairAmountOut, "pair amount out from remove liquidity");

    const swapParams = this.errorHandler.wrap(
      () => this.swapQuoter.generateSwapQuoteParams(this.addToken, this.removeToken, pairAmountOut, slippage),
      "generate swap quote params",
      {
        sellToken: this.removeToken.symbol,
        buyToken: this.addToken.symbol,
        amount: pairAmountOut.toHuman(),
      },
    );

    // Swap
    const swapQuotes = await this.errorHandler.wrapAsync(() => ZeroX.quote(swapParams), "0x swap quotation", {
      sellToken: this.removeToken.symbol,
      buyToken: this.addToken.symbol,
      amount: pairAmountOut.toHuman(),
    });

    this.errorHandler.assert(swapQuotes.length === 1, "Expected exactly 1 swap quote from 0x", {
      quotesCount: swapQuotes.length,
    });

    console.debug("[SiloConvert/OneSidedPairToken] swapQuotes: ", {
      amountsOut,
      swapQuotes,
    });

    const addAmountOut = await this.errorHandler.wrapAsync(
      () => this.getAddLiquidityOut(swapQuotes[0], advancedFarm),
      "add liquidity simulation",
      { swapQuoteAmount: swapQuotes[0].minBuyAmount },
    );

    console.debug("[SiloConvert/OneSidedPairToken] addAmountOut: ", {
      addAmountOut: addAmountOut.toHuman(),
    });

    const swapSummary = this.errorHandler.wrap(
      () =>
        this.swapQuoter.makeSwapSummary(
          swapQuotes[0],
          this.removeToken,
          this.addToken,
          this.sourceWell.pair.price,
          this.targetWell.pair.price,
        ),
      "create swap summary",
      { sellToken: this.removeToken.symbol, buyToken: this.addToken.symbol },
    );

    const summary = {
      source: {
        token: this.sourceWell.pool,
        removeTokens: [this.removeToken],
        well: this.sourceWell,
        amountIn: deposits.totalAmount,
        amountOut: amountsOut,
        minAmountOut: amountsOut.map((amount) => amount.subSlippage(slippage)),
      },
      swap: swapSummary,
      target: {
        token: this.targetWell.pool,
        addTokens: [this.addToken],
        well: this.targetWell,
        amountOut: addAmountOut,
        minAmountOut: addAmountOut.subSlippage(slippage),
      },
    };

    return {
      pickedCrates: deposits,
      advPipeCalls: this.errorHandler.wrap(() => this.buildAdvancedPipeCalls(summary), "build advanced pipe calls", {
        sourceWell: this.sourceWell.pool.symbol,
        targetWell: this.targetWell.pool.symbol,
      }),
      amountOut: addAmountOut,
      summary,
    };
  }

  // ------------------------------ Build Advanced Pipe Calls ------------------------------ //

  buildAdvancedPipeCalls({ source, swap, target }: ConvertStrategyQuote<"LP2LP">["summary"]) {
    // Validation
    const validatedSwap = this.errorHandler.assertDefined(swap, "Swap is required for one sided pair token strategy");
    this.errorHandler.assert(!!source.well, "Source well is required", { hasSourceWell: !!source.well });
    this.errorHandler.assert(!!target.well, "Target well is required", { hasTargetWell: !!target.well });
    this.errorHandler.validateAmount(source.amountIn, "source amount in");
    this.errorHandler.validateAmount(target.minAmountOut, "target min amount out");

    const pipe = new AdvancedPipeWorkflow(this.context.chainId, this.context.wagmiConfig);

    // 0: approve from.well.lpToken to use from.well.lpToken
    pipe.add(OneSidedPairToken.snippets.erc20Approve(source.well.pool, source.well.pool.address));

    // 1. remove liquidity from from.well as removeToken
    pipe.add(
      OneSidedPairToken.snippets.removeLiquidityOneToken(
        source.well,
        source.amountIn,
        this.removeToken,
        source.minAmountOut[this.removeIndex],
        pipelineAddress[resolveChainId(this.context.chainId)],
      ),
    );

    // 2. approve swap contract to spend sellToken
    pipe.add(OneSidedPairToken.snippets.erc20Approve(validatedSwap.sellToken, validatedSwap.quote.transaction.to));

    // 3. swap removeToken for addToken via 0x
    pipe.add({
      target: validatedSwap.quote.transaction.to,
      callData: validatedSwap.quote.transaction.data,
      clipboard: Clipboard.encode([]),
    });

    // 4. get balance of buyToken
    pipe.add(
      OneSidedPairToken.snippets.erc20BalanceOf(
        validatedSwap.buyToken,
        pipelineAddress[resolveChainId(this.context.chainId)],
      ),
    );

    // 5. transfer swap result to target well
    pipe.add(
      OneSidedPairToken.snippets.erc20Transfer(
        validatedSwap.buyToken,
        target.well.pool.address,
        TV.MAX_UINT256, // overriden w/ clipboard
        Clipboard.encodeSlot(4, 0, 1),
      ),
    );

    // 6. call Sync on target well
    pipe.add(OneSidedPairToken.snippets.wellSync(target.well, PIPELINE_ADDRESS, target.minAmountOut));

    return pipe;
  }

  // ------------------------------ Private Methods ------------------------------ //

  private async getAddLiquidityOut(swapQuote: ZeroXQuoteV2Response, advancedFarm: AdvancedFarmWorkflow) {
    // Validation
    this.errorHandler.assert(!!swapQuote.minBuyAmount, "Swap quote minBuyAmount is required", {
      minBuyAmount: swapQuote.minBuyAmount,
    });

    const buyAmount = this.errorHandler.wrap(
      () => TV.fromBlockchain(swapQuote.minBuyAmount, this.addToken.decimals),
      "convert swap buy amount",
      { minBuyAmount: swapQuote.minBuyAmount, decimals: this.addToken.decimals },
    );

    const amountsIn = [TV.ZERO, buyAmount];
    if (this.addIndex === 0) {
      amountsIn.reverse();
    }

    const pipe = this.errorHandler.wrap(() => this.constructAddAdvancedPipe(amountsIn), "construct add advanced pipe", {
      amountsIn: amountsIn.map((v) => v.toHuman()),
    });

    const simulate = await this.errorHandler.wrapAsync(
      () =>
        advancedFarm.simulate({
          after: pipe,
          account: this.context.account,
        }),
      "add liquidity simulation",
      { amountsIn: amountsIn.map((v) => v.toHuman()), account: this.context.account },
    );

    // Validate simulation results
    this.errorHandler.validateSimulation(simulate, "add liquidity simulation");

    const addAmountOut = this.errorHandler.wrap(
      () => this.decodeAddLiquidityResult(simulate.result),
      "decode add liquidity result",
      { resultLength: simulate.result.length },
    );

    return this.errorHandler.wrap(
      () => TV.fromBigInt(addAmountOut, this.targetWell.pool.decimals),
      "convert add liquidity amount out",
      { addAmountOut: addAmountOut.toString(), decimals: this.targetWell.pool.decimals },
    );
  }

  private async getRemoveLiquidityOut(
    pickedCratesDetails: ExtendedPickedCratesDetails,
    advancedFarm: AdvancedFarmWorkflow,
  ): Promise<TV[]> {
    // Validation
    this.errorHandler.validateAmount(pickedCratesDetails.totalAmount, "remove liquidity amount");

    const pipe = this.errorHandler.wrap(
      () => this.constructRemoveAdvancedPipe(pickedCratesDetails.totalAmount),
      "construct remove advanced pipe",
      { amountIn: pickedCratesDetails.totalAmount.toHuman() },
    );

    const result = await this.errorHandler.wrapAsync(
      () =>
        advancedFarm.simulate({
          after: pipe,
          account: this.context.account,
        }),
      "remove liquidity simulation",
      { amountIn: pickedCratesDetails.totalAmount.toHuman(), account: this.context.account },
    );

    // Validate simulation results
    this.errorHandler.validateSimulation(result, "remove liquidity simulation");

    const decodedResults = this.errorHandler.wrap(
      () => this.decodeRemoveLiquidityResult(result.result),
      "decode remove liquidity result",
      { resultLength: result.result.length },
    );

    const amountsOut = this.errorHandler.wrap(
      () => {
        const amounts = [TV.ZERO, TV.fromBigInt(decodedResults, this.removeToken.decimals)];
        if (this.removeIndex === 0) {
          amounts.reverse();
        }
        return amounts;
      },
      "convert remove liquidity amounts out",
      { removeToken: this.removeToken.symbol, removeIndex: this.removeIndex },
    );

    return amountsOut;
  }

  // ------------------------------ Construct Advanced Pipe Methods ------------------------------ //

  private constructRemoveAdvancedPipe(amount: TV) {
    // Validation
    this.errorHandler.validateAmount(amount, "construct remove pipe amount");
    this.errorHandler.assert(
      this.removeIndex >= 0 && this.removeIndex < this.sourceWell.tokens.length,
      "Remove index is out of bounds",
      { removeIndex: this.removeIndex, sourceTokensLength: this.sourceWell.tokens.length },
    );

    const pipe = new AdvancedPipeWorkflow(this.context.chainId, this.context.wagmiConfig);

    const callData = this.errorHandler.wrap(
      () =>
        encodeFunctionData({
          abi: abiSnippets.wells.getRemoveLiquidityOneTokenOut,
          functionName: "getRemoveLiquidityOneTokenOut",
          args: [amount.toBigInt(), this.sourceWell.tokens[this.removeIndex].address],
        }),
      "encode remove liquidity one token call data",
      { amount: amount.toHuman(), removeIndex: this.removeIndex },
    );

    pipe.add({
      target: this.sourceWell.pool.address,
      callData,
      clipboard: Clipboard.encode([]),
    });

    return pipe;
  }

  private constructAddAdvancedPipe(amountsIn: TV[]) {
    // Validation
    this.errorHandler.assert(amountsIn.length > 0, "Add liquidity amounts array is empty", {
      amountsInLength: amountsIn.length,
    });
    amountsIn.forEach((amount, index) => {
      this.errorHandler.validateAmount(amount, `construct add pipe amount[${index}]`, { index });
    });

    const pipe = new AdvancedPipeWorkflow(this.context.chainId, this.context.wagmiConfig);

    const callData = this.errorHandler.wrap(
      () =>
        encodeFunctionData({
          abi: abiSnippets.wells.getAddLiquidityOut,
          functionName: "getAddLiquidityOut",
          args: [amountsIn.map((v) => v.toBigInt())],
        }),
      "encode add liquidity call data",
      { amountsIn: amountsIn.map((v) => v.toHuman()) },
    );

    pipe.add({
      target: this.targetWell.pool.address,
      callData,
      clipboard: Clipboard.encode([]),
    });

    return pipe;
  }

  // ------------------------------ Decode Methods ------------------------------ //

  private decodeRemoveLiquidityResult(data: readonly HashString[]): bigint {
    this.errorHandler.assert(data.length > 0, "No data to decode for remove liquidity", {
      dataLength: data.length,
    });

    const decoded = this.errorHandler.wrap(
      () => AdvancedPipeWorkflow.decodeResult(data[data.length - 1]),
      "decode advanced pipe result for remove liquidity",
      { dataLength: data.length },
    );

    this.errorHandler.assert(decoded.length > 0, "Decoded result is empty for remove liquidity", {
      decodedLength: decoded.length,
    });

    const removeAmountBigInt = this.errorHandler.wrap(
      () =>
        decodeFunctionResult({
          abi: abiSnippets.wells.getRemoveLiquidityOneTokenOut,
          functionName: "getRemoveLiquidityOneTokenOut",
          data: decoded[decoded.length - 1], // Last index
        }),
      "decode remove liquidity one token result",
      { decodedLength: decoded.length },
    );

    return removeAmountBigInt;
  }

  private decodeAddLiquidityResult(data: readonly HashString[]): bigint {
    this.errorHandler.assert(data.length > 0, "No data to decode for add liquidity", {
      dataLength: data.length,
    });

    const decoded = this.errorHandler.wrap(
      () => AdvancedPipeWorkflow.decodeResult(data[data.length - 1]),
      "decode advanced pipe result for add liquidity",
      { dataLength: data.length },
    );

    this.errorHandler.assert(decoded.length > 0, "Decoded result is empty for add liquidity", {
      decodedLength: decoded.length,
    });

    return this.errorHandler.wrap(
      () =>
        decodeFunctionResult({
          abi: abiSnippets.wells.getAddLiquidityOut,
          functionName: "getAddLiquidityOut",
          data: decoded[decoded.length - 1],
        }),
      "decode add liquidity result",
      { decodedLength: decoded.length },
    );
  }
}

export { OneSidedPairToken as SiloConvertLP2LPSingleSidedPairTokenStrategy };
