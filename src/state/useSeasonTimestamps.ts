import { API_SERVICES } from "@/constants/endpoints";
import { UseQueryResult, useQuery } from "@tanstack/react-query";

type SeasonsTimestampAPIResponse = {
  [season: number]: {
    timestamp: string;
  };
};

export type SeasonTimestamps = {
  [season: number]: Date;
};

export function useSeasonTimestamps(): UseQueryResult<SeasonTimestamps> {
  const query = useQuery({
    queryKey: ["api", "seasons", "timestamp"],
    queryFn: async (): Promise<SeasonsTimestampAPIResponse> => {
      const res = await fetch(`${API_SERVICES.pinto}/seasons?info=timestamp`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return await res.json();
    },
    select: (data: SeasonsTimestampAPIResponse): SeasonTimestamps => {
      const formatted = {};
      for (const season in data) {
        formatted[season] = new Date(data[season].timestamp);
      }
      return formatted;
    },
    staleTime: Infinity,
    gcTime: 20 * 60 * 1000,
  });

  return query;
}
