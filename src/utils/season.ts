import { TokenValue } from "@/classes/TokenValue";

export function calculateCropScales(value: number, isRaining: boolean, season: number) {
  const maxInput = 1e18;
  const maxOutput = season >= 2710 ? 150 : 100;

  // Calculate crop scalar
  const cropScalar = value / maxInput;

  // Calculate crop ratio
  const minCropRatio = isRaining ? 33 : 50;
  const cropRatio = Math.min(maxOutput, Math.max(minCropRatio, (cropScalar / 100) * maxOutput)).toFixed(1);

  return {
    cropScalar,
    cropRatio,
  };
}

export function convertDeltaDemandToPercentage(deltaDemand: number) {
  if (deltaDemand === 0) return "0%";
  if (deltaDemand === 1e18) return "100%";
  if (deltaDemand === 1e36) return "∞%";

  // Scale the value between 0-100%
  const scaledValue = (deltaDemand / 1e18) * 100;
  return `${TokenValue.fromHuman(scaledValue, 0).toHuman("short")}%`;
}

export function caseIdToDescriptiveText(caseId: number, column: "price" | "soil_demand" | "pod_rate" | "l2sr") {
  switch (column) {
    case "price":
      if ((caseId % 36) % 9 < 3) return "P < $1.00";
      else if ((caseId % 36) % 9 < 6) return "P > $1.00";
      //(caseId % 36 < 9)
      else return "P > Q";
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
