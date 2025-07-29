import { Clipboard } from "@/classes/Clipboard";
import { ITTLCache, InMemoryTTLCache } from "@/classes/TTLCache";
import { TV } from "@/classes/TokenValue";
import { MAIN_TOKEN } from "@/constants/tokens";
import encoders from "@/encoders";
import { PriceContractPriceResult, decodePriceResult } from "@/encoders/ecosystem/price";
import junctionGte from "@/encoders/junction/junctionGte";
import { AdvancedFarmWorkflow, AdvancedPipeWorkflow } from "@/lib/farm/workflow";
import { getChainConstant } from "@/utils/chain";
import { pickCratesMultiple } from "@/utils/convert";
import { DepositData, Token } from "@/utils/types";
import { HashString } from "@/utils/types.generic";
import { throwIfAborted } from "@/utils/utils";
import { Config } from "@wagmi/core";
import { Address } from "viem";
import { SiloConvertPriceCache } from "./SiloConvert.cache";
import { MaxConvertResult, SiloConvertMaxConvertQuoter } from "./SiloConvert.maxConvertQuoter";
import { SiloConvertRoute, SiloConvertStrategizer } from "./siloConvert.strategizer";
import { ConvertStrategyQuote } from "./strategies/core";
import { SiloConvertType } from "./strategies/core";
import { ConversionQuotationError, SimulationError } from "./strategies/validation/SiloConvertErrors";
import { SiloConvertContext } from "./types";
import { decodeConvertResults } from "./utils";

/**
 * Architecture notes:
 *
 * SiloConvert is the outer-facing class that is used to
 * 1. quote the maximum convert between 2 tokens (if applicable)
 * 2. quote the convert between 2 tokens
 * 3. provide an executable advancedFarm workflow
 *
 * Implementation is split up into:
 * 1. maxConvertQuoter
 * 2. strategizer
 *
 *
 *
 * To fetch the maximum convert, we utilize the SiloConvertMaxConvertQuoter class.
 * (more on this in ./SiloConvert.maxConvertQuoter.ts)
 *
 * If the source or target is the main token, we refer to it as a 'default convert'.
 * For default converts, we create 2 different routes
 * - one that utilizes the Diamond's 'convert()' function
 * - one that utilizes the Diamond's 'pipelineConvert()' function (Only if path = LP -> Main)
 *
 * For LP<>LP converts, we create 1 route that utilizes the Diamond's 'pipelineConvert()' function.
 *
 * If we are converting LP<>LP, we must calculate the following information:
 * - Which strategies do we utilize?
 * - Given the strategies, how much can we convert via each strategy?
 *
 * [Convert Strategies]
 * Broadly speaking, we can break down LP<>LP converts into 3 separate strategies:
 * 1. Remove single sided liquidity as PINTO from LP 1 -> deposit single sided liquidity as PINTO into LP 2
 *    - Referred to in the code as a 'singleSidedMainToken' strategy (SSMT)
 * 2. Remove single sided liquidity as non-PINTO from LP 1 -> deposit single sided liquidity as non-PINTO into LP 2
 *    - Referred to in the code as a 'singleSidedPairToken' strategy (SSPT)
 * 3. Remove liquidity in equal proportions from LP 1 -> deposit equal proportions of liquidity into LP 2
 *    - Referred to in the code as an 'equal2Equal' strategy (EQ2EQ)
 *
 * For strategies 2 & 3, we swap between LP 1's pair token -> LP 2's pair token leveraging the 0x API.
 *
 * [Strategy Selection]
 * Strategy selection is primarily done by comparing the instantaneous ΔP of the source and target wells.
 *
 * Given Well A & Well B, and we want to convert from Well A -> Well B, we can determine the following:
 * 1. If ΔP(A) > 0 & ΔP(B) < 0, we utilize the SSPT strategy.
 * 2. If ΔP(A) < 0 & ΔP(B) > 0, we utilize the SSMT strategy.
 * 3. If ΔP(A) & ΔP(B) have the same sign, we utilize the EQ2EQ strategy.
 *
 * [Max Convert Calculation]
 * In the case where we utilize SSPT or SSMT, we must calculate the maximum amount of single sided liquidity we can remove / deposit w/o causing ΔP to negate on either Well.
 * Thus, if |ΔP(A)| > |ΔP(B)|, we find the max amount we can add to Well B such that ΔP(B) does not negate.
 * Conversely, if |ΔP(A)| < |ΔP(B)|, we find the max amount we can remove from Well A such that ΔP(A) does not negate.
 *
 * Additionally, in the case where the amount the user wishes to convert exceeds the max convert, we split the amount into 2 parts:
 * 1. The max amount that can be converted via the SSPT / SSMT strategy.
 * 2. The remainder of the amount that is converted via the EQ2EQ strategy.
 *
 */

/**
 * The result of a pipeline convert from on-chain.
 */
export interface ConvertResultStruct<T = TV> {
  /**
   * The updated stem of the Silo token we are converting to.
   */
  toStem: T;
  /**
   * The amount of the source Silo token we are converting from.
   */
  fromAmount: T;
  /**
   * The amount of the target Silo token we are converting to.
   */
  toAmount: T;
  /**
   * bdv of the source Silo token we are attempting to convert from.
   */
  fromBdv: T;
  /**
   * bdv of the target Silo token after the convert.
   */
  toBdv: T;
}

export interface SiloConvertSummary<T extends SiloConvertType> {
  route: SiloConvertRoute<T>;
  quotes: ConvertStrategyQuote<T>[];
  results: ConvertResultStruct<TV>[];
  workflow: AdvancedFarmWorkflow;
  totalAmountOut: TV;
  reducedResults: Omit<ConvertResultStruct<TV>, "toStem">;
  postPriceData: PriceContractPriceResult | undefined;
}

export class SiloConvert {
  readonly context: SiloConvertContext;

  maxConvertQuoter: SiloConvertMaxConvertQuoter;

  private strategizer: SiloConvertStrategizer;

  private priceCache: SiloConvertPriceCache;

  private scalarCache: ITTLCache<number>;

  private maxConvertCache: ITTLCache<MaxConvertResult>;

  constructor(diamondAddress: Address, account: Address, config: Config, chainId: number) {
    this.context = {
      diamond: diamondAddress,
      account: account,
      wagmiConfig: config,
      chainId: chainId,
    };

    this.priceCache = new SiloConvertPriceCache(this.context);
    this.scalarCache = new InMemoryTTLCache<number>();
    this.maxConvertCache = new InMemoryTTLCache<MaxConvertResult>();

    this.maxConvertQuoter = new SiloConvertMaxConvertQuoter(
      this.context,
      this.priceCache,
      this.scalarCache,
      this.maxConvertCache,
    );
    this.strategizer = new SiloConvertStrategizer(this.context, this.priceCache, this.maxConvertQuoter);
  }

  /**
   * Resets the strategies, amounts, caches, and re-initializes dependencies.
   */
  clear() {
    this.priceCache.clear();
    this.scalarCache.clear();
    this.maxConvertCache.clear();
    this.maxConvertQuoter = new SiloConvertMaxConvertQuoter(
      this.context,
      this.priceCache,
      this.scalarCache,
      this.maxConvertCache,
    );
    this.strategizer = new SiloConvertStrategizer(this.context, this.priceCache, this.maxConvertQuoter);
  }

  /**
   * Get scalar cache metrics for monitoring
   */
  getScalarCacheMetrics() {
    return this.maxConvertQuoter.getScalarCacheMetrics();
  }

  /**
   * Given a source and target token, returns the max convert amount.
   */
  async getMaxConvert(
    source: Token,
    target: Token,
    deposits: DepositData[] | undefined,
    forceUpdateCache?: boolean,
  ): Promise<MaxConvertResult> {
    // update cache if requested
    await this.priceCache.update(forceUpdateCache);

    return this.maxConvertQuoter.quoteMaxConvert(source, target, deposits);
  }

  async quote(
    source: Token,
    target: Token,
    farmerDeposits: DepositData[],
    amountIn: TV,
    slippage: number,
    signal?: AbortSignal,
    forceUpdateCache: boolean = false,
  ): Promise<SiloConvertSummary<SiloConvertType>[]> {
    try {
      return this._quote(source, target, farmerDeposits, amountIn, slippage, signal, forceUpdateCache);
    } catch (_e) {
      // Don't retry if the request was aborted
      if (_e instanceof Error && _e.name === "AbortError") {
        throw _e;
      }
      console.debug("[SiloConvert/quote] Failed to quote, retrying with forceUpdateCache: ", forceUpdateCache);
      // if we fail to quote, force update the caches and try again.
      return this._quote(source, target, farmerDeposits, amountIn, slippage, signal, true);
    }
  }

  /**
   * Given a source and target token, returns the convert result.
   */
  async _quote(
    source: Token,
    target: Token,
    farmerDeposits: DepositData[],
    amountIn: TV,
    slippage: number,
    signal?: AbortSignal,
    forceUpdateCache: boolean = false,
  ): Promise<SiloConvertSummary<SiloConvertType>[]> {
    // Check if already aborted
    throwIfAborted(signal);
    await this.priceCache.update(forceUpdateCache).catch((e) => {
      console.error("[SiloConvert/quote] FAILED to update cache: ", e);
      throw new ConversionQuotationError(e instanceof Error ? e.message : "Failed to update cache", {
        source,
        target,
      });
    });

    // Check if aborted after async operation
    throwIfAborted(signal);

    // force update the caches if requested
    if (forceUpdateCache) {
      console.debug("[SiloConvert/quote] forceUpdateCache: ", forceUpdateCache);
      this.maxConvertCache.clear();
      this.scalarCache.clear();
    }

    const routes = await this.strategizer.strategize(source, target, amountIn).catch((e) => {
      console.error("[SiloConvert/quote] FAILED to strategize: ", e);
      throw new ConversionQuotationError(e instanceof Error ? e.message : "Failed to strategize", {
        source,
        target,
      });
    });

    // Check if aborted after async operation
    throwIfAborted(signal);

    const quotedRoutes = await Promise.all(
      routes.map(async (route, routeIndex) => {
        const advFarm = new AdvancedFarmWorkflow(this.context.chainId, this.context.wagmiConfig);
        const quotes: ConvertStrategyQuote<SiloConvertType>[] = [];

        const amounts = route.strategies.map((s) => s.amount);
        const crates = pickCratesMultiple(farmerDeposits, "bdv", "asc", amounts);

        // Has to be run sequentially.
        for (const [i, strategy] of route.strategies.entries()) {
          // Check if aborted before each strategy
          throwIfAborted(signal);

          let quote: ConvertStrategyQuote<SiloConvertType>;
          try {
            quote = await strategy.strategy.quote(crates[i], advFarm, slippage, signal);
          } catch (e) {
            console.error(`[SiloConvert/quote${i}] FAILED: `, strategy, e);
            throw e;
          }
          advFarm.add(strategy.strategy.encodeFromQuote(quote));
          quotes.push(quote);
        }

        return {
          route,
          routeIndex,
          quotes,
          workflow: advFarm,
        };
      }),
    ).catch((e) => {
      console.error("[SiloConvert/quote] FAILED to quote routes: ", e);
      throw new ConversionQuotationError(e instanceof Error ? e.message : "Failed to quote routes", {
        routes,
        quotedRoutes,
      });
    });

    console.debug("[SiloConvert/quote] quotedRoutes: ", quotedRoutes);

    const simulationsRawResults = await Promise.all(
      quotedRoutes.map((route) =>
        route.workflow
          .simulate({
            account: this.context.account,
            after: this.priceCache.constructPriceAdvPipe({ noTokenPrices: true }),
          })
          .catch((e) => {
            console.error("[SiloConvert/quote] FAILED to simulate routes : ", route, e);
            throw new SimulationError("quote", e instanceof Error ? e.message : "Unknown error", {
              routes,
              quotedRoutes,
            });
          })
          .then((r) => {
            console.debug("[SiloConvert/quote] simulated route!: ", route, r);
            return r;
          }),
      ),
    );

    console.debug("[SiloConvert/quote] quotedRoutes: ", quotedRoutes);

    const datas = quotedRoutes.map((route, i): SiloConvertSummary<SiloConvertType> => {
      const rawResponse = simulationsRawResults[i];

      if (!rawResponse || !rawResponse.result) {
        throw new Error(`[SiloConvert/quote] Invalid route index: ${i}`);
      }

      const staticCallResult = [...rawResponse.result];

      let decoded: ReturnType<typeof this.decodeRouteAndPriceResults>;

      try {
        decoded = this.decodeRouteAndPriceResults(staticCallResult, route.route);
      } catch (e) {
        console.error("[SiloConvert/quote] FAILED to decode route and price results: ", e);
        throw new ConversionQuotationError("Failed to decode route and price results", {
          staticCallResult,
          route,
        });
      }

      return {
        ...decoded,
        route: route.route,
        quotes: route.quotes,
        workflow: route.workflow,
        totalAmountOut: decoded.reducedResults.toAmount, // TODO: Remove me when supporting multiple toToken
      };
    });

    console.debug("[SiloConvert/quote] quoting finished!!!", datas);

    return datas;
  }

  private decodeRouteAndPriceResults(
    rawResponse: HashString[],
    route: SiloConvertRoute<SiloConvertType>,
  ): Pick<SiloConvertSummary<SiloConvertType>, "results" | "reducedResults" | "postPriceData"> {
    const mainToken = getChainConstant(this.context.chainId, MAIN_TOKEN);
    try {
      const staticCallResult = [...rawResponse];
      // price result is the last element in the static call result
      const priceResult = staticCallResult.pop();

      const decodedConvertResults = decodeConvertResults(staticCallResult, route.convertType);

      const decodedAdvPipePriceCall = priceResult ? AdvancedPipeWorkflow.decodeResult(priceResult) : undefined;
      const postPriceData = decodedAdvPipePriceCall?.length ? decodePriceResult(decodedAdvPipePriceCall[0]) : undefined;

      return {
        postPriceData,
        ...decodedConvertResults.reduce<Pick<SiloConvertSummary<SiloConvertType>, "results" | "reducedResults">>(
          (prev, curr) => {
            const fromAmount = TV.fromBigInt(curr.fromAmount, route.source.decimals);
            const toAmount = TV.fromBigInt(curr.toAmount, route.target.decimals);
            const fromBdv = TV.fromBigInt(curr.fromBdv, mainToken.decimals);
            const toBdv = TV.fromBigInt(curr.toBdv, mainToken.decimals);
            const toStem = TV.fromBigInt(curr.toStem, mainToken.decimals);

            prev.results.push({ toStem, fromAmount, toAmount, fromBdv, toBdv });
            prev.reducedResults.fromAmount = prev.reducedResults.fromAmount.add(fromAmount);
            prev.reducedResults.toAmount = prev.reducedResults.toAmount.add(toAmount);
            prev.reducedResults.fromBdv = prev.reducedResults.fromBdv.add(fromBdv);
            prev.reducedResults.toBdv = prev.reducedResults.toBdv.add(toBdv);

            return prev;
          },
          {
            results: [],
            reducedResults: {
              fromAmount: TV.fromHuman("0", route.source.decimals),
              toAmount: TV.fromHuman("0", route.target.decimals),
              fromBdv: TV.fromHuman("0", mainToken.decimals),
              toBdv: TV.fromHuman("0", mainToken.decimals),
            },
          },
        ),
      };
    } catch (e) {
      console.error("[SiloConvert/decodeRouteAndPriceResults] FAILED to decode convert and price results: ", e);
      throw new Error("Failed to decode convert and price results");
    }
  }

  getStalkChecks(expectedToStalk: TV) {
    const pipe = new AdvancedPipeWorkflow(this.context.chainId, this.context.wagmiConfig);

    // index0
    pipe.add({
      ...encoders.farmerSilo.balanceOfStalk(this.context.account),
      target: this.context.diamond,
    });

    // Allow a maximum of 0.5% of the balance of grown stalk to be lost in convert.
    const safeMinStalk = expectedToStalk.mul(0.995);

    // index1
    pipe.add(junctionGte(0n, safeMinStalk.toBigInt(), Clipboard.encodeSlot(0, 0, 0)));

    return pipe;
  }

  /**
   * Returns an empty pipeline convert quote.
   */
  // getEmptyResult() {
  //   return {
  //     workflow: new AdvancedFarmWorkflow(8543, defaultWagmiConfig),
  //     quotes: [] as ConvertStrategyQuote<SiloConvertType>[],
  //     totalAmountOut: TV.ZERO,
  //     results: [] as ConvertResultStruct<TV>[],
  //     postPriceData: undefined,
  //   };
  // }
}
