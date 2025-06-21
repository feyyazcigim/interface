import { Clipboard } from "@/classes/Clipboard";
import { TV } from "@/classes/TokenValue";
import { abiSnippets } from "@/constants/abiSnippets";
import { PIPELINE_ADDRESS } from "@/constants/address";
import { AdvancedFarmWorkflow, AdvancedPipeWorkflow } from "@/lib/farm/workflow";
import { ExtendedPickedCratesDetails } from "@/utils/convert";
import { tokensEqual } from "@/utils/token";
import { Token } from "@/utils/types";

import { decodeFunctionResult, encodeFunctionData } from "viem";

import encoders from "@/encoders";
import { HashString } from "@/utils/types.generic";
import { throwIfAborted } from "@/utils/utils";
import { LP2LPStrategy } from "../core/LP2LPConvertStrategy";
import { ConvertStrategyQuote } from "../core/types";

class OneSidedSameToken extends LP2LPStrategy {
  readonly name = "LP2LP_SingleSidedMainToken";

  // The index of the token in the well to remove liquidity from.
  readonly removeIndex: number;

  // The index of the token in the well to add liquidity to.
  readonly addIndex: number;

  // Token that is being removed and added from and to the two wells
  readonly token: Token;

  constructor(...args: ConstructorParameters<typeof LP2LPStrategy>) {
    super(...args);
    this.initErrorHandlerCtx();

    this.removeIndex = this.sourceIndexes.main;
    this.addIndex = this.targetIndexes.main;

    const removeToken = this.sourceWell.tokens[this.removeIndex];
    const addToken = this.targetWell.tokens[this.addIndex];

    this.errorHandler.assert(
      tokensEqual(removeToken, addToken),
      "Remove and add indexes must point to the same token",
      {
        removeToken: removeToken.symbol,
        addToken: addToken.symbol,
        removeIndex: this.removeIndex,
        addIndex: this.addIndex,
      },
    );

    this.token = removeToken;
  }

  // ------------------------------ Quote ------------------------------ //

  async quote(
    deposits: ExtendedPickedCratesDetails,
    advancedFarm: AdvancedFarmWorkflow,
    slippage: number,
    signal?: AbortSignal,
  ) {
    // Check if already aborted
    throwIfAborted(signal);
    // Validation
    this.validateQuoteArgs(deposits, slippage);

    const result = await this.errorHandler.wrapAsync(
      () => this.getRemoveAddLiquidityOut(deposits, advancedFarm),
      "remove and add liquidity simulation",
      { amountIn: deposits.totalAmount.toHuman() },
    );

    // Check if aborted after async operation
    throwIfAborted(signal);

    const summary = {
      source: {
        token: this.sourceWell.pool,
        removeTokens: [this.sourceWell.tokens[this.sourceIndexes.main]],
        well: this.sourceWell,
        amountIn: deposits.totalAmount,
        amountOut: result.removeAmountsOut,
        minAmountOut: result.removeAmountsOut.map((amount) => amount.subSlippage(slippage)),
      },
      target: {
        token: this.targetWell.pool,
        addTokens: [this.targetWell.tokens[this.targetIndexes.main]],
        well: this.targetWell,
        amountOut: result.addAmountOut,
        minAmountOut: result.addAmountOut.subSlippage(slippage),
      },
    };

    return {
      pickedCrates: deposits,
      summary,
      advPipeCalls: this.errorHandler.wrap(() => this.buildAdvancedPipeCalls(summary), "build advanced pipe calls", {
        sourceWell: this.sourceWell.pool.symbol,
        targetWell: this.targetWell.pool.symbol,
      }),
      amountOut: result.addAmountOut,
      convertData: undefined,
    };
  }

  // ------------------------------ Build Advanced Pipe Calls ------------------------------ //

  buildAdvancedPipeCalls({ source, target }: ConvertStrategyQuote<"LP2LP">["summary"]) {
    // Validation
    this.errorHandler.assert(!!source.well, "Source well is required", { hasSourceWell: !!source.well });
    this.errorHandler.assert(!!target.well, "Target well is required", { hasTargetWell: !!target.well });
    this.errorHandler.validateAmount(source.amountIn, "source amount in");
    this.errorHandler.validateAmount(target.minAmountOut, "target min amount out");

    const pipe = new AdvancedPipeWorkflow(this.context.chainId, this.context.wagmiConfig);

    // 0. approve sourceWell to use sourceWell.LPToken in Pipeline (max)
    pipe.add(OneSidedSameToken.snippets.erc20Approve(source.well.pool, source.well.pool.address));

    // 1. remove liquidity from sourceWell
    pipe.add(
      OneSidedSameToken.snippets.removeLiquidityOneToken(
        source.well,
        source.amountIn,
        this.token,
        source.minAmountOut[this.removeIndex],
        PIPELINE_ADDRESS,
      ),
    );

    // 2. approve targetWell to use add token in Pipeline (max)
    pipe.add(OneSidedSameToken.snippets.erc20Approve(target.well.pool, target.well.pool.address));

    // 3. transfer from token we removed to targetWell
    pipe.add(
      OneSidedSameToken.snippets.erc20Transfer(
        source.well.tokens[this.removeIndex],
        target.well.pool.address,
        TV.MAX_UINT256, // this amount will be replaced via clipboard
        Clipboard.encodeSlot(1, 0, 1), // amountOut from removeLiquidityOneToken is in index 1
      ),
    );

    pipe.add(OneSidedSameToken.snippets.wellSync(target.well, PIPELINE_ADDRESS, target.minAmountOut));

    return pipe;
  }

  /// ---------- Private methods ----------

  /**
   * @param pickedCratesDetails - The details of the picked crates.
   * @param advancedFarm - The advanced farm workflow. Quote is done w/ subsequent actions in the workflow for most precision.
   * @returns The remove and add liquidity amounts.
   */
  private async getRemoveAddLiquidityOut(
    pickedCratesDetails: ExtendedPickedCratesDetails,
    advancedFarm: AdvancedFarmWorkflow,
  ) {
    // Validation
    this.errorHandler.validateAmount(pickedCratesDetails.totalAmount, "remove add liquidity amount");

    const pipe = this.errorHandler.wrap(
      () => this.constructReadAdvancedPipe(pickedCratesDetails.totalAmount),
      "construct read advanced pipe",
      { amountIn: pickedCratesDetails.totalAmount.toHuman() },
    );

    const result = await this.errorHandler.wrapAsync(
      () =>
        advancedFarm.simulate({
          after: pipe,
          account: this.context.account,
        }),
      "remove add liquidity simulation",
      { amountIn: pickedCratesDetails.totalAmount.toHuman(), account: this.context.account },
    );

    // Validate simulation results
    this.errorHandler.validateSimulation(result, "remove add liquidity simulation");

    const decodedResults = this.errorHandler.wrap(
      () => this.decodeAddRemoveResult(result.result),
      "decode remove add liquidity result",
      { resultLength: result.result.length },
    );

    const removeAmount = this.errorHandler.wrap(
      () => TV.fromBlockchain(decodedResults.removeLiquidityResult, this.token.decimals),
      "convert remove liquidity amount",
      { token: this.token.symbol, decimals: this.token.decimals },
    );

    const removeAmountsOut = [removeAmount, TV.ZERO];

    if (this.removeIndex === 1) {
      removeAmountsOut.reverse();
    }

    const addAmountOut = this.errorHandler.wrap(
      () => TV.fromBlockchain(decodedResults.addLiquidityResult, this.targetWell.pool.decimals),
      "convert add liquidity amount out",
      { targetWell: this.targetWell.pool.symbol, decimals: this.targetWell.pool.decimals },
    );

    return {
      removeAmountsOut,
      addAmountOut,
    };
  }

  /**
   * Decodes the result of the remove and add liquidity operations from getRemoveAddLiquidityOut
   */
  private decodeAddRemoveResult(data: readonly HashString[]) {
    this.errorHandler.assert(data.length > 0, "No data to decode", {
      dataLength: data.length,
    });

    const decoded = this.errorHandler.wrap(
      () =>
        decodeFunctionResult({
          abi: abiSnippets.advancedPipe,
          functionName: "advancedPipe",
          data: data[0],
        }),
      "decode advanced pipe result",
      { dataLength: data.length },
    );

    const len = decoded.length;
    this.errorHandler.assert(len >= 2, "Decoded result must have at least 2 elements", {
      decodedLength: len,
    });

    const removeAmountBigInt = this.errorHandler.wrap(
      () =>
        decodeFunctionResult({
          abi: abiSnippets.wells.getRemoveLiquidityOneTokenOut,
          functionName: "getRemoveLiquidityOneTokenOut",
          data: decoded[len - 2], // 2nd to last index
        }),
      "decode remove liquidity one token result",
      { decodedLength: len },
    );

    const addAmountOutBigInt = this.errorHandler.wrap(
      () =>
        decodeFunctionResult({
          abi: abiSnippets.wells.getAddLiquidityOut,
          functionName: "getAddLiquidityOut",
          data: decoded[len - 1], // last index
        }),
      "decode add liquidity result",
      { decodedLength: len },
    );

    return {
      removeLiquidityResult: removeAmountBigInt,
      addLiquidityResult: addAmountOutBigInt,
    };
  }

  private constructReadAdvancedPipe(amountIn: TV) {
    // Validation
    this.errorHandler.validateAmount(amountIn, "construct read pipe amount in");
    this.errorHandler.assert(
      this.removeIndex >= 0 && this.removeIndex < this.sourceWell.tokens.length,
      "Remove index is out of bounds",
      { removeIndex: this.removeIndex, sourceTokensLength: this.sourceWell.tokens.length },
    );

    const pipe = new AdvancedPipeWorkflow(this.context.chainId, this.context.wagmiConfig);

    pipe.add(
      encoders.well.getRemoveLiquidityOneTokenOut(
        this.sourceWell.pool,
        this.sourceWell.tokens[this.removeIndex],
        amountIn,
      ),
    );

    pipe.add(
      encoders.well.getAddLiquidityOut(
        this.targetWell.pool,
        [0n, 0n],
        // Parameter is an array, and we want to copy to the first index of the array.
        // Paste to index 2 b/c 1 is the length of the array, 2 is index 0, and 3 is index 1
        Clipboard.encodeSlot(0, 0, 2),
      ),
    );

    return pipe;
  }
}

export { OneSidedSameToken as SiloConvertLP2LPSingleSidedMainTokenStrategy };
