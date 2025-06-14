import { Clipboard } from "@/classes/Clipboard";
import { TokenValue } from "@/classes/TokenValue";
import { basinWellABI } from "@/constants/abi/basinWellABI";
import { AdvancedPipeCall, Token } from "@/utils/types";
import { HashString } from "@/utils/types.generic";
import { encodeFunctionData } from "viem";

export function wellGetAddLiquidityOut(
  well: Token,
  amountsIn: (TokenValue | bigint)[],
  clipboard: HashString = Clipboard.encode([]),
): AdvancedPipeCall {
  if (amountsIn.length !== 2) {
    throw new Error("Invalid number of amounts in");
  }

  const args = amountsIn.map((amt) => amt instanceof TokenValue ? amt.toBigInt() : amt);

  const data = encodeFunctionData({
    abi: basinWellABI,
    functionName: "getAddLiquidityOut",
    args: [args] as const,
  });

  return {
    target: well.address,
    callData: data,
    clipboard,
  };
}
