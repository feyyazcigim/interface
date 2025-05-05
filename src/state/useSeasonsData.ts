import { TokenValue } from "@/classes/TokenValue";
import { subgraphs } from "@/constants/subgraph";
import { PaginationSettings, paginateMultiQuerySubgraph, paginateSubgraph } from "@/utils/paginateSubgraph";
import { Duration } from "luxon";
import { useMemo } from "react";
import { useChainId } from "wagmi";
import useSeasonalQueries, {
  SeasonalQueryVars,
  useMultiSeasonalQueries,
} from "./seasonal/queries/useSeasonalInternalQueries";
import useTokenData from "./useTokenData";
import {
  Season as BeanstalkSeason,
  BeanstalkSeasonsTableDocument,
  BeanstalkSeasonsTableQuery,
} from "@/generated/gql/pintostalk/graphql";
import { Season as BeanSeason, BeanSeasonsTableDocument, BeanSeasonsTableQuery } from "@/generated/gql/pinto/graphql";

export interface SeasonsTableData {
  season: number;
  timestamp: number;
  caseId: number;
  beanToMaxLpGpPerBdvRatio: number;
  deltaBeanToMaxLpGpPerBdvRatio: number;
  blocksToSoldOutSoil: string;
  deltaBeans: TokenValue;
  instDeltaB: TokenValue;
  instPrice: TokenValue;
  issuedSoil: TokenValue;
  l2sr: TokenValue;
  podRate: TokenValue;
  price: TokenValue;
  raining: boolean;
  rewardBeans: TokenValue;
  deltaDemand: TokenValue;
  deltaSownBeans: TokenValue;
  sownBeans: TokenValue;
  temperature: number;
  deltaTemperature: number;
  twaDeltaB: TokenValue;
  twaPrice: TokenValue;
  deltaPodDemand: TokenValue;
}

/* Everything in here is related to the sorting effort

const orderByValues = {
  instPrice: 'beanHourlySnapshot__instPrice',
  l2sr: 'beanHourlySnapshot__l2sr',
  twaPrice: 'beanHourlySnapshot__twaPrice',
  twaDeltaB: 'beanHourlySnapshot__twaDeltaB',
  instDeltaB: 'beanHourlySnapshot__instDeltaB',
}

const stalkFieldHourlySnapshotsImplicitFilter = {
  field: "0xd1a0d188e861ed9d15773a2f3574a2e94134ba8f"
}

const siloHourlySnapshotsImplicitFilter = {
  silo: "0xd1a0d188e861ed9d15773a2f3574a2e94134ba8f"
}

const whereClauseValues = Object.entries(orderByValues).reduce ((acc, [key, value]) => {
  const [subTable, field] = value.split('__')
  acc[key] = [subTable, field]
  return acc
}, {} as Record<string, [string, string]>)
console.info('whereClauseValues', whereClauseValues)

*/

const stalkPaginateSettings: PaginationSettings<
  BeanstalkSeason,
  BeanstalkSeasonsTableQuery,
  "seasons",
  SeasonalQueryVars
> = {
  primaryPropertyName: "seasons",
  idField: "id",
  nextVars: (value1000: BeanstalkSeason, prevVars: SeasonalQueryVars) => {
    if (value1000) {
      return {
        ...prevVars,
        to: Number(value1000.season),
      };
    }
  },
};

const beanPaginateSettings: PaginationSettings<BeanSeason, BeanSeasonsTableQuery, "seasons", SeasonalQueryVars> = {
  primaryPropertyName: "seasons",
  idField: "id",
  nextVars: (value1000: BeanSeason, prevVars: SeasonalQueryVars) => {
    if (value1000) {
      return {
        ...prevVars,
        to: Number(value1000.beanHourlySnapshot.season.season),
      };
    }
  },
  orderBy: "desc",
};

export default function useSeasonsData(fromSeason: number, toSeason: number) {
  const chainId = useChainId();
  const tokenData = useTokenData();

  const stalkQueryFnFactory = (vars: SeasonalQueryVars) => async () => {
    return await paginateMultiQuerySubgraph(
      stalkPaginateSettings,
      subgraphs[chainId].beanstalk,
      BeanstalkSeasonsTableDocument,
      vars,
    );
  };

  const beanQueryFnFactory = (vars: SeasonalQueryVars) => async () => {
    return await paginateSubgraph(beanPaginateSettings, subgraphs[chainId].bean, BeanSeasonsTableDocument, vars);
  };

  const useStalkQuery = useMultiSeasonalQueries("seasonsTableStalk", {
    fromSeason,
    toSeason,
    queryVars: {},
    historicalQueryFnFactory: stalkQueryFnFactory as any, // TODO: better type support
    currentQueryFnFactory: stalkQueryFnFactory as any, // TODO: better type support
    resultTimestamp: (entry) => {
      return new Date(Number(entry.timestamp) * 1000);
    },
    convertResult: (entry: any) => {
      return entry;
    },
    orderBy: "desc",
  }) as any;

  const useBeanQuery = useSeasonalQueries("seasonsTableBean", {
    fromSeason: fromSeason,
    toSeason: toSeason,
    queryVars: {},
    historicalQueryFnFactory: beanQueryFnFactory,
    currentQueryFnFactory: beanQueryFnFactory,
    resultTimestamp: (entry) => {
      return new Date(Number(entry.timestamp) * 1000);
    },
    convertResult: (entry: any) => {
      return entry;
    },
    orderBy: "desc",
  });

  const transformedData = useMemo(() => {
    if (!useBeanQuery.data || !useStalkQuery.data) {
      return [];
    }
    const stalkResults = useStalkQuery?.data;
    const beanResults = (useBeanQuery?.data as any) || [];
    const { fieldHourlySnapshots, siloHourlySnapshots, seasons: stalkSeasons } = stalkResults || ({} as any);
    const transformedData = beanResults.reduce((acc, season, idx) => {
      const currFieldHourlySnapshots = fieldHourlySnapshots[idx];
      const currSiloHourlySnapshots = siloHourlySnapshots[idx];
      const currStalkSeasons = stalkSeasons[idx];
      const timeSown = currFieldHourlySnapshots.blocksToSoldOutSoil
        ? Duration.fromMillis(currFieldHourlySnapshots.blocksToSoldOutSoil * 2 * 1000).toFormat("mm:ss")
        : "-";
      acc.push({
        ...acc[season.beanHourlySnapshot.season.season],
        season: season.beanHourlySnapshot.season.season,
        timestamp: Number(season.timestamp),
        caseId: Number(currFieldHourlySnapshots.caseId || 0),
        instDeltaB: TokenValue.fromHuman(season.beanHourlySnapshot.instDeltaB, tokenData.mainToken.decimals),
        instPrice: TokenValue.fromHuman(season.beanHourlySnapshot.instPrice, tokenData.mainToken.decimals),
        l2sr: TokenValue.fromHuman(season.beanHourlySnapshot.l2sr * 100, 2),
        twaDeltaB: TokenValue.fromHuman(season.beanHourlySnapshot.twaDeltaB, 2),
        twaPrice: TokenValue.fromHuman(season.beanHourlySnapshot.twaPrice, 4),
        blocksToSoldOutSoil: timeSown ?? "0",
        issuedSoil: TokenValue.fromBlockchain(currFieldHourlySnapshots.issuedSoil, tokenData.mainToken.decimals),
        podRate: TokenValue.fromHuman(currFieldHourlySnapshots.podRate || 0n, 18).mul(100),
        sownBeans: TokenValue.fromBlockchain(currFieldHourlySnapshots.sownBeans, tokenData.mainToken.decimals),
        deltaSownBeans: TokenValue.fromBlockchain(
          currFieldHourlySnapshots.deltaSownBeans,
          tokenData.mainToken.decimals,
        ),
        temperature: TokenValue.fromHuman(currFieldHourlySnapshots.temperature, 1).toNumber(),
        deltaTemperature: TokenValue.fromHuman(currFieldHourlySnapshots.deltaTemperature, 1).toNumber(),
        beanToMaxLpGpPerBdvRatio: currSiloHourlySnapshots.beanToMaxLpGpPerBdvRatio,
        deltaBeanToMaxLpGpPerBdvRatio: TokenValue.fromHuman(
          currSiloHourlySnapshots.deltaBeanToMaxLpGpPerBdvRatio,
          18,
        ).toNumber(),
        deltaBeans: TokenValue.fromBlockchain(currStalkSeasons.deltaBeans, tokenData.mainToken.decimals),
        price: TokenValue.fromHuman(currStalkSeasons.price, 4),
        raining: currStalkSeasons.raining,
        rewardBeans: TokenValue.fromHuman(currStalkSeasons.rewardBeans, 2),
        deltaPodDemand: TokenValue.fromBlockchain(currFieldHourlySnapshots.deltaPodDemand, 18),
      });
      return acc;
    }, [] as any);
    return transformedData;
  }, [useBeanQuery.data, useStalkQuery.data]);

  return {
    isFetching: useBeanQuery.isLoading || useStalkQuery.isLoading,
    data: transformedData,
  };
}
