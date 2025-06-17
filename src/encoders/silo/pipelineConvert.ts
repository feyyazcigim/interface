import { Clipboard } from "@/classes/Clipboard";
import { diamondABI } from "@/constants/abi/diamondABI";
import { abiSnippets } from "@/constants/abiSnippets";
import { ConvertResultStruct } from "@/lib/siloConvert/SiloConvert";
import { AdvancedPipeCall, Token } from "@/utils/types";
import { HashString } from "@/utils/types.generic";
import { decodeFunctionResult, encodeFunctionData } from "viem";

export type IPipelineConvert = {
  stems: bigint[];
  amounts: bigint[];
  advPipeCalls: AdvancedPipeCall[];
  clipboard?: HashString;
};

export function pipelineConvert(sourceLP: Token, targetLP: Token, args: IPipelineConvert) {
  const callData = encodeFunctionData({
    abi: diamondABI,
    functionName: "pipelineConvert",
    args: [sourceLP.address, args.stems, args.amounts, targetLP.address, args.advPipeCalls],
  });

  return {
    callData: callData,
    clipboard: args.clipboard || Clipboard.encode([]),
  };
}

export function decodePipelineConvert(result: HashString): ConvertResultStruct<bigint> {
  try {
    const decoded = decodeFunctionResult<typeof abiSnippets.pipelineConvert>({
      abi: abiSnippets.pipelineConvert,
      functionName: "pipelineConvert",
      data: result,
    });

    return {
      toStem: decoded[0],
      fromAmount: decoded[1],
      toAmount: decoded[2],
      fromBdv: decoded[3],
      toBdv: decoded[4],
    };
  } catch (e) {
    console.error(`Error decoding convert result: ${result}`);
    throw e;
  }
}
