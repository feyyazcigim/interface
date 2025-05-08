import { TV } from "@/classes/TokenValue";
import { API_SERVICES } from "@/constants/endpoints";
import { PODS } from "@/constants/internalTokens";
import { defaultQuerySettings } from "@/constants/query";
import { MAIN_TOKEN } from "@/constants/tokens";
import { getChainConstant } from "@/utils/chain";
import { Prettify } from "@/utils/types.generic";
import { DefaultError, QueryObserverOptions, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useChainId } from "wagmi";

export type FieldPlotSummaryParams<T extends string | number = number> = {
  bucketSize?: T;
  onlyHarvested?: boolean;
  onlyUnharvested?: boolean;
};

type BaseFieldPlotSummaryResponse = {
  startSeason: number;
  numPlots: number;
  endSeason: number;
};

type RawFieldPlotBucketSummary = Prettify<
  {
    startTimestamp: string;
    startIndex: string;
    endIndex: string;
    avgSownBeansPerPod: number;
    endTimestamp: string;
  } & BaseFieldPlotSummaryResponse
>;

export type FieldPlotBucketSummary = Prettify<
  {
    startTimestamp: number;
    endTimestamp: number;
    bucketSize: number;
    startIndex: TV;
    endIndex: TV;
    avgSownBeansPerPod: TV;
    avgTemperature: TV;
    bucketIndex: number;
  } & BaseFieldPlotSummaryResponse
>;

const endpoint = API_SERVICES.pinto;
const DEFAULT_BUCKET_SIZE = 1000000;

const requestArgs = {
  method: "GET",
  headers: new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
  }),
} as const;

const combineURLParams = (params: FieldPlotSummaryParams = {}) => {
  const urlParams = new URLSearchParams({
    bucketSize: params?.bucketSize?.toString() ?? DEFAULT_BUCKET_SIZE?.toString(),
    onlyHarvested: params?.onlyHarvested?.toString() ?? "false",
    onlyUnharvested: params?.onlyUnharvested?.toString() ?? "true",
  });

  return urlParams;
};

const makeRequest = async (args: URLSearchParams, chainId: number) => {
  const mainToken = getChainConstant(chainId, MAIN_TOKEN);
  const url = `${endpoint}/field/plots-summary?${args.toString()}`;

  const data: RawFieldPlotBucketSummary[] = await fetch(url, { ...requestArgs }).then((r) => r.json());

  return data.map((r, i): FieldPlotBucketSummary => {
    const startIndex = TV.fromBlockchain(r.startIndex, PODS.decimals);
    const endIndex = TV.fromBlockchain(r.endIndex, PODS.decimals);
    const avgSownBeansPerPod = TV.fromHuman(r.avgSownBeansPerPod, mainToken.decimals);
    const avgTemperature = TV.fromHuman(1, avgSownBeansPerPod.decimals).div(avgSownBeansPerPod).sub(1).mul(100);

    return {
      ...r,
      bucketIndex: i,
      bucketSize: endIndex.sub(startIndex).toNumber(),
      startTimestamp: new Date(r.startTimestamp).getTime(),
      endTimestamp: new Date(r.endTimestamp).getTime(),
      startIndex,
      endIndex,
      avgSownBeansPerPod,
      avgTemperature,
    };
  });
};

export type UseBucketedFieldPlotSummaryOptions<T> = FieldPlotSummaryParams &
  Pick<QueryObserverOptions<FieldPlotBucketSummary[] | undefined, DefaultError, T>, "select">;

export default function useBucketedFieldPlotSummary<Data>({
  select,
  ...args
}: UseBucketedFieldPlotSummaryOptions<Data> = {}) {
  // Hooks
  const chainId = useChainId();

  // Query
  const params = combineURLParams(args);

  const queryKey = useMemo(() => ["fieldPlotSummary", params.toString()], [params.toString()]);

  return useQuery<FieldPlotBucketSummary[], DefaultError, Data>({
    queryKey,
    queryFn: () => makeRequest(params, chainId),
    select,
    ...defaultQuerySettings,
  });
}

const tiers = [1_000_000, 500_000, 250_000, 100_000, 50_000] as const;
const REASONABLE_BUCKET_SIZE_RANGE = [10, 60] as const;

const MAX_PER_BUCKET = tiers[0];
const MIN_PER_BUCKET = tiers[tiers.length - 1];

type AggregateFieldPlotBucketSummaryOptions = {
  // the minimum plot indexes per aggregated bucket
  min?: number;
  // the maximum plot indexes per aggregated bucket
  max?: number;
};

// opt for the tier that is the closest to the number of buckets we want
const getBucketSize = (pods: number, options?: AggregateFieldPlotBucketSummaryOptions) => {
  const min = options?.min ?? REASONABLE_BUCKET_SIZE_RANGE[0];
  const max = options?.max ?? REASONABLE_BUCKET_SIZE_RANGE[1];

  const reversedTiers = [...tiers].reverse();

  const bucketSize = reversedTiers.find((tier) => {
    const buckets = Math.ceil(pods / tier);
    return buckets >= min && buckets <= max;
  });

  return bucketSize ?? MAX_PER_BUCKET;
};

// In the case where we have too many bars, we want to combine them into a single bar
export const aggregateFieldPlotBucketSummary = (
  data: FieldPlotBucketSummary[] | undefined,
  options?: AggregateFieldPlotBucketSummaryOptions,
) => {
  // If there is no data, return an empty array
  if (!data?.length) return [];

  const podsCount = data[data.length - 1].endIndex.toNumber() - data[0].startIndex.toNumber();

  const aggregatedBucketSize = getBucketSize(podsCount, options);

  const currBucketSize = data[0].bucketSize;

  const combineCount = Math.ceil(aggregatedBucketSize / currBucketSize);
  // console.log({ currBucketSize, aggregatedBucketSize, combineCount, podsCount });

  // We want to combine x data points into a single bar
  if (combineCount <= 1) return data;

  const aggregated: FieldPlotBucketSummary[] = [];

  let bucket: FieldPlotBucketSummary[] = [];
  let idx = 0;
  let curr: FieldPlotBucketSummary = data[0];

  while (idx < data.length) {
    while (bucket.length < combineCount && idx < data.length) {
      curr = data[idx];
      bucket.push(curr);
      idx += 1;
    }

    let totalWeight = TV.fromHuman(0, curr.avgSownBeansPerPod.decimals);
    let weightedSum = TV.fromHuman(0, curr.avgSownBeansPerPod.decimals);

    const start = bucket[0];
    const end = bucket[bucket.length - 1];
    const totalSize = end.endIndex.sub(start.startIndex);

    const copy: FieldPlotBucketSummary = {
      startSeason: start.startSeason,
      endSeason: end.endSeason,
      numPlots: 0,
      startTimestamp: start.startTimestamp,
      endTimestamp: end.endTimestamp,
      startIndex: start.startIndex,
      endIndex: end.endIndex,
      bucketSize: totalSize.toNumber(),
      avgSownBeansPerPod: TV.ZERO,
      avgTemperature: TV.ZERO,
      bucketIndex: aggregated.length,
    };

    for (const item of bucket) {
      copy.numPlots += item.numPlots;
      weightedSum = weightedSum.add(item.avgSownBeansPerPod.mul(item.bucketSize));
      totalWeight = totalWeight.add(item.bucketSize);
    }

    const avgSownBeansPerPod = totalWeight.gt(0) ? weightedSum.div(totalWeight) : TV.ZERO;
    const avgTemperature = TV.fromHuman(1, 6).div(avgSownBeansPerPod).sub(1).mul(100);

    aggregated.push({ ...copy, avgSownBeansPerPod, avgTemperature });

    bucket = [];
    weightedSum = TV.ZERO;
    totalWeight = TV.ZERO;
  }

  return aggregated;
};
