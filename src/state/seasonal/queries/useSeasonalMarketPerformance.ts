import {
  BeanstalkSeasonalMarketPerformanceDocument,
  BeanstalkSeasonalMarketPerformanceQuery,
  MarketPerformanceSeasonal,
} from "@/generated/gql/pintostalk/graphql";
import { SeasonalMarketPerformanceChartData, UseSeasonalMarketPerformanceResult } from "@/utils/types";
import useSeasonalQueries, { SeasonalQueryVars } from "./useSeasonalInternalQueries";
import { paginateSubgraph, PaginationSettings } from "@/utils/paginateSubgraph";
import { useChainId } from "wagmi";
import { subgraphs } from "@/constants/subgraph";
import { useLPTokenToNonPintoUnderlyingMap } from "@/hooks/pinto/useTokenMap";
import useTokenData from "@/state/useTokenData";

export enum SMPChartType {
  USD = 0,
  PERCENT = 1,
}

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
      return new Date();
      // TODO(pp): once timestamp is available
      // return new Date(Number(entry.timestamp) * 1000);
    },
    // Return raw subgraph result for each season
    convertResult: (entry: any) => {
      return entry;
    },
  });

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
          // biome-ignore lint/style/noNonNullAssertion: subgraph invariant - can't be null for valid=true
          value: chartType === SMPChartType.USD ? season.usdChange![tokenIdx] : season.percentChange![tokenIdx],
          timestamp: new Date(), // TODO(pp): once timestamp is available
        });
        ++tokenIdx;
      }
      responseData.NET.push({
        season: season.season,
        value: chartType === SMPChartType.USD ? season.totalUsdChange : season.totalPercentChange,
        timestamp: new Date(), // TODO(pp): once timestamp is available
      });
    }
  }

  console.log("r", sgData, responseData);

  // Expand result for each token
  return {
    data: responseData,
    isLoading: result.isLoading,
    isError: result.isError,
  };
}
