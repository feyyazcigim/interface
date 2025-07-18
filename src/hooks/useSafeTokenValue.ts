import { TV } from "@/classes/TokenValue";
import { stringToStringNum } from "@/utils/string";
import { useMemo } from "react";

type DecimalIsh =
  | {
      decimals: number;
    }
  | number;

export default function useSafeTokenValue(amount: string, mayDecimals: DecimalIsh) {
  const decimals = typeof mayDecimals === "number" ? mayDecimals : mayDecimals.decimals;

  /**
   * Create stable reference to the string value
   *
   * Values such as '', '.', '0.0', '0' are all treated as 0
   */
  const value = stringToStringNum(amount);

  // create a stable reference to the TokenValue. Only recompute if value or decimals changes
  return useMemo(() => TV.fromHuman(value, decimals), [value, decimals]);
}
