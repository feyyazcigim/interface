import { TV } from "@/classes/TokenValue";
import { TIME_TO_BLOCKS } from "@/constants/blocks";
import { defaultQuerySettingsMedium } from "@/constants/query";
import { MAIN_TOKEN } from "@/constants/tokens";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { getChainConstant } from "@/hooks/useChainConstant";
import { OrderbookEntry, loadOrderbookData } from "@/lib/Tractor";
import TractorAPI, { TractorAPIOrderOptions, TractorAPIOrdersResponse } from "@/lib/Tractor/api";
import { TEMPERATURE_DECIMALS } from "@/state/protocol/field";
import { queryKeys } from "@/state/queryKeys";
import { resolveChainId } from "@/utils/chain";
import { HashString } from "@/utils/types.generic";
import { isDev } from "@/utils/utils";
import { DefaultError, QueryObserverOptions, UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useChainId, usePublicClient } from "wagmi";
import { useTemperature } from "../useFieldData";

const getLookbackBlocks = (chainOnly: boolean, error: boolean) => {
  if (chainOnly || error) return undefined;
  return isDev() ? TIME_TO_BLOCKS.day : TIME_TO_BLOCKS.hour;
};

const useTractorAPISowOrders = <TData extends OrderbookEntry[] = OrderbookEntry[]>(
  address?: HashString,
  args?: TractorAPIOrderOptions,
  select?: (data: TractorAPIOrdersResponse | undefined) => TData,
) => {
  const chainId = useChainId();

  const defaultSelect = useMemo(() => transformAPIOrderbookData(chainId), [chainId]);

  return useQuery<TractorAPIOrdersResponse | undefined, Error, TData>({
    queryKey: queryKeys.tractor.sowOrdersV0(args),
    queryFn: async () => {
      if (!chainId) return;
      const options = { orderType: "SOW_V0", cancelled: false, ...args } satisfies TractorAPIOrderOptions;
      if (address) options.publisher = address;

      return TractorAPI.getOrders(options);
    },
    enabled: !!chainId,
    select: select ?? (defaultSelect as (data: TractorAPIOrdersResponse | undefined) => TData),
    ...defaultQuerySettingsMedium,
  });
};

const transformAPIOrderbookData = (chainId: number) => (response: TractorAPIOrdersResponse | undefined) => {
  if (!response) return [];

  const mainToken = getChainConstant(resolveChainId(chainId), MAIN_TOKEN);

  const res = response.orders.map((order): OrderbookEntry => {
    const totalAmountToSow = TV.fromBlockchain(order.blueprintData.totalAmountToSow, mainToken.decimals);
    const pintoSownCounter = TV.fromBlockchain(order.blueprintData.pintoSownCounter, mainToken.decimals);
    const cascadeAmountFunded = TV.fromBlockchain(order.blueprintData.cascadeAmountFunded, mainToken.decimals);
    const maxAmountToSowPerSeason = TV.fromBlockchain(order.blueprintData.maxAmountToSowPerSeason, mainToken.decimals);

    return {
      requisition: {
        blueprint: {
          publisher: order.publisher,
          data: order.data,
          operatorPasteInstrs: order.operatorPasteInstrs,
          maxNonce: BigInt(order.maxNonce),
          startTime: BigInt(new Date(order.startTime).getTime()),
          endTime: BigInt(new Date(order.endTime).getTime()),
        },
        blueprintHash: order.blueprintHash,
        signature: order.signature,
      },
      withdrawalPlan: undefined,
      blockNumber: order.publishedBlock,
      timestamp: Number(new Date(order.publishedTimestamp).getTime()),
      isCancelled: order.cancelled,
      requisitionType: order.orderType === "SOW_V0" ? "sowBlueprintv0" : "unknown",
      pintosLeftToSow: totalAmountToSow.sub(pintoSownCounter),
      totalAvailablePinto: cascadeAmountFunded,
      currentlySowable: cascadeAmountFunded,
      minTemp: TV.fromBlockchain(order.blueprintData.minTemp, TEMPERATURE_DECIMALS),
      amountSowableNextSeason: TV.min(cascadeAmountFunded, maxAmountToSowPerSeason),
      amountSowableNextSeasonConsideringAvailableSoil: TV.ZERO,
      estimatedPlaceInLine: TV.ZERO,
    };
  });

  console.debug("[TRACTOR/useTractorAPISowOrders/transformAPIOrderbookData] RES", res);

  return res;
};

type UseTractorSowOrderbookOptions<T> = {
  address?: HashString;
  args?: TractorAPIOrderOptions;
  chainOnly?: boolean;
} & Pick<QueryObserverOptions<OrderbookEntry[] | undefined, DefaultError, T>, "select">;

export function useTractorSowOrderbook<T = OrderbookEntry[]>({
  address,
  args,
  chainOnly = false,
  select,
}: UseTractorSowOrderbookOptions<T> = {}) {
  const chainId = useChainId();
  const client = usePublicClient({ chainId });
  const diamond = useProtocolAddress();
  const temperature = useTemperature();

  //
  const ordersQuery = useTractorAPISowOrders(address, args);

  // check if the API data exists, is not loading, and is not an error
  const ordersAPIDataExists = Boolean(ordersQuery.data?.length && !ordersQuery.isLoading && !ordersQuery.isError);

  // only run the chain query if we have a client, a max temperature, the API data exists, and we have a latest block reference.
  const orderChainQueryEnabled = chainOnly || Boolean(client && temperature.max.gt(0) && ordersAPIDataExists);

  /**
   * If the orders API request failed, fetch since the TRACTOR_DEPLOYMENT_BLOCK
   * otherwise,
   * - DEV, use a 24 hour lookback to allow for forwarding seasons locally
   * - PROD, use a 1 hour lookback
   */
  const lookbackBlocks = getLookbackBlocks(chainOnly, !!ordersQuery.error);

  const ordersChainQuery = useQuery<OrderbookEntry[] | undefined, DefaultError, T>({
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

      console.debug("[TRACTOR/useTractorSowOrderbook/ordersChainQuery] DATA", {
        lookbackBlocks,
        data,
      });

      return data;
    },
    enabled: orderChainQueryEnabled,
    select: select,
    ...defaultQuerySettingsMedium,
  });

  // useEffect(() => {
  //   if (!ordersChainQuery.data || !ordersQuery.data) {
  //     return;
  //   }

  //   const map = new Map<
  //     string,
  //     {
  //       chain?: OrderbookEntry;
  //       api?: OrderbookEntry;
  //     }
  //   >();

  //   ordersQuery.data.forEach((order) => {
  //     map.set(order.requisition.blueprintHash.toLowerCase(), {
  //       chain: undefined,
  //       api: order,
  //     });
  //   });

  //   ordersChainQuery.data.forEach((order) => {
  //     const existing = map.get(order.requisition.blueprintHash.toLowerCase());

  //     if (existing) {
  //       map.set(order.requisition.blueprintHash.toLowerCase(), {
  //         ...existing,
  //         chain: order,
  //       });
  //     }
  //   });

  //   console.log("[TRACTOR/useTractorSowOrdersMAP] MAP", map);
  // }, [ordersChainQuery.data, ordersQuery.data]);

  return ordersChainQuery;
}
