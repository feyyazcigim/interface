import { TIME_TO_BLOCKS } from "@/constants/blocks";
import { defaultQuerySettingsMedium } from "@/constants/query";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { OrderbookEntry, TractorAPIOrdersResponse, loadOrderbookData } from "@/lib/Tractor";
import TractorAPI, { TractorAPIOrderOptions } from "@/lib/Tractor/api";
import { queryKeys } from "@/state/queryKeys";
import { isDev } from "@/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useChainId, usePublicClient } from "wagmi";
import { useTemperature } from "../useFieldData";
import { HashString } from "@/utils/types.generic";

const getLookbackBlocks = (chainOnly: boolean, error: boolean) => {
  if (chainOnly || error) return undefined;
  return isDev() ? TIME_TO_BLOCKS.day : TIME_TO_BLOCKS.hour;
};

const useTractorAPISowOrders = (address?: HashString, args?: TractorAPIOrderOptions) => {
  const chainId = useChainId();

  return useQuery({
    queryKey: queryKeys.tractor.sowOrdersV0(),
    queryFn: async () => {
      if (!chainId) return;
      const options = { orderType: "SOW_V0",  cancelled: false, ...args } satisfies TractorAPIOrderOptions;
      if (address) options.publisher = address;

      return TractorAPI.getOrders(options);
    },
    enabled: !!chainId,
    ...defaultQuerySettingsMedium,
  });
}

export function useTractorSowOrderbook(address?: HashString, args?: TractorAPIOrderOptions, chainOnly: boolean = false) {
  const chainId = useChainId();
  const client = usePublicClient({ chainId });
  const diamond = useProtocolAddress();
  const temperature = useTemperature();

  //
  const ordersQuery = useTractorAPISowOrders(address, args);

  // check if the API data exists, is not loading, and is not an error
  const ordersAPIDataExists = Boolean(
    ordersQuery.data?.orders.length && !ordersQuery.isLoading && !ordersQuery.isError,
  );

  // only run the chain query if we have a client, a max temperature, the API data exists, and we have a latest block reference.
  const orderChainQueryEnabled = chainOnly || Boolean(client && temperature.max.gt(0) && ordersAPIDataExists);

  /**
   * If the orders API request failed, fetch since the TRACTOR_DEPLOYMENT_BLOCK
   * otherwise,
   * - DEV, use a 24 hour lookback to allow for forwarding seasons locally
   * - PROD, use a 1 hour lookback
   */
  const lookbackBlocks = getLookbackBlocks(chainOnly, !!ordersQuery.error);

  const ordersChainQuery = useQuery({
    queryKey: queryKeys.tractor.sowOrdersV0Chain({ lookbackBlocks }),
    queryFn: async () => {
      if (temperature.max.lte(0) || !client) {
        return;
      }
      const latestBlock = await client.getBlock({ blockTag: "latest" });
      const data = await loadOrderbookData(
        address,
        diamond,
        client,
        latestBlock,
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
    enabled: orderChainQueryEnabled,
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

  return 1;
}
