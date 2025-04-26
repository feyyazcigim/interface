import { API_SERVICES } from "@/constants/endpoints";
import { PINTO } from "@/constants/tokens";
import useSeasonsData from "@/state/useSeasonsData";
import { SeasonalAPYChartData, UseSeasonalAPYResult } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export enum APYWindow {
  DAILY = 24, // 24 hours
  WEEKLY = 168, // 7 days * 24 hours
  MONTHLY = 720, // 30 days * 24 hours
}

export const APY_EMA_WINDOWS = Object.values(APYWindow).filter((v) => typeof v === "number");

type PintoVapyResponse = {
  [season: number]: {
    bean: number;
    stalk: number;
    ownership: number;
  };
};

const fetchApys = async (window: number, fromSeason: number, toSeason: number) => {
  const res = await fetch(`${API_SERVICES.pinto}/silo/yield-history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: PINTO.address.toLowerCase(),
      emaWindow: window,
      initType: "AVERAGE",
      fromSeason,
      toSeason,
    }),
  });
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return await res.json();
};

export function useSeasonalAPYs(fromSeason: number, toSeason: number): UseSeasonalAPYResult {
  // HistoricalAPY from Pinto API
  const apyDataQuery = useQuery({
    queryKey: ["api", "vapy", "pinto", "raw", fromSeason, toSeason],
    queryFn: async (): Promise<PintoVapyResponse[]> => {
      return await Promise.all(APY_EMA_WINDOWS.map((window) => fetchApys(window, fromSeason, toSeason)));
    },
    staleTime: Infinity,
    enabled: fromSeason >= 0 && toSeason > 0,
  });

  // Get mapping of season to timestamp
  const seasonTimestampQuery = useSeasonsData(fromSeason, toSeason);
  const seasonToTimestamp = useMemo(() => {
    if (!seasonTimestampQuery.isFetching) {
      return seasonTimestampQuery.data?.reduce(
        (acc: { [season: number]: Date }, next: { season: number; timestamp: number }) => {
          acc[next.season] = new Date(next.timestamp * 1000);
          return acc;
        },
        {} as Record<number, Date>,
      );
    }
  }, [seasonTimestampQuery.isFetching, seasonTimestampQuery.data]);

  // Transformation is given its own query rather than using select, so it can activate only after
  // the seasonal timestamp mapping is also availabe.
  const transformQuery = useQuery({
    queryKey: ["api", "vapy", "pinto", "transformed", fromSeason, toSeason],
    queryFn: () => {
      if (!apyDataQuery.data) {
        throw new Error("Data not available");
      }

      const result = {};
      for (let i = 0; i < APY_EMA_WINDOWS.length; i++) {
        result[APY_EMA_WINDOWS[i]] = [];
        for (const season in apyDataQuery.data[i]) {
          result[APY_EMA_WINDOWS[i]].push({
            season: Number(season),
            value: apyDataQuery.data[i][season].bean,
            timestamp: seasonToTimestamp[season],
          });
        }
      }
      return result as SeasonalAPYChartData;
    },
    enabled: !!apyDataQuery.data && !!seasonToTimestamp,
    staleTime: Infinity,
  });

  return {
    data: transformQuery.data ?? undefined,
    isLoading: apyDataQuery.isLoading || transformQuery.isLoading,
    isError: apyDataQuery.isError || transformQuery.isError,
  };
}
