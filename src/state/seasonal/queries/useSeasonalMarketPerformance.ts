import { subgraphs } from "@/constants/subgraph";
import {
  BeanstalkSeasonalMarketPerformanceDocument,
  BeanstalkSeasonalMarketPerformanceQuery,
  MarketPerformanceSeasonal,
} from "@/generated/gql/pintostalk/graphql";
import { useLPTokenToNonPintoUnderlyingMap } from "@/hooks/pinto/useTokenMap";
import useTokenData from "@/state/useTokenData";
import { PaginationSettings, paginateSubgraph } from "@/utils/paginateSubgraph";
import { SeasonalMarketPerformanceChartData, UseSeasonalMarketPerformanceResult } from "@/utils/types";
import { useChainId } from "wagmi";
import useSeasonalQueries, { SeasonalQueryVars } from "./useSeasonalInternalQueries";
import { useSeasonalPrice } from "../seasonalDataHooks";

export enum SMPChartType {
  USD_SEASONAL = 0,
  PERCENT_SEASONAL = 1,
  USD_CUMULATIVE = 2,
  PERCENT_CUMULATIVE = 3,
  TOKEN_PRICES = 4,
}

// To be accessed as CHART_FIELDS[SMPChartType % 2]
const CHART_FIELDS = [
  ["usdChange", "totalUsdChange"],
  ["percentChange", "totalPercentChange"],
];

const accumulateUsd = (prev: number, curr: number): number => {
  return prev + curr;
};
const accumulatePercent = (prev: number, curr: number): number => {
  return (prev + 1) * (curr + 1) - 1;
};

// Manually accumulate values to allow for arbitrary starting point; subgraph cumulative values are since deployment
const accumulator = (chartType: SMPChartType): ((prev: number, curr: number) => number) => {
  if (chartType === SMPChartType.USD_CUMULATIVE) {
    return accumulateUsd;
  } else {
    return accumulatePercent;
  }
};

const paginateSettings: PaginationSettings<
  MarketPerformanceSeasonal,
  BeanstalkSeasonalMarketPerformanceQuery,
  "marketPerformanceSeasonals",
  SeasonalQueryVars
> = {
  primaryPropertyName: "marketPerformanceSeasonals",
  idField: "id",
  nextVars: (value1000: MarketPerformanceSeasonal, prevVars: SeasonalQueryVars) => {
    if (value1000) {
      return {
        ...prevVars,
        from: Number(value1000.season),
      };
    }
  },
};

export function useSeasonalMarketPerformance(
  fromSeason: number,
  toSeason: number,
  chartType: SMPChartType,
): UseSeasonalMarketPerformanceResult {
  const chainId = useChainId();
  const mainToken = useTokenData().mainToken;
  const lpToUnderlyingMap = useLPTokenToNonPintoUnderlyingMap();

  const queryFnFactory = (vars: SeasonalQueryVars) => async () => {
    return await paginateSubgraph(
      paginateSettings,
      subgraphs[chainId].beanstalk,
      BeanstalkSeasonalMarketPerformanceDocument,
      vars,
    );
  };

  const result = useSeasonalQueries("BeanstalkSeasonalMarketPerformanceQuery", {
    fromSeason,
    toSeason,
    queryVars: {},
    historicalQueryFnFactory: queryFnFactory,
    currentQueryFnFactory: queryFnFactory,
    resultTimestamp: (entry) => {
      return new Date(Number(entry.timestamp) * 1000);
    },
    // Return raw subgraph result for each season
    convertResult: (entry: any) => {
      return entry;
    },
  });

  const pintoPriceResult = useSeasonalPrice(fromSeason, toSeason);
  const needsPrice = chartType === SMPChartType.TOKEN_PRICES;
  const priceReady = !needsPrice || !!pintoPriceResult.data;

  // Expand results by token
  const sgData = result.data as unknown as MarketPerformanceSeasonal[];
  const responseData: SeasonalMarketPerformanceChartData = {};
  if (sgData && priceReady) {
    for (let i = 0; i < sgData.length; ++i) {
      const season = sgData[i];
      if (chartType !== SMPChartType.TOKEN_PRICES) {
        responseData.NET ??= [
          {
            season: season.season - 1,
            value: 0,
            timestamp: new Date((Number(season.timestamp) - 60 * 60) * 1000),
          },
        ];

        const value =
          chartType < SMPChartType.USD_CUMULATIVE
            ? Number(season[CHART_FIELDS[chartType % 2][1]])
            : accumulator(chartType)(
                responseData.NET[responseData.NET.length - 1].value,
                Number(season[CHART_FIELDS[chartType % 2][1]]),
              );
        responseData.NET.push({
          season: season.season,
          value,
          timestamp: new Date(Number(season.timestamp) * 1000),
        });
      } else {
        responseData.NET ??= [];
        responseData.NET.push({
          season: season.season,
          // Assumption is that the season numbers are lining up 1:1 between price/marketPerformance data
          // biome-ignore lint/style/noNonNullAssertion: can't be null given priceReady check
          value: pintoPriceResult.data![i].value,
          timestamp: new Date(Number(season.timestamp) * 1000),
        });
      }

      let tokenIdx = 0;
      for (const token of season.silo.whitelistedTokens) {
        // Skip Pinto token
        if (token === mainToken.address) {
          continue;
        }

        const underlyingToken = lpToUnderlyingMap[token];
        if (!underlyingToken) {
          continue;
        }

        if (chartType !== SMPChartType.TOKEN_PRICES) {
          responseData[underlyingToken.symbol] ??= [
            {
              season: season.season - 1,
              value: 0,
              timestamp: new Date((Number(season.timestamp) - 60 * 60) * 1000),
            },
          ];
          const arr = responseData[underlyingToken.symbol];

          const value =
            chartType < SMPChartType.USD_CUMULATIVE
              ? Number(season[CHART_FIELDS[chartType % 2][0]][tokenIdx])
              : accumulator(chartType)(
                  arr[arr.length - 1].value,
                  Number(season[CHART_FIELDS[chartType % 2][0]][tokenIdx]),
                );
          arr.push({
            season: season.season,
            value,
            timestamp: new Date(Number(season.timestamp) * 1000),
          });
        } else {
          responseData[underlyingToken.symbol] ??= [];
          responseData[underlyingToken.symbol].push({
            season: season.season,
            // biome-ignore lint/style/noNonNullAssertion: can't be null given only valid=true is retrieved.
            value: Number(season.thisSeasonTokenUsdPrices![tokenIdx]),
            timestamp: new Date(Number(season.timestamp) * 1000),
          });
        }

        ++tokenIdx;
      }
    }
  }

  return {
    data: !!sgData ? responseData : undefined,
    isLoading: result.isLoading || (needsPrice && pintoPriceResult.isLoading),
    isError: result.isError || (needsPrice && pintoPriceResult.isError),
  };
}
