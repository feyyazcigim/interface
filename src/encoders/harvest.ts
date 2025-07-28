import { Clipboard } from "@/classes/Clipboard";
import { TokenValue } from "@/classes/TokenValue";
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
    abi: harvestABI,
    functionName: "harvest",
    args: [fieldId, plots.map((plot) => BigInt(plot)), Number(destination)],
  });

  return {
    callData: data,
    clipboard: clipboard || Clipboard.encode([]),
  };
}

const harvestABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "fieldId",
        type: "uint256",
      },
      {
        internalType: "uint256[]",
        name: "plots",
        type: "uint256[]",
      },
      {
        internalType: "enum LibTransfer.To",
        name: "mode",
        type: "uint8",
      },
    ],
    name: "harvest",
    outputs: [
      {
        internalType: "uint256",
        name: "beansHarvested",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
] as const;
