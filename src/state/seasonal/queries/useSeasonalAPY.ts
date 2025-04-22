import { SeasonalChartData } from "@/components/charts/SeasonalChart";
import { API_SERVICES } from "@/constants/endpoints";
import { PINTO } from "@/constants/tokens";
import useSeasonsData from "@/state/useSeasonsData";
import { UseSeasonalResult } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

type PintoVapyResponse = {
  [season: number]: {
    bean: number;
    stalk: number;
    ownership: number;
  };
};

export function useSeasonalAPY(fromSeason: number, toSeason: number): UseSeasonalResult {
  // HistoricalAPY from Pinto API
  const apyDataQuery = useQuery({
    queryKey: ["api", "vapy", "pinto", "raw", fromSeason, toSeason],
    queryFn: async (): Promise<PintoVapyResponse> => {
      const res = await fetch(`${API_SERVICES.pinto}/silo/yield-history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: PINTO.address.toLowerCase(),
          emaWindow: 720,
          initType: "AVERAGE",
          fromSeason,
          toSeason,
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return await res.json();
    },
    staleTime: Infinity,
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
      const result: SeasonalChartData[] = [];
      for (const season in apyDataQuery.data) {
        result.push({
          season: Number(season),
          value: apyDataQuery.data[season].bean,
          timestamp: seasonToTimestamp[season],
        });
      }
      return result;
    },
    enabled: Object.keys(apyDataQuery.data || {}).length > 0 && !!seasonToTimestamp,
    staleTime: Infinity,
  });

  return {
    data: transformQuery.data ?? undefined,
    isLoading: apyDataQuery.isLoading || transformQuery.isLoading,
    isError: apyDataQuery.isError || transformQuery.isError,
  };
}
