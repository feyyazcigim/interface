import { TV } from "@/classes/TokenValue";
import { API_SERVICES } from "@/constants/endpoints";
import { PODS } from "@/constants/internalTokens";
import { defaultQuerySettings } from "@/constants/query";
import { MAIN_TOKEN } from "@/constants/tokens";
import { getChainConstant } from "@/utils/chain";
import { Prettify } from "@/utils/types.generic";
import { safeJSONStringify } from "@/utils/utils";
import { DefaultError, QueryObserverOptions, useQuery } from "@tanstack/react-query";
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
const DEFAULT_BUCKET_SIZE = 50_000;

const defaultArgs: FieldPlotSummaryParams<string> = {
  bucketSize: DEFAULT_BUCKET_SIZE.toString(),
  onlyHarvested: false,
  onlyUnharvested: false,
} as const;

const requestArgs = {
  method: "GET",
  headers: new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
  }),
} as const;

const combineURLParams = (params?: FieldPlotSummaryParams) => ({ ...defaultArgs, ...params });

const makeRequest = async (params: string, signal: AbortSignal, chainId: number, bucketSize: number | undefined) => {
  const mainToken = getChainConstant(chainId, MAIN_TOKEN);

  const url = `${endpoint}/field-plot-summary?${params}`;
  const data: RawFieldPlotBucketSummary[] = await fetch(url, { signal, ...requestArgs }).then((r) => r.json());

  return data.map((r, i): FieldPlotBucketSummary => {
    const startIndex = TV.fromBlockchain(r.startIndex, PODS.decimals);
    const endIndex = TV.fromBlockchain(r.endIndex, PODS.decimals);
    const avgSownBeansPerPod = TV.fromBlockchain(r.avgSownBeansPerPod, mainToken.decimals);
    const avgTemperature = TV.fromHuman(1, avgSownBeansPerPod.decimals).div(avgSownBeansPerPod).sub(1).mul(100);

    return {
      ...r,
      bucketIndex: i,
      bucketSize: bucketSize ?? DEFAULT_BUCKET_SIZE,
      startTimestamp: new Date(r.startTimestamp).getTime(),
      endTimestamp: new Date(r.endTimestamp).getTime(),
      startIndex,
      endIndex,
      avgSownBeansPerPod,
      avgTemperature,
    };
  });
};

export type UseBucketedFieldPlotSummaryOptions<T> = {
  args?: FieldPlotSummaryParams;
} & Pick<QueryObserverOptions<FieldPlotBucketSummary[] | undefined, DefaultError, T>, "select">;

export default function useBucketedFieldPlotSummary<Data>({ args, select }: UseBucketedFieldPlotSummaryOptions<Data> = {}) {
  // Hooks
  const chainId = useChainId();

  // Query
  const params = safeJSONStringify(combineURLParams(args), undefined);

  return useQuery<FieldPlotBucketSummary[], DefaultError, Data | undefined>({
    queryKey: ["fieldPlotSummary"],
    queryFn: async ({ signal }) => makeRequest(params, signal, chainId, args?.bucketSize),
    select,
    ...defaultQuerySettings,
  });
}
