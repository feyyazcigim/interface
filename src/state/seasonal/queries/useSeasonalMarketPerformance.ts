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

export enum SMPChartType {
  USD_SEASONAL = 0,
  PERCENT_SEASONAL = 1,
  USD_CUMULATIVE = 2,
  PERCENT_CUMULATIVE = 3,
}
const CHART_FIELDS = [
  ["usdChange", "totalUsdChange"],
  ["percentChange", "totalPercentChange"],
  ["cumulativeUsdChange", "cumulativeTotalUsdChange"],
  ["cumulativePercentChange", "cumulativeTotalPercentChange"],
];

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

  // Expand results by token
  const sgData = result.data as unknown as MarketPerformanceSeasonal[];
  const responseData: SeasonalMarketPerformanceChartData = { NET: [] };
  if (sgData) {
    for (const season of sgData) {
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

        responseData[underlyingToken.symbol] ??= [];
        responseData[underlyingToken.symbol].push({
          season: season.season,
          value: season[CHART_FIELDS[chartType][0]][tokenIdx],
          timestamp: new Date(Number(season.timestamp) * 1000),
        });
        ++tokenIdx;
      }
      responseData.NET.push({
        season: season.season,
        value: season[CHART_FIELDS[chartType][1]],
        timestamp: new Date(Number(season.timestamp) * 1000),
      });
    }
  }

  return {
    data: !!sgData ? responseData : undefined,
    isLoading: result.isLoading,
    isError: result.isError,
  };
}
