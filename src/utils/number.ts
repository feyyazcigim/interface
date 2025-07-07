import { TV } from "@/classes/TokenValue";
import { postSanitizedSanitizedValue } from "./string";

/**
 * Normalizes a TokenValue to be zero or greater.
 * @param tv - The TokenValue to normalize.
 * @returns The normalized TokenValue.
 */
export const normalizeTV = (tv: TV) => {
  if (tv.lt(0)) return TV.ZERO;
  return tv;
};

export function validateFormLte(left: string, right: string, leftDecimals: number, rightDecimals: number) {
  const leftSanitized = postSanitizedSanitizedValue(left, leftDecimals);
  if (leftSanitized.nonAmount) {
    return true;
  }

  const rightSanitized = postSanitizedSanitizedValue(right, rightDecimals);
  if (rightSanitized.nonAmount) {
    return true;
  }

  return leftSanitized.tv.lte(rightSanitized.tv);
}
