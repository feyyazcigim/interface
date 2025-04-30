import { TIME_TO_BLOCKS } from "@/constants/blocks";
import { defaultQuerySettingsMedium } from "@/constants/query";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { OrderbookEntry, TractorAPIOrderType, TractorAPIOrdersResponse, loadOrderbookData } from "@/lib/Tractor";
import TractorAPI, { TractorAPIOrderOptions } from "@/lib/Tractor/api";
import { queryKeys } from "@/state/queryKeys";
import useCachedLatestBlockQuery from "@/state/useCachedLatestBlockQuery";
import { isDev } from "@/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useChainId, usePublicClient } from "wagmi";
import { useTemperature } from "../useFieldData";

export function useTractorSowOrderbook(address?: string, args?: TractorAPIOrderOptions) {
  const chainId = useChainId();
  const client = usePublicClient({ chainId });
  const diamond = useProtocolAddress();

  const temperature = useTemperature();

  const latestBlockQuery = useCachedLatestBlockQuery({ key: "sowOrdersV0" });

  const ordersQuery = useQuery({
    queryKey: queryKeys.tractor.sowOrdersV0(),
    queryFn: async () => {
      if (!chainId) return;
      const options = { orderType: "SOW_V0", cancelled: false, ...args } satisfies TractorAPIOrderOptions;
      const data = await TractorAPI.getOrders(chainId, options);

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

  /**
   * If the orders API request failed, fetch since the TRACTOR_DEPLOYMENT_BLOCK
   * otherwise,
   * - DEV, use a 24 hour lookback to allow for forwarding seasons locally
   * - PROD, use a 1 hour lookback
   */
  const lookbackBlocks = !ordersQuery.error ? (isDev() ? TIME_TO_BLOCKS.day : TIME_TO_BLOCKS.hour) : undefined;

  const ordersChainQuery = useQuery({
    queryKey: queryKeys.tractor.sowOrdersV0Chain({ lookbackBlocks, blockInfo: latestBlockQuery.data }),
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
