import { Clipboard } from "@/classes/Clipboard";
import { TV } from "@/classes/TokenValue";
import { abiSnippets } from "@/constants/abiSnippets";
import encoders from "@/encoders";
import erc20Approve from "@/encoders/erc20Approve";
import erc20Transfer from "@/encoders/erc20Transfer";
import sync from "@/encoders/sync";
import { AdvancedFarmWorkflow, AdvancedPipeWorkflow } from "@/lib/farm/workflow";
import { ExtendedPoolData } from "@/lib/siloConvert/SiloConvert.cache";
import { ExtendedPickedCratesDetails } from "@/utils/convert";
import { AdvancedFarmCall, AdvancedPipeCall, Token } from "@/utils/types";
import { HashString } from "@/utils/types.generic";
import { encodeFunctionData, isAddress } from "viem";
import { SiloConvertStrategy } from "./ConvertStrategy";
import { ConvertStrategyQuote, SiloConvertType } from "./types";

export type RemoveLiquidityStrategy = "equal" | "single-main" | "single-pair";

export abstract class PipelineConvertStrategy<T extends SiloConvertType> extends SiloConvertStrategy<T> {
  /// ------------------------------ Abstract Methods ------------------------------ ///

  /**
   * Builds the advanced pipe calls for the convert.
   */
  abstract buildAdvancedPipeCalls(summary: ConvertStrategyQuote<T>["summary"]): AdvancedPipeWorkflow;

  /// ------------------------------ Protected Methods ------------------------------ ///

  encodeFromQuote(quote: ConvertStrategyQuote<T>): AdvancedFarmCall {
    const stems: bigint[] = [];
    const amounts: bigint[] = [];

    quote.pickedCrates.crates.forEach((crate) => {
      stems.push(crate.stem.toBigInt());
      amounts.push(crate.amount.toBigInt());
    });

    if (!quote.advPipeCalls) {
      throw new Error("No advanced pipe calls provided");
    }

    const args = {
      stems,
      amounts,
      advPipeCalls: quote.advPipeCalls?.getSteps() ?? [],
    };

    return encoders.silo.pipelineConvert(this.sourceToken, this.targetToken, args);
  }

  encodeQuoteToAdvancedFarmStruct(quote: ConvertStrategyQuote<T>): AdvancedFarmCall {
    const stems: bigint[] = [];
    const amounts: bigint[] = [];

    quote.pickedCrates.crates.forEach((crate) => {
      stems.push(crate.stem.toBigInt());
      amounts.push(crate.amount.toBigInt());
    });

    if (!quote.advPipeCalls) {
      throw new Error("No advanced pipe calls provided");
    }

    const args = {
      stems,
      amounts,
      advPipeCalls: quote.advPipeCalls?.getSteps() ?? [],
    };

    return encoders.silo.pipelineConvert(this.sourceToken, this.targetToken, args);
  }

  /**
   * Snippets for the advanced pipe calls.
   */
  protected static snippets = {
    // ERC20 Token Methods
    erc20Approve: (
      token: Token,
      spender: HashString,
      amount: TV = TV.MAX_UINT256,
      clipboard: HashString = Clipboard.encode([]),
    ): AdvancedPipeCall => {
      return {
        ...erc20Approve(spender, amount, token.address, clipboard),
        target: token.address,
      };
    },
    erc20Transfer: (
      token: Token,
      recipient: HashString,
      amount: TV,
      clipboard: HashString = Clipboard.encode([]),
    ): AdvancedPipeCall => {
      return {
        ...erc20Transfer(recipient, amount, token.address, clipboard),
        target: token.address,
      };
    },
    erc20BalanceOf: (token: Token, account: HashString): AdvancedPipeCall => {
      if (!account || !isAddress(account)) {
        throw new Error("Cannot use invalid account address");
      }

      return {
        ...encoders.token.erc20BalanceOf(account),
        target: token.address,
      };
    },
    // // Well Methods
    removeLiquidity: (
      well: ExtendedPoolData,
      amountIn: TV,
      minAmountsOut: TV[],
      recipient: HashString,
      clipboard: HashString = Clipboard.encode([]),
    ): AdvancedPipeCall => {
      return encoders.well.removeLiquidity(well.pool, amountIn, minAmountsOut, recipient, clipboard);
    },
    removeLiquidityOneToken: (
      well: ExtendedPoolData,
      amountIn: TV,
      tokenOut: Token,
      minAmountOut: TV,
      recipient: HashString,
      clipboard: HashString = Clipboard.encode([]),
    ): AdvancedPipeCall => {
      return encoders.well.removeLiquidityOneToken(well.pool, amountIn, tokenOut, minAmountOut, recipient, clipboard);
    },
    wellSync: (
      well: ExtendedPoolData,
      recipient: HashString,
      amount: TV,
      clipboard: HashString = Clipboard.encode([]),
    ): AdvancedPipeCall => {
      return {
        ...sync(recipient, amount, well.pool.address, clipboard),
        target: well.pool.address,
      };
    },
    // Junction methods
    gte: (value: TV, compareTo: TV, clipboard: HashString = Clipboard.encode([])): AdvancedPipeCall => {
      return encoders.junction.gte(value, compareTo, clipboard);
    },
    check: (
      // index of the math or logic operation in the pipe
      index: number,
      // copy slot
      copySlot: number,
    ): AdvancedPipeCall => {
      return encoders.junction.check(index, copySlot);
    },
  };
}
