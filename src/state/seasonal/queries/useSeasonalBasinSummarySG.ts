import { subgraphs } from "@/constants/subgraph";
import { beanstalkAddress } from "@/generated/contractHooks";
import {
  BasinSeasonalSummaryDocument,
  BasinSeasonalSummaryQuery,
  BeanstalkHourlySnapshot,
} from "@/generated/gql/exchange/graphql";
import { PaginationSettings, paginateSubgraph } from "@/utils/paginateSubgraph";
import { UseSeasonalResult } from "@/utils/types";
import { useChainId } from "wagmi";
import useSeasonalQueries, { ConvertEntryFn, SeasonalQueryVars } from "./useSeasonalInternalQueries";

const paginateSettings: PaginationSettings<
  BeanstalkHourlySnapshot,
  BasinSeasonalSummaryQuery,
  "beanstalkHourlySnapshots",
  SeasonalQueryVars
> = {
  primaryPropertyName: "beanstalkHourlySnapshots",
  idField: "id",
  nextVars: (value1000: BeanstalkHourlySnapshot, prevVars: SeasonalQueryVars) => {
    if (value1000) {
      return {
        ...prevVars,
        from: Number(value1000.season.season),
      };
    }
  },
};

export default function useSeasonalBasinSummarySG(
  fromSeason: number,
  toSeason: number,
  convertResult: ConvertEntryFn<BeanstalkHourlySnapshot>,
): UseSeasonalResult {
  const chainId = useChainId();
  const queryFnFactory = (vars: SeasonalQueryVars) => async () => {
    return await paginateSubgraph(paginateSettings, subgraphs[chainId].basin, BasinSeasonalSummaryDocument, vars);
  };

  return useSeasonalQueries("BasinSeasonalSummaryQuery", {
    fromSeason,
    toSeason,
    queryVars: { field: beanstalkAddress[chainId] },
    historicalQueryFnFactory: queryFnFactory,
    currentQueryFnFactory: queryFnFactory,
    resultTimestamp: (entry) => {
      return new Date(Number(entry.createdTimestamp) * 1000);
    },
    convertResult,
  });
}
