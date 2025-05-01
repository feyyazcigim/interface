import { TV } from "@/classes/TokenValue";
import { TIME_TO_BLOCKS } from "@/constants/blocks";
import { defaultQuerySettingsMedium } from "@/constants/query";
import { MAIN_TOKEN } from "@/constants/tokens";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { getChainConstant } from "@/hooks/useChainConstant";
import {
  OrderbookEntry,
  TractorAPI,
  TractorAPIOrderOptions,
  TractorAPIOrdersResponse,
  loadOrderbookData,
} from "@/lib/Tractor";
import { TEMPERATURE_DECIMALS } from "@/state/protocol/field";
import { queryKeys } from "@/state/queryKeys";
import { useTemperature } from "@/state/useFieldData";
import { resolveChainId } from "@/utils/chain";
import { HashString } from "@/utils/types.generic";
import { isDev } from "@/utils/utils";
import { DefaultError, QueryObserverOptions, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useChainId, usePublicClient } from "wagmi";

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

    // const isComplete =

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
      isComplete: order.blueprintData.orderComplete,
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

const datas = [
  {
    lastUpdated: 29653896,
    orders: [
      {
        blueprintHash: "0x8f272da87c6a0c8a8ea60250e7e096b23bb480223c65ca49bb137df755f80208",
        orderType: "SOW_V0",
        publisher: "0xA5B0461cc01637D1A700b4E42085F0E7616B7796",
        data: "0x36bfafbd0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000042000000000000000000000000000000000000000000000000000000000000003a4b452c7ae0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000bb0a41927895f8ca2b4eccc659ba158735fcf28b000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000002e000000000000000000000000000000000000000000000000000000000000002443ca8e1b20000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001a00000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000ee6b28000000000000000000000000000000000000000000000000000000000004c4b4000000000000000000000000000000000000000000000000000000000004c4b400000000000000000000000000000000000000000000000000000000047868c000000000000000000000000000000000000000000000000000000223ed2375b8000000000000000000000000000000000000000000000021e19e0c9bab2400000000000000000000000000000000000000000000000000000000000000000012c0000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000249f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        operatorPasteInstrs: [""],
        maxNonce: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        startTime: "2025-04-27T16:32:18.000Z",
        endTime: "+275760-09-13T00:00:00.000Z",
        signature:
          "0xbc1063725082b050d374874b352f605effa0cd7c23ddc48a4bf7b3d47a427cbf16d8551957e2016b802e3047daecff81124f38cec56cc554f493712b2905d6e11c",
        publishedTimestamp: "2025-04-28T16:32:27.000Z",
        publishedBlock: 29534300,
        // $0.15
        beanTip: "150000",
        cancelled: false,
        blueprintData: {
          blueprintHash: "0x8f272da87c6a0c8a8ea60250e7e096b23bb480223c65ca49bb137df755f80208",
          pintoSownCounter: "225000000",
          lastExecutedSeason: 3894,
          orderComplete: false,
          amountFunded: "25000000",
          cascadeAmountFunded: "25000000",
          sourceTokenIndices: ["0"],
          totalAmountToSow: "250000000",
          minAmountToSowPerSeason: "5000000",
          maxAmountToSowPerSeason: "5000000",
          minTemp: "1200000000",
          maxPodlineLength: "37653210160000",
          maxGrownStalkPerBdv: "10000000000000000000000",
          runBlocksAfterSunrise: "300",
          slippageRatio: "1000000000000000000",
        },
        executionStats: {
          executionCount: 45,
          latestExecution: "2025-05-01T06:10:43.000Z",
        },
      },
      {
        blueprintHash: "0xc31676b117ac86b14831c7a7ac40c9f4233c5610345df69189803893a48ff658",
        orderType: "SOW_V0",
        publisher: "0xA5B0461cc01637D1A700b4E42085F0E7616B7796",
        data: "0x36bfafbd0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000042000000000000000000000000000000000000000000000000000000000000003a4b452c7ae0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000bb0a41927895f8ca2b4eccc659ba158735fcf28b000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000002e000000000000000000000000000000000000000000000000000000000000002443ca8e1b20000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000011e1a30000000000000000000000000000000000000000000000000000000000004c4b4000000000000000000000000000000000000000000000000000000000004c4b400000000000000000000000000000000000000000000000000000000047868c000000000000000000000000000000000000000000000000000000201e010df68000000000000000000000000000000000000000000000021e19e0c9bab2400000000000000000000000000000000000000000000000000000000000000000012c0000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000249f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        operatorPasteInstrs: [""],
        maxNonce: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        startTime: "2025-04-23T08:03:42.000Z",
        endTime: "+275760-09-13T00:00:00.000Z",
        signature:
          "0x84f11673d0a315556b5c9eb5b51245bbc104166592d1e0dc0ed13a365e79a32623aa0cbae3653d61da27f9dec62bfca7a83031cb722d518c0b1fd941824b4d661b",
        publishedTimestamp: "2025-04-24T08:03:51.000Z",
        publishedBlock: 29346242,
        // $0.15
        beanTip: "150000",
        cancelled: false,
        blueprintData: {
          blueprintHash: "0xc31676b117ac86b14831c7a7ac40c9f4233c5610345df69189803893a48ff658",
          pintoSownCounter: "280000000",
          lastExecutedSeason: 3793,
          orderComplete: true,
          amountFunded: "20000000",
          cascadeAmountFunded: "20000000",
          sourceTokenIndices: ["0"],
          totalAmountToSow: "300000000",
          minAmountToSowPerSeason: "5000000",
          maxAmountToSowPerSeason: "5000000",
          minTemp: "1200000000",
          maxPodlineLength: "35313238800000",
          maxGrownStalkPerBdv: "10000000000000000000000",
          runBlocksAfterSunrise: "300",
          slippageRatio: "1000000000000000000",
        },
        executionStats: {
          executionCount: 60,
          latestExecution: "2025-04-27T01:10:21.000Z",
        },
      },
      {
        blueprintHash: "0x8ea4d8d226b72c3df0e13b3e916f2073d338ce4961a524f270833b2334aa4efa",
        orderType: "SOW_V0",
        publisher: "0xA5B0461cc01637D1A700b4E42085F0E7616B7796",
        data: "0x36bfafbd0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000042000000000000000000000000000000000000000000000000000000000000003a4b452c7ae0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000bb0a41927895f8ca2b4eccc659ba158735fcf28b000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000002e000000000000000000000000000000000000000000000000000000000000002443ca8e1b20000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001a00000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000ee6b28000000000000000000000000000000000000000000000000000000000009896800000000000000000000000000000000000000000000000000000000000989680000000000000000000000000000000000000000000000000000000004d7c6d0000000000000000000000000000000000000000000000000000002110eb5ec55000000000000000000000000000000000000000000000021e19e0c9bab2400000000000000000000000000000000000000000000000000000000000000000012c0000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003d09000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        operatorPasteInstrs: [""],
        maxNonce: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        startTime: "2025-04-21T18:18:57.000Z",
        endTime: "+275760-09-13T00:00:00.000Z",
        signature:
          "0x17302f7159011064e428b80fc8290b03c548f0f2f7e83dfa5e6cb0e6b4ac90193a1df928bf89033c04d5e4302f5e44246b7411cb8c50a49251de9622d473bcef1c",
        publishedTimestamp: "2025-04-22T18:19:11.000Z",
        publishedBlock: 29278302,
        // $0.25
        beanTip: "0.250000",
        cancelled: false,
        blueprintData: {
          blueprintHash: "0x8ea4d8d226b72c3df0e13b3e916f2073d338ce4961a524f270833b2334aa4efa",
          pintoSownCounter: "230.000000",
          lastExecutedSeason: 3717,
          orderComplete: true,
          amountFunded: "20.000000",
          cascadeAmountFunded: "20.000000",
          sourceTokenIndices: ["0"],
          totalAmountToSow: "250.000000",
          minAmountToSowPerSeason: "10.000000",
          maxAmountToSowPerSeason: "10.000000",
          minTemp: "1300.000000",
          maxPodlineLength: "36,356,552.050000",
          maxGrownStalkPerBdv: "10000000000000000000000",
          runBlocksAfterSunrise: "300",
          slippageRatio: "1.000000000000000000",
        },
        executionStats: {
          executionCount: 25,
          latestExecution: "2025-04-23T21:10:03.000Z",
        },
      },
    ],
    totalRecords: 3,
  },
];
