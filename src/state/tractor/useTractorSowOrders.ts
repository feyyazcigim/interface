import { sowBlueprintv0ABI } from "@/constants/abi/SowBlueprintv0ABI";
import { SOW_BLUEPRINT_V0_ADDRESS } from "@/constants/address";
import { defaultQuerySettingsMedium } from "@/constants/query";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { OrderbookEntry, TractorAPIOrdersResponse, loadOrderbookData, tractorAPIFetchOrders } from "@/lib/Tractor";
import { queryKeys } from "@/state/queryKeys";
import useCachedLatestBlockQuery from "@/state/useCachedLatestBlockQuery";
import { isDev } from "@/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useChainId, usePublicClient } from "wagmi";
import { useTemperature } from "../useFieldData";

// 1 day / 24 seasons of blocks on Base. 2 seconds per block.
// 24 hours * 60 mins * 60 secs = 86400 seconds
// At 2 seconds per block: 86400 / 2 = 43200 blocks
const TRACTOR_MAX_LOOKBACK_BLOCKS = 43200n;

export function useTractorSowOrderbook(address?: string) {
  const chainId = useChainId();
  const client = usePublicClient({ chainId });
  const diamond = useProtocolAddress();

  const temperature = useTemperature();

  const latestBlockQuery = useCachedLatestBlockQuery({ key: "sowOrdersV0" });

  const ordersQuery = useQuery({
    queryKey: queryKeys.tractor.sowOrdersV0(),
    queryFn: async () => {
      if (!chainId) return;
      const data = await tractorAPIFetchOrders(chainId, { orderType: "SOW_V0", cancelled: false });

      console.log("[TRACTOR/useTractorSowOrderbook/ordersQuery] DATA", {
        data,
      });

      return data;
    },
    enabled: !!chainId,
    ...defaultQuerySettingsMedium,
  });

  // check if the API data exists, is not loading, and is not an error
  const ordersAPIDataExists = Boolean(
    ordersQuery.data?.orders.length && !ordersQuery.isLoading && !ordersQuery.isError,
  );

  // only run the chain query if we have a client, a max temperature, the API data exists, and we have a latest block reference.
  const orderChainQueryEnabled = Boolean(
    client && temperature.max.gt(0) && ordersAPIDataExists && latestBlockQuery.data && ordersQuery.data?.lastUpdated,
  );

  // only use the max lookback if we're not in dev mode or if the API request failed
  const lookbackBlocks = isDev() || !ordersQuery.isError ? TRACTOR_MAX_LOOKBACK_BLOCKS : undefined;

  const ordersChainQuery = useQuery({
    queryKey: queryKeys.tractor.sowOrdersV0Chain({
      lookbackBlocks,
      lastUpdated: ordersQuery.data?.lastUpdated,
      blockInfo: {
        number: latestBlockQuery.data?.number ?? 0n,
        timestamp: latestBlockQuery.data?.timestamp ?? 0n,
      },
    }),
    queryFn: async () => {
      // if (!latestBlockQuery.data || temperature.max.lte(0) || !client) {
      if (temperature.max.lte(0) || !client) {
        return;
      }

      const data = await loadOrderbookData(
        address,
        diamond,
        client,
        latestBlockQuery.data,
        temperature.max.toNumber(),
        ordersQuery.data,
        lookbackBlocks,
      );

      console.log("[TRACTOR/useTractorSowOrderbook/ordersChainQuery] DATA", {
        lookbackBlocks,
        data,
      });

      return data;
    },
    // enabled: orderChainQueryEnabled,
    enabled: !!client && temperature.max.gt(0),
    ...defaultQuerySettingsMedium,
  });

  useEffect(() => {
    if (!ordersChainQuery.data || !ordersQuery.data) {
      return;
    }

    const map = new Map<
      string,
      {
        chain?: OrderbookEntry;
        api?: TractorAPIOrdersResponse["orders"][number];
      }
    >();

    ordersQuery.data.orders.forEach((order) => {
      map.set(order.blueprintHash.toLowerCase(), {
        chain: undefined,
        api: order,
      });
    });

    ordersChainQuery.data.forEach((order) => {
      const existing = map.get(order.requisition.blueprintHash.toLowerCase());

      if (existing) {
        map.set(order.requisition.blueprintHash.toLowerCase(), {
          ...existing,
          chain: order,
        });
      }
    });

    console.log("[TRACTOR/useTractorSowOrdersMAP] MAP", map);
  }, [ordersChainQuery.data, ordersQuery.data]);

  return {
    latestBlockQuery,
  };
}
