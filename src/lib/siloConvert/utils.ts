import { decodeConvert } from "@/encoders/silo/convert";
import { decodePipelineConvert } from "@/encoders/silo/pipelineConvert";
import { HashString } from "@/utils/types.generic";
import { ConvertResultStruct } from "./SiloConvert";
import { SiloConvertType } from "./strategies/core";

type Decoder = (results: HashString) => ConvertResultStruct<bigint>;

const decoderMap: Record<SiloConvertType, Decoder> = {
  LP2LP: decodePipelineConvert,
  LP2MainPipeline: decodePipelineConvert,
  LPAndMain: decodeConvert,
} as const;

export const decodeConvertResults = (
  results: readonly HashString[],
  convertType: SiloConvertType,
): ConvertResultStruct<bigint>[] => {
  const decoder = decoderMap[convertType];

  if (!decoder) {
    throw new Error(`Invalid convert type: ${convertType}`);
  }

  return results.map(decoder);
};
