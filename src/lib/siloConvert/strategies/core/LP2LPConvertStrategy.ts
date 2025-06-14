import { Clipboard } from "@/classes/Clipboard";
import { TV } from "@/classes/TokenValue";
import encoders from "@/encoders";
import erc20Approve from "@/encoders/erc20Approve";
import erc20Transfer from "@/encoders/erc20Transfer";
import sync from "@/encoders/sync";
import { AdvancedPipeWorkflow } from "@/lib/farm/workflow";
import { ExtendedPoolData } from "@/lib/siloConvert/SiloConvert.cache";
import { SiloConvertContext } from "@/lib/siloConvert/types";
import { AdvancedPipeCall, Token } from "@/utils/types";
import { HashString } from "@/utils/types.generic";
import { isAddress } from "viem";
import { PipelineConvertStrategy } from "./PipelineConvertStrategy";
import { ConvertStrategyQuote } from "./types";

export abstract class LP2LPStrategy extends PipelineConvertStrategy<"LP2LP"> {
  readonly sourceWell: ExtendedPoolData;

  readonly targetWell: ExtendedPoolData;

  constructor(source: ExtendedPoolData, target: ExtendedPoolData, context: SiloConvertContext) {
    super(source.pool, target.pool, context);
    this.sourceWell = source;
    this.targetWell = target;
  }

  /// ------------------------------ Getters ------------------------------ ///

  get sourceIndexes() {
    const pairIndex = this.sourceWell.pair.index;
    return {
      pair: pairIndex,
      main: pairIndex === 1 ? 0 : 1,
    };
  }

  get targetIndexes() {
    const pairIndex = this.targetWell.pair.index;
    return {
      pair: pairIndex,
      main: pairIndex === 1 ? 0 : 1,
    };
  }

  /// ------------------------------ Abstract Methods ------------------------------ ///

  /**
   * @param amountsIn - The amounts in for each deposit.
   * @returns The amounts out for each deposit and the summed amounts out.
   */
  abstract buildAdvancedPipeCalls(summary: ConvertStrategyQuote<"LP2LP">["summary"]): AdvancedPipeWorkflow;

  /// ------------------------------ Static Methods ------------------------------ ///

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

export { LP2LPStrategy as SiloConvertLP2LPConvertStrategy };
