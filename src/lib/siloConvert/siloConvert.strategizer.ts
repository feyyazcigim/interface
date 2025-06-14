import { TV } from "@/classes/TokenValue";
import { Token } from "@/utils/types";
import { Prettify } from "@/utils/types.generic";
import { SiloConvertCache } from "./SiloConvert.cache";
import { SiloConvertMaxConvertQuoter } from "./SiloConvert.maxConvertQuoter";
import { LP2LPStrategy, SiloConvertStrategy } from "./strategies/core";
import { SiloConvertType } from "./strategies/core/types";
import {
  DefaultConvertStrategy,
  SiloConvertLP2LPEq2EqStrategy as LP2LPEq2Eq,
  SiloConvertLP2LPSingleSidedMainTokenStrategy as LP2LPSingleSidedMain,
  SiloConvertLP2LPSingleSidedPairTokenStrategy as LP2LPSingleSidedPair,
  SiloConvertLP2MainPipelineConvertStrategy as LP2MainPipeline,
} from "./strategies/implementations";
import { SiloConvertContext } from "./types";

interface StrategyWithAmount<T extends SiloConvertType> {
  strategy: SiloConvertStrategy<T>;
  amount: TV;
}

export interface SiloConvertRoute<T extends SiloConvertType> {
  source: Token;
  target: Token;
  strategies: Prettify<StrategyWithAmount<T>>[];
  convertType: T;
}

export class Strategizer {
  constructor(
    private readonly context: SiloConvertContext,
    private readonly cache: SiloConvertCache,
    private readonly maxConvertQuoter: SiloConvertMaxConvertQuoter,
  ) {}

  static MIN_DELTA_B = 100;

  async strategize(source: Token, target: Token, amountIn: TV): Promise<SiloConvertRoute<SiloConvertType>[]> {
    await this.cache.update();

    const isLP2LP = source.isLP && target.isLP;

    if (!isLP2LP) {
      return this.strategizeLPAndMain(source, target, amountIn);
    }

    return this.strategizeLP2LP(source, target, amountIn);
  }

  async strategizeLPAndMain(source: Token, target: Token, amountIn: TV): Promise<SiloConvertRoute<SiloConvertType>[]> {
    await this.cache.update();

    if (source.isLP && target.isLP) {
      throw new Error("[SiloConvert/Strategizer] Expected only 1 LP token, but got 2");
    }

    if (source.isMain && target.isMain) {
      throw new Error("[SiloConvert/Strategizer] Expected only 1 main token, but got 2");
    }

    // Only options for source and target are LP || main.

    const defaultRoute: SiloConvertRoute<SiloConvertType> = {
      source,
      target,
      strategies: [
        {
          strategy: new DefaultConvertStrategy(source, target, this.context),
          amount: amountIn,
        },
      ],
      convertType: "LPAndMain",
    };

    // always include the default convert route
    const routes: SiloConvertRoute<SiloConvertType>[] = [defaultRoute];

    const sourceWell = source.isLP ? this.cache.getWell(source.address) : undefined;

    // if SourceWell exists, target must be main due to validation above.
    if (sourceWell && !this.maxConvertQuoter.isAggDisabledToken(source)) {
      routes.push({
        source,
        target,
        strategies: [
          {
            strategy: new LP2MainPipeline(sourceWell, target, this.context),
            amount: amountIn,
          },
        ],
        convertType: "LP2MainPipeline",
      });
    }

    return routes;
  }

  async strategizeLP2LP(source: Token, target: Token, amountIn: TV) {
    await this.cache.update();

    const sourceWell = this.cache.getWell(source.address);
    const targetWell = this.cache.getWell(target.address);

    const isAggDisabled =
      this.maxConvertQuoter.isAggDisabledToken(source) || this.maxConvertQuoter.isAggDisabledToken(target);

    const shared: Omit<SiloConvertRoute<SiloConvertType>, "strategies"> = {
      source,
      target,
      convertType: "LP2LP",
    };

    // if dex aggregators are disabled for either token, we can only use a single sided main token strategy.
    if (isAggDisabled) {
      return [
        {
          ...shared,
          strategies: [
            {
              strategy: new LP2LPSingleSidedMain(sourceWell, targetWell, this.context),
              amount: amountIn,
            },
          ],
        },
      ];
    }

    const strategies: StrategyWithAmount<"LP2LP">[] = [];

    const convertTokens = { source, target };

    const sourceDeltaP = sourceWell.deltaB;
    const targetDeltaP = targetWell.deltaB;

    const eq2eqStrategy = new LP2LPEq2Eq(sourceWell, targetWell, this.context);

    let maxConvert: TV | undefined = undefined;
    let amountUsed: TV = TV.fromHuman("0", source.decimals);

    if (sourceDeltaP.lt(Strategizer.MIN_DELTA_B) && targetDeltaP.gt(Strategizer.MIN_DELTA_B)) {
      maxConvert = await this.maxConvertQuoter.getSingleSidedMainTokenMaxConvert(convertTokens);
      amountUsed = TV.min(amountIn, maxConvert);
      strategies.push({
        strategy: new LP2LPSingleSidedMain(sourceWell, targetWell, this.context),
        amount: amountUsed,
      });
    } else if (sourceDeltaP.gt(Strategizer.MIN_DELTA_B) && targetDeltaP.lt(Strategizer.MIN_DELTA_B)) {
      maxConvert = await this.maxConvertQuoter.getSingleSidedPairTokenMaxConvert(convertTokens);
      amountUsed = TV.min(amountIn, maxConvert);
      strategies.push({
        strategy: new LP2LPSingleSidedPair(sourceWell, targetWell, this.context),
        amount: amountUsed,
      });
    }

    // If the amount used is not the same as the amount in, we need to add an eq2eq strategy
    if (!amountUsed.eq(amountIn)) {
      strategies.push({
        strategy: eq2eqStrategy,
        amount: amountIn.sub(amountUsed),
      });
    }

    return [
      {
        ...shared,
        strategies,
      },
    ];
  }
}

export { Strategizer as SiloConvertStrategizer };
