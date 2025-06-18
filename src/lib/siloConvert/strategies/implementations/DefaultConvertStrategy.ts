import { Clipboard } from "@/classes/Clipboard";
import { TV } from "@/classes/TokenValue";
import { diamondABI } from "@/constants/abi/diamondABI";
import encoders from "@/encoders";
import { AdvancedFarmWorkflow } from "@/lib/farm/workflow";
import { ConvertStrategyQuote, SiloConvertStrategy } from "@/lib/siloConvert/strategies/core";
import { ExtendedPickedCratesDetails, calculateConvertData } from "@/utils/convert";
import { AdvancedFarmCall } from "@/utils/types";
import { HashString } from "@/utils/types.generic";
import { decodeFunctionResult, encodeFunctionData } from "viem";

export class DefaultConvertStrategy extends SiloConvertStrategy<"LPAndMain"> {
  async quote(
    deposits: ExtendedPickedCratesDetails,
    advancedFarm: AdvancedFarmWorkflow,
    slippage: number,
  ): Promise<ConvertStrategyQuote<"LPAndMain">> {
    this.validateQuoteArgs(deposits, slippage);

    const amountIn = deposits.totalAmount;
    const farm = this.encodeConvertAmountOut(amountIn);

    const sim = await advancedFarm.simulate({
      account: this.context.account,
      after: farm,
    });

    const amountOut = this.decodeConvertAmountOut(sim.result[0]);

    const summary = {
      source: {
        token: this.sourceToken,
        amountIn: amountIn,
      },
      target: {
        token: this.targetToken,
        amountOut,
      },
    };

    const convertData = this.getConvertData(amountIn, amountOut, slippage);

    console.debug("[DefaultConvertStrategy] quote: ", {
      source: this.sourceToken,
      target: this.targetToken,
      amountIn: amountIn,
      amountOut,
      convertData,
    });

    return {
      pickedCrates: deposits,
      summary,
      advPipeCalls: undefined,
      amountOut,
      convertData,
    };
  }

  encodeFromQuote(quote: ConvertStrategyQuote<"LPAndMain">): AdvancedFarmCall {
    if (!quote.convertData) {
      throw new Error("No convert data provided");
    }

    const stems: bigint[] = [];
    const amounts: bigint[] = [];

    quote.pickedCrates.crates.forEach((crate) => {
      stems.push(crate.stem.toBigInt());
      amounts.push(crate.amount.toBigInt());
    });

    return encoders.silo.convert(quote.convertData, stems, amounts);
  }

  private getConvertData(amountIn: TV, amountOut: TV, slippage: number) {
    const convertData = calculateConvertData(
      this.sourceToken,
      this.targetToken,
      amountIn,
      amountOut.subSlippage(slippage),
    );

    if (!convertData) {
      throw new Error("Invalid convert data");
    }

    return convertData;
  }

  private encodeConvertAmountOut(amount: TV) {
    const farm = new AdvancedFarmWorkflow(this.context.chainId, this.context.wagmiConfig);
    const callData = encodeFunctionData({
      abi: diamondABI,
      functionName: "getAmountOut",
      args: [this.sourceToken.address, this.targetToken.address, amount.toBigInt()],
    });
    farm.add({
      callData,
      clipboard: Clipboard.encode([]),
    });

    return farm;
  }

  decodeConvertAmountOut(data: HashString) {
    const amountOut = decodeFunctionResult({
      abi: diamondABI,
      functionName: "getAmountOut",
      data: data,
    });

    return TV.fromBigInt(amountOut, this.targetToken.decimals);
  }
}
