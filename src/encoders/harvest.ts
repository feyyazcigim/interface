import { Clipboard } from "@/classes/Clipboard";
import { beanstalkAbi } from "@/generated/contractHooks";
import { FarmToMode } from "@/utils/types";
import { encodeFunctionData } from "viem";

export default function harvest(
  fieldId?: bigint,
  plots?: string[],
  destination?: FarmToMode,
  clipboard?: `0x${string}`,
) {
  if ((!fieldId && fieldId !== 0n) || !plots || !destination) {
    return {
      callData: "0x" as `0x${string}`,
      clipboard: Clipboard.encode([]),
    };
  }

  const data = encodeFunctionData({
    abi: beanstalkAbi,
    functionName: "harvest",
    args: [fieldId, plots.map((plot) => BigInt(plot)), Number(destination)],
  });

  return {
    callData: data,
    clipboard: clipboard || Clipboard.encode([]),
  };
}
