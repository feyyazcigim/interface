import { TokenValue } from "@/classes/TokenValue";
import { toFixedNumber } from "./format";

export const seasonCutOffFor150 = 2710;
export const seasonCutOffFor200 = 5000; // placeholder value, will likely be in the 3400-3600 range

const getMaxCropRatioBySeason = (season: number) => {
  if (season >= seasonCutOffFor150 && season < seasonCutOffFor200) {
    return 150;
  }
  if (season >= seasonCutOffFor200) {
    return 200;
  }
  return 100;
};

export function calculateCropScales(value: number, isRaining: boolean, season: number) {
  const maxInput = 1e18;
  const maxOutput = getMaxCropRatioBySeason(season);

  const cropScalar = toFixedNumber(value / maxInput, 1);
  const asAScalar = value / maxInput / 100;
  const minCropRatio = isRaining ? 33 : 50;

  // round to nearest one decimal without converting to string or adding trailing zeroes to integers
  const cropRatio = Math.round((asAScalar * (maxOutput - minCropRatio) + minCropRatio) * 10) / 10;

  return {
    cropScalar,
    cropRatio,
  };
}

export function convertDeltaDemandToPercentage(deltaDemand: number) {
  console.info("🚀 ~ convertDeltaDemandToPercentage ~ deltaDemand:", deltaDemand);
  if (deltaDemand === 0) return "0%";
  if (deltaDemand === 1e18) {
    return "∞%";
  }
  if (deltaDemand === 1) return "100%";

  // Scale the value between 0-100%
  const scaledValue = deltaDemand * 100;
  return `${TokenValue.fromHuman(scaledValue, 0).toHuman("short")}%`;
}

export function caseIdToDescriptiveText(caseId: number, column: "price" | "soil_demand" | "pod_rate" | "l2sr") {
  switch (column) {
    case "price":
      if ((caseId % 36) % 9 >= 6) return "P > Q";
      else return undefined;
    case "soil_demand":
      if (caseId % 3 === 0) return "Decreasing";
      else if (caseId % 3 === 1) return "Steady";
      else return "Increasing";
    case "pod_rate":
      if ((caseId % 36) / 9 === 0) return "Excessively Low";
      else if ((caseId % 36) / 9 === 1) return "Reasonably Low";
      else if ((caseId % 36) / 9 === 2) return "Reasonably High";
      else return "Excessively High";
    case "l2sr":
      if (Math.trunc(caseId / 36) === 0) {
        return "Excessively Low";
      } else if (Math.trunc(caseId / 36) === 1) {
        return "Reasonably Low";
      } else if (Math.trunc(caseId / 36) === 2) {
        return "Reasonably High";
      } else {
        return "Excessively High";
      }
  }
}
