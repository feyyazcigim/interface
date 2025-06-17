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
import { LP2LPStrategy } from "../core/LP2LPConvertStrategy";
import { ConvertStrategyQuote } from "../core/types";

class OneSidedSameToken extends LP2LPStrategy {
  // The index of the token in the well to remove liquidity from.
  readonly removeIndex: number;

  // The index of the token in the well to add liquidity to.
  readonly addIndex: number;

  // Token that is being removed and added from and to the two wells
  readonly token: Token;

  constructor(...args: ConstructorParameters<typeof LP2LPStrategy>) {
    super(...args);
    this.removeIndex = this.sourceIndexes.main;
    this.addIndex = this.targetIndexes.main;

    const removeToken = this.sourceWell.tokens[this.removeIndex];
    const addToken = this.targetWell.tokens[this.addIndex];

    if (!tokensEqual(removeToken, addToken)) {
      throw new Error("Remove and add indexes must point to the same token");
    }

    this.token = removeToken;
  }

  // ------------------------------ Quote ------------------------------ //

  async quote(deposits: ExtendedPickedCratesDetails, advancedFarm: AdvancedFarmWorkflow, slippage: number) {
    this.validateQuoteArgs(deposits, slippage);

    const result = await this.#getRemoveAddLiquidityOut(deposits, advancedFarm);

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
      advPipeCalls: this.buildAdvancedPipeCalls(summary),
      amountOut: result.addAmountOut,
      convertData: undefined,
    };
  }

  // ------------------------------ Build Advanced Pipe Calls ------------------------------ //

  buildAdvancedPipeCalls({ source, target }: ConvertStrategyQuote<"LP2LP">["summary"]) {
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
  async #getRemoveAddLiquidityOut(
    pickedCratesDetails: ExtendedPickedCratesDetails,
    advancedFarm: AdvancedFarmWorkflow,
  ) {
    const pipe = this.#constructReadAdvancedPipe(pickedCratesDetails.totalAmount);

    const result = await advancedFarm.simulate({
      after: pipe,
      account: this.context.account,
    });

    const decodedResults = this.#decodeAddRemoveResult(result.result);

    const removeAmount = TV.fromBlockchain(decodedResults.removeLiquidityResult, this.token.decimals);
    const removeAmountsOut = [removeAmount, TV.ZERO];

    if (this.removeIndex === 1) {
      removeAmountsOut.reverse();
    }

    const addAmountOut = TV.fromBlockchain(decodedResults.addLiquidityResult, this.targetWell.pool.decimals);

    return {
      removeAmountsOut,
      addAmountOut,
    };
  }

  /**
   * Decodes the result of the remove and add liquidity operations from getRemoveAddLiquidityOut
   */
  #decodeAddRemoveResult(data: readonly HashString[]) {
    if (!data.length) {
      throw new Error("No data to decode");
    }

    const decoded = decodeFunctionResult({
      abi: abiSnippets.advancedPipe,
      functionName: "advancedPipe",
      data: data[0],
    });

    const len = decoded.length;

    const removeAmountBigInt = decodeFunctionResult({
      abi: abiSnippets.wells.getRemoveLiquidityOneTokenOut,
      functionName: "getRemoveLiquidityOneTokenOut",
      data: decoded[len - 2], // 2nd to last index
    });

    const addAmountOutBigInt = decodeFunctionResult({
      abi: abiSnippets.wells.getAddLiquidityOut,
      functionName: "getAddLiquidityOut",
      data: decoded[len - 1], // last index
    });

    return {
      removeLiquidityResult: removeAmountBigInt,
      addLiquidityResult: addAmountOutBigInt,
    };
  }

  #constructReadAdvancedPipe(amountIn: TV) {
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
