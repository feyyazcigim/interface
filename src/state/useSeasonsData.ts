import { TokenValue } from "@/classes/TokenValue";
import { PODS, STALK } from "@/constants/internalTokens";
import { subgraphs } from "@/constants/subgraph";
import {
  BasinAdvancedChartDocument,
  BasinAdvancedChartQuery,
  BeanstalkHourlySnapshot,
} from "@/generated/gql/exchange/graphql";
import { BeanAdvancedChartDocument, BeanAdvancedChartQuery, Season as BeanSeason } from "@/generated/gql/pinto/graphql";
import {
  BeanstalkAdvancedChartDocument,
  BeanstalkAdvancedChartQuery,
  Season as BeanstalkSeason,
} from "@/generated/gql/pintostalk/graphql";
import { PaginationSettings, paginateMultiQuerySubgraph, paginateSubgraph } from "@/utils/paginateSubgraph";
import { Duration } from "luxon";
import { useCallback, useMemo } from "react";
import { useChainId } from "wagmi";
import { APYWindow, useSeasonalAPYs } from "./seasonal/queries/useSeasonalAPY";
import useSeasonalInflowSnapshots from "./seasonal/queries/useSeasonalInflowSnapshots";
import useSeasonalQueries, {
  SeasonalQueryVars,
  useMultiSeasonalQueries,
} from "./seasonal/queries/useSeasonalInternalQueries";
import useSeasonalTractorSnapshots from "./seasonal/queries/useSeasonalTractorSnapshots";
import useTokenData from "./useTokenData";

export interface SeasonsTableData {
  season: number;
  timestamp: number;
  caseId: number;
  sunriseBlock: number;
  beanToMaxLpGpPerBdvRatio: number;
  deltaBeanToMaxLpGpPerBdvRatio: number;
  blocksToSoldOutSoil: string;
  deltaBeans: TokenValue;
  instDeltaB: TokenValue;
  instPrice: TokenValue;
  issuedSoil: TokenValue;
  cultivationFactor: TokenValue;
  l2sr: TokenValue;
  podRate: TokenValue;
  price: TokenValue;
  raining: boolean;
  rewardBeans: TokenValue;
  deltaSownBeans: TokenValue;
  sownBeans: TokenValue;
  temperature: number;
  deltaTemperature: number;
  twaDeltaB: TokenValue;
  twaPrice: TokenValue;
  deltaPodDemand: TokenValue;
  crosses: number;
  marketCap: number;
  supply: TokenValue;
  supplyInPegLP: TokenValue;
  realRateOfReturn: TokenValue;
  unharvestablePods: TokenValue;
  harvestedPods: TokenValue;
  numberOfSows: number;
  numberOfSowers: number;
  stalk: TokenValue;
  cumulativeVolumeNet: number;
  cumulativeBuyVolumeUSD: number;
  cumulativeSellVolumeUSD: number;
  cumulativeVolumeUSD: number;
  deltaVolumeNet: number;
  deltaBuyVolumeUSD: number;
  deltaSellVolumeUSD: number;
  deltaVolumeUSD: number;
  cumulativeConvertVolumeNet: number;
  cumulativeConvertUpVolumeUSD: number;
  cumulativeConvertDownVolumeUSD: number;
  cumulativeConvertVolumeUSD: number;
  cumulativeConvertNeutralTransferVolumeUSD: number;
  deltaConvertVolumeNet: number;
  deltaConvertUpVolumeUSD: number;
  deltaConvertDownVolumeUSD: number;
  deltaConvertVolumeUSD: number;
  deltaConvertNeutralTransferVolumeUSD: number;
  liquidityUSD: number;
  deltaLiquidityUSD: number;
  pinto30d: number;
  pinto7d: number;
  pinto24h: number;
  tractorSownPinto: TokenValue;
  tractorPodsMinted: TokenValue;
  tractorSowingQueue: TokenValue;
  tractorMaxSeasonalSow: TokenValue;
  tractorCumulativeTips: TokenValue;
  tractorMaxActiveTip: TokenValue;
  tractorExecutions: number;
  tractorPublishers: number;
  inflowAllCumulativeNet: number;
  inflowAllCumulativeIn: number;
  inflowAllCumulativeOut: number;
  inflowAllCumulativeVolume: number;
  inflowAllDeltaNet: number;
  inflowAllDeltaIn: number;
  inflowAllDeltaOut: number;
  inflowAllDeltaVolume: number;
  inflowSiloCumulativeNet: number;
  inflowSiloCumulativeIn: number;
  inflowSiloCumulativeOut: number;
  inflowSiloCumulativeVolume: number;
  inflowSiloDeltaNet: number;
  inflowSiloDeltaIn: number;
  inflowSiloDeltaOut: number;
  inflowSiloDeltaVolume: number;
  inflowFieldCumulativeNet: number;
  inflowFieldCumulativeIn: number;
  inflowFieldCumulativeOut: number;
  inflowFieldCumulativeVolume: number;
  inflowFieldDeltaNet: number;
  inflowFieldDeltaIn: number;
  inflowFieldDeltaOut: number;
  inflowFieldDeltaVolume: number;
}

const stalkPaginateSettings: PaginationSettings<
  BeanstalkSeason,
  BeanstalkAdvancedChartQuery,
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

const beanPaginateSettings: PaginationSettings<BeanSeason, BeanAdvancedChartQuery, "seasons", SeasonalQueryVars> = {
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

const basinPaginateSettings: PaginationSettings<
  BeanstalkHourlySnapshot,
  BasinAdvancedChartQuery,
  "beanstalkHourlySnapshots",
  SeasonalQueryVars
> = {
  primaryPropertyName: "beanstalkHourlySnapshots",
  idField: "id",
  nextVars: (value1000: BeanstalkHourlySnapshot, prevVars: SeasonalQueryVars) => {
    if (value1000) {
      return {
        ...prevVars,
        to: Number(value1000.season.season),
      };
    }
  },
  orderBy: "desc",
};

export default function useSeasonsData(
  fromSeason: number,
  toSeason: number,
  {
    beanstalkData = true,
    beanData = true,
    basinData = true,
    apyData = true,
    tractorData = true,
    inflowData = true,
  } = {},
) {
  const chainId = useChainId();
  const tokenData = useTokenData();

  const stalkQueryFnFactory = useCallback(
    (vars: SeasonalQueryVars) => async () => {
      return paginateMultiQuerySubgraph(
        stalkPaginateSettings,
        subgraphs[chainId].beanstalk,
        BeanstalkAdvancedChartDocument,
        vars,
      );
    },
    [chainId],
  );

  const beanQueryFnFactory = useCallback(
    (vars: SeasonalQueryVars) => async () => {
      return paginateSubgraph(beanPaginateSettings, subgraphs[chainId].bean, BeanAdvancedChartDocument, vars);
    },
    [chainId],
  );

  const basinQueryFnFactory = useCallback(
    (vars: SeasonalQueryVars) => async () => {
      return paginateSubgraph(basinPaginateSettings, subgraphs[chainId].basin, BasinAdvancedChartDocument, vars);
    },
    [chainId],
  );

  const useStalkQuery = useMultiSeasonalQueries("all_seasonsTableStalk", {
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
    enabled: beanstalkData,
  }) as any;

  const useBeanQuery = useSeasonalQueries("all_seasonsTableBean", {
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
    enabled: beanData,
  });

  const useBasinQuery = useSeasonalQueries("all_seasonsTableBasin", {
    fromSeason: fromSeason,
    toSeason: toSeason,
    queryVars: {},
    historicalQueryFnFactory: basinQueryFnFactory,
    currentQueryFnFactory: basinQueryFnFactory,
    resultTimestamp: (entry) => {
      return new Date(Number(entry.createdTimestamp) * 1000);
    },
    convertResult: (entry: any) => {
      return entry;
    },
    orderBy: "desc",
    enabled: basinData,
  });

  const useAPYQuery = useSeasonalAPYs(tokenData.mainToken.address, fromSeason, toSeason, { enabled: apyData });

  const useTractorQuery = useSeasonalTractorSnapshots("SOW_V0", fromSeason, toSeason, (e: any) => e, {
    orderBy: "desc",
    enabled: tractorData,
  });

  const useInflowQuery = useSeasonalInflowSnapshots(fromSeason, toSeason, (e: any) => e, {
    orderBy: "desc",
    enabled: inflowData,
  });

  const transformedData = useMemo(() => {
    if (
      (beanstalkData && Object.keys(useStalkQuery.data || {}).length === 0) ||
      (beanData && Object.keys(useBeanQuery.data || {}).length === 0) ||
      (basinData && Object.keys(useBasinQuery.data || {}).length === 0) ||
      (apyData && Object.keys(useAPYQuery.data || {}).length === 0) ||
      (tractorData && Object.keys(useTractorQuery.data || {}).length === 0) ||
      (inflowData && Object.keys(useInflowQuery.data || {}).length === 0)
    ) {
      return [];
    }
    const stalkResults = useStalkQuery?.data || { fieldHourlySnapshots: [], siloHourlySnapshots: [], stalkSeasons: [] };
    const beanResults = useBeanQuery?.data || ([] as any);
    const basinResults = useBasinQuery?.data || ([] as any);
    const {
      [APYWindow.MONTHLY]: apy30d,
      [APYWindow.WEEKLY]: apy7d,
      [APYWindow.DAILY]: apy24h,
    } = useAPYQuery?.data || {};
    const tractorSnapshots = useTractorQuery?.data || ([] as any);
    const inflowSnapshots = useInflowQuery?.data || ([] as any);

    const maxLength = Math.max(
      beanResults.length,
      stalkResults.fieldHourlySnapshots.length,
      basinResults.length,
      apy24h?.length || 0,
      tractorSnapshots.length,
      inflowSnapshots.length,
    );

    const transformedData: SeasonsTableData[] = [];
    for (let idx = 0; idx < maxLength; ++idx) {
      const allData: Partial<SeasonsTableData> = {};

      if (beanstalkData) {
        const currFieldHourlySnapshots = stalkResults.fieldHourlySnapshots[idx];
        const currSiloHourlySnapshots = stalkResults.siloHourlySnapshots[idx];
        const currStalkSeasons = stalkResults.seasons[idx];
        const timeSown = currFieldHourlySnapshots.blocksToSoldOutSoil
          ? Duration.fromMillis(currFieldHourlySnapshots.blocksToSoldOutSoil * 2 * 1000).toFormat("mm:ss")
          : "-";

        allData.caseId = Number(currFieldHourlySnapshots.caseId || 0);
        allData.blocksToSoldOutSoil = timeSown ?? "0";
        allData.issuedSoil = TokenValue.fromBlockchain(
          currFieldHourlySnapshots.issuedSoil,
          tokenData.mainToken.decimals,
        );
        allData.podRate = TokenValue.fromHuman(currFieldHourlySnapshots.podRate || 0n, 18).mul(100);
        allData.sownBeans = TokenValue.fromBlockchain(currFieldHourlySnapshots.sownBeans, tokenData.mainToken.decimals);
        allData.deltaSownBeans = TokenValue.fromBlockchain(
          currFieldHourlySnapshots.deltaSownBeans,
          tokenData.mainToken.decimals,
        );
        allData.temperature = TokenValue.fromHuman(currFieldHourlySnapshots.temperature, 1).toNumber();
        allData.deltaTemperature = TokenValue.fromHuman(currFieldHourlySnapshots.deltaTemperature, 1).toNumber();
        allData.beanToMaxLpGpPerBdvRatio = currSiloHourlySnapshots.beanToMaxLpGpPerBdvRatio;
        allData.deltaBeanToMaxLpGpPerBdvRatio = TokenValue.fromHuman(
          currSiloHourlySnapshots.deltaBeanToMaxLpGpPerBdvRatio,
          18,
        ).toNumber();
        allData.deltaBeans = TokenValue.fromBlockchain(currStalkSeasons.deltaBeans, tokenData.mainToken.decimals);
        allData.price = TokenValue.fromHuman(currStalkSeasons.price, 4);
        allData.raining = currStalkSeasons.raining;
        allData.rewardBeans = TokenValue.fromHuman(currStalkSeasons.rewardBeans, 2);
        allData.deltaPodDemand = TokenValue.fromBlockchain(currFieldHourlySnapshots.deltaPodDemand, 18);
        allData.realRateOfReturn = TokenValue.fromHuman(currFieldHourlySnapshots.realRateOfReturn || 0n, 18).mul(100);
        allData.unharvestablePods = TokenValue.fromBlockchain(
          currFieldHourlySnapshots.unharvestablePods || 0n,
          PODS.decimals,
        );
        allData.harvestedPods = TokenValue.fromBlockchain(currFieldHourlySnapshots.harvestedPods || 0n, PODS.decimals);
        allData.numberOfSowers = currFieldHourlySnapshots.numberOfSowers;
        allData.numberOfSows = currFieldHourlySnapshots.numberOfSows;
        allData.stalk = TokenValue.fromBlockchain(currSiloHourlySnapshots.stalk || 0n, STALK.decimals);

        if (currFieldHourlySnapshots.cultivationFactor !== null) {
          allData.cultivationFactor = TokenValue.fromHuman(currFieldHourlySnapshots.cultivationFactor, 2);
        }

        if (!allData.season) {
          allData.season = currStalkSeasons.season;
          allData.timestamp = Number(currStalkSeasons.createdAt || 0);
          allData.sunriseBlock = Number(currStalkSeasons.sunriseBlock || 0);
        }
      }

      if (beanData) {
        const beanHourly = beanResults[idx].beanHourlySnapshot;
        allData.crosses = beanHourly.crosses;
        allData.marketCap = Number(beanHourly.marketCap);
        allData.supply = TokenValue.fromBlockchain(beanHourly.supply, tokenData.mainToken.decimals);
        allData.supplyInPegLP = TokenValue.fromBlockchain(beanHourly.supply, tokenData.mainToken.decimals);
        allData.instDeltaB = TokenValue.fromHuman(beanHourly.instDeltaB, tokenData.mainToken.decimals);
        allData.instPrice = TokenValue.fromHuman(beanHourly.instPrice, tokenData.mainToken.decimals);
        allData.l2sr = TokenValue.fromHuman(beanHourly.l2sr * 100, 2);
        allData.twaDeltaB = TokenValue.fromHuman(beanHourly.twaDeltaB, 2);
        allData.twaPrice = TokenValue.fromHuman(beanHourly.twaPrice, 4);

        if (!allData.season) {
          allData.season = beanHourly.season.season;
          allData.timestamp = Number(beanHourly.season.timestamp || 0);
        }
      }

      if (basinData) {
        const currBasinSeason = basinResults[idx];
        allData.cumulativeVolumeNet =
          Number(currBasinSeason.cumulativeBuyVolumeUSD) - Number(currBasinSeason.cumulativeSellVolumeUSD);
        allData.cumulativeBuyVolumeUSD = Number(currBasinSeason.cumulativeBuyVolumeUSD);
        allData.cumulativeSellVolumeUSD = Number(currBasinSeason.cumulativeSellVolumeUSD);
        allData.cumulativeVolumeUSD = Number(currBasinSeason.cumulativeTradeVolumeUSD);
        allData.deltaVolumeNet = Number(currBasinSeason.deltaBuyVolumeUSD) - Number(currBasinSeason.deltaSellVolumeUSD);
        allData.deltaBuyVolumeUSD = Number(currBasinSeason.deltaBuyVolumeUSD);
        allData.deltaSellVolumeUSD = Number(currBasinSeason.deltaSellVolumeUSD);
        allData.deltaVolumeUSD = Number(currBasinSeason.deltaTradeVolumeUSD);
        allData.cumulativeConvertVolumeNet =
          Number(currBasinSeason.cumulativeConvertUpVolumeUSD) - Number(currBasinSeason.cumulativeConvertDownVolumeUSD);
        allData.cumulativeConvertUpVolumeUSD = Number(currBasinSeason.cumulativeConvertUpVolumeUSD);
        allData.cumulativeConvertDownVolumeUSD = Number(currBasinSeason.cumulativeConvertDownVolumeUSD);
        allData.cumulativeConvertVolumeUSD = Number(currBasinSeason.cumulativeConvertVolumeUSD);
        allData.cumulativeConvertNeutralTransferVolumeUSD = Number(
          currBasinSeason.cumulativeConvertNeutralTransferVolumeUSD,
        );
        allData.deltaConvertVolumeNet =
          Number(currBasinSeason.deltaConvertUpVolumeUSD) - Number(currBasinSeason.deltaConvertDownVolumeUSD);
        allData.deltaConvertUpVolumeUSD = Number(currBasinSeason.deltaConvertUpVolumeUSD);
        allData.deltaConvertDownVolumeUSD = Number(currBasinSeason.deltaConvertDownVolumeUSD);
        allData.deltaConvertVolumeUSD = Number(currBasinSeason.deltaConvertVolumeUSD);
        allData.deltaConvertNeutralTransferVolumeUSD = Number(currBasinSeason.deltaConvertNeutralTransferVolumeUSD);
        allData.liquidityUSD = Number(currBasinSeason.totalLiquidityUSD);
        allData.deltaLiquidityUSD = Number(currBasinSeason.deltaLiquidityUSD);

        if (!allData.season) {
          allData.season = currBasinSeason.season.season;
          allData.timestamp = Number(currBasinSeason.createdTimestamp);
        }
      }

      if (apyData) {
        allData.pinto30d = apy30d?.[idx]?.value || 0;
        allData.pinto7d = apy7d?.[idx]?.value || 0;
        allData.pinto24h = apy24h?.[idx]?.value || 0;

        if (!allData.season) {
          allData.season = apy24h?.[idx]?.season;
          allData.timestamp = apy24h?.[idx]?.timestamp ? apy24h[idx].timestamp.getTime() / 1000 : undefined;
        }
      }

      if (tractorData) {
        // Ensure tractor api response is fully caught up/in sync
        if (!allData.season || tractorSnapshots[idx]?.season === allData.season) {
          allData.tractorSownPinto = TokenValue.fromBlockchain(
            tractorSnapshots[idx]?.totalPintoSown || 0n,
            PODS.decimals,
          );
          allData.tractorPodsMinted = TokenValue.fromBlockchain(
            tractorSnapshots[idx]?.totalPodsMinted || 0n,
            PODS.decimals,
          );
          allData.tractorSowingQueue = TokenValue.fromBlockchain(
            tractorSnapshots[idx]?.totalCascadeFundedBelowTemp || 0n,
            PODS.decimals,
          );
          allData.tractorMaxSeasonalSow = TokenValue.fromBlockchain(
            tractorSnapshots[idx]?.maxSowThisSeason || 0n,
            PODS.decimals,
          );
          allData.tractorCumulativeTips = TokenValue.fromBlockchain(
            tractorSnapshots[idx]?.totalTipsPaid || 0n,
            PODS.decimals,
          );
          allData.tractorMaxActiveTip = TokenValue.fromBlockchain(
            tractorSnapshots[idx]?.currentMaxTip || 0n,
            PODS.decimals,
          );
          allData.tractorExecutions = tractorSnapshots[idx]?.totalExecutions || 0;
          allData.tractorPublishers = tractorSnapshots[idx]?.uniquePublishers || 0;

          if (!allData.season) {
            allData.season = tractorSnapshots[idx]?.season;
            allData.timestamp = new Date(tractorSnapshots[idx]?.snapshotTimestamp).getTime() / 1000;
          }
        }
      }

      if (inflowData) {
        // Ensure api response is fully caught up/in sync
        const currInflow = inflowSnapshots[idx];
        if (!allData.season || currInflow?.season === allData.season) {
          allData.inflowAllCumulativeNet = currInflow.all.cumulative.net;
          allData.inflowAllCumulativeIn = currInflow.all.cumulative.in;
          allData.inflowAllCumulativeOut = currInflow.all.cumulative.out;
          allData.inflowAllCumulativeVolume = currInflow.all.cumulative.volume;
          allData.inflowAllDeltaNet = currInflow.all.delta.net;
          allData.inflowAllDeltaIn = currInflow.all.delta.in;
          allData.inflowAllDeltaOut = currInflow.all.delta.out;
          allData.inflowAllDeltaVolume = currInflow.all.delta.volume;
          allData.inflowSiloCumulativeNet = currInflow.silo.cumulative.net;
          allData.inflowSiloCumulativeIn = currInflow.silo.cumulative.in;
          allData.inflowSiloCumulativeOut = currInflow.silo.cumulative.out;
          allData.inflowSiloCumulativeVolume = currInflow.silo.cumulative.volume;
          allData.inflowSiloDeltaNet = currInflow.silo.delta.net;
          allData.inflowSiloDeltaIn = currInflow.silo.delta.in;
          allData.inflowSiloDeltaOut = currInflow.silo.delta.out;
          allData.inflowSiloDeltaVolume = currInflow.silo.delta.volume;
          allData.inflowFieldCumulativeNet = currInflow.field.cumulative.net;
          allData.inflowFieldCumulativeIn = currInflow.field.cumulative.in;
          allData.inflowFieldCumulativeOut = currInflow.field.cumulative.out;
          allData.inflowFieldCumulativeVolume = currInflow.field.cumulative.volume;
          allData.inflowFieldDeltaNet = currInflow.field.delta.net;
          allData.inflowFieldDeltaIn = currInflow.field.delta.in;
          allData.inflowFieldDeltaOut = currInflow.field.delta.out;
          allData.inflowFieldDeltaVolume = currInflow.field.delta.volume;

          if (!allData.season) {
            allData.season = currInflow.season;
            allData.timestamp = new Date(currInflow.snapshotTimestamp).getTime() / 1000;
          }
        }
      }
      transformedData.push(allData as SeasonsTableData);
    }
    return transformedData;
  }, [
    useBeanQuery.data,
    useStalkQuery.data,
    useBasinQuery.data,
    useAPYQuery.data,
    useTractorQuery.data,
    tokenData.mainToken.decimals,
    beanstalkData,
    beanData,
    basinData,
    apyData,
    tractorData,
  ]);

  return {
    isFetching: useBeanQuery.isLoading || useStalkQuery.isLoading,
    data: transformedData,
  };
}
