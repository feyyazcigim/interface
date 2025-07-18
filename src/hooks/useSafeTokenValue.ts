import { TV } from "@/classes/TokenValue";
import { DecimalIsh, decimalsIshToNumber } from "@/utils/number";
import { stringToStringNum } from "@/utils/string";
import { useMemo } from "react";

export default function useSafeTokenValue(amount: string, mayDecimals: DecimalIsh) {
  const decimals = decimalsIshToNumber(mayDecimals);

  /**
   * Create stable reference to the string value
   *
   * Values such as '', '.', '0.0', '0' are all treated as 0
   */
  const value = stringToStringNum(amount);

  // create a stable reference to the TokenValue. Only recompute if value or decimals changes
  return useMemo(() => TV.fromHuman(value, decimals), [value, decimals]);
}
