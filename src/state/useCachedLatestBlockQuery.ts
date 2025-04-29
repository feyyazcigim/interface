import { defaultQuerySettingsMedium } from "@/constants/query";
import { QueryKey, QueryObserverOptions, useQuery } from "@tanstack/react-query";
import { GetBlockReturnType } from "viem";
import { usePublicClient } from "wagmi";
import { queryKeys } from "./queryKeys";


type UseLatestBlockQueryParameters = Omit<QueryObserverOptions<GetBlockReturnType | undefined>, "queryFn" | "queryKey"> & {
  // if provided, use this key instead of the default
  key?: string
}

const DEFAULT_QUERY_KEY = ["CHAIN", "LATEST_BLOCK"] as const;

const empty: UseLatestBlockQueryParameters = {};

// Provide a default query key if not provided, but allow props to override it
export default function useCachedLatestBlockQuery({ enabled, key, ...props }: UseLatestBlockQueryParameters = empty) {
  const client = usePublicClient();

  return useQuery({
    queryFn: async () => client?.getBlock(),
    queryKey: queryKeys.network.latestBlock(key),
    enabled: !!client && enabled,
    // We only use this block number as a reference, so no need to refetch this aggresively. If we need more aggressive updates, props will override this.
    ...defaultQuerySettingsMedium,
    ...props,
  });
}