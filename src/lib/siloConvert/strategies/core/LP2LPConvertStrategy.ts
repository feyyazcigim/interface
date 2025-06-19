import { ExtendedPoolData } from "@/lib/siloConvert/SiloConvert.cache";
import { SiloConvertContext } from "@/lib/siloConvert/types";
import { PipelineConvertStrategy } from "./PipelineConvertStrategy";

export abstract class LP2LPStrategy extends PipelineConvertStrategy<"LP2LP"> {
  readonly sourceWell: ExtendedPoolData;

  readonly targetWell: ExtendedPoolData;

  constructor(source: ExtendedPoolData, target: ExtendedPoolData, context: SiloConvertContext) {
    super(source.pool, target.pool, context);
    this.sourceWell = source;
    this.targetWell = target;
  }

  /// ------------------------------ Getters ------------------------------ ///

  get sourceIndexes() {
    const pairIndex = this.sourceWell.pair.index;
    return {
      pair: pairIndex,
      main: pairIndex === 1 ? 0 : 1,
    };
  }

  get targetIndexes() {
    const pairIndex = this.targetWell.pair.index;
    return {
      pair: pairIndex,
      main: pairIndex === 1 ? 0 : 1,
    };
  }
}

export { LP2LPStrategy as SiloConvertLP2LPConvertStrategy };
