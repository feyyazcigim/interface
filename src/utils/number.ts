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

/**
 * Converts a string to a TokenValue, ensuring that the string is a valid number.
 * @param val - The string to convert.
 * @param decimals - The number of decimals to use.
 * @returns The TokenValue.
 */
export const toSafeTVFromHuman = (val: string, decimals: number): TV => {
  if (typeof val !== "string") {
    throw new Error("Invalid value parameter");
  }

  const value = val === "" || val === "." ? "0" : val;

  return TV.fromHuman(value, decimals);
};
