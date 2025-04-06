import { request } from "http";
import { ChartSetup } from "@/state/useChartSetupData";
import { useSeason } from "@/state/useSunData";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { useChainId } from "wagmi";

/**
 * Custom hook to fetch ALL field data for all seasons using parallel queries
 * Divides the seasons into chunks and fetches them in parallel for maximum efficiency
 * @param {string} endpoint - GraphQL API endpoint
 * @param {string} field - Field identifier
 * @param {number} chunkSize - Number of seasons per chunk/query (fixed at 1000)
 * @returns {Object} - Combined data and loading states
 */

interface AdvancedQueryProps {
  selectedCharts: number[];
  chartSetupData: ChartSetup[];
  chunkSize?: number;
}
export const useAdvancedQuery = ({ selectedCharts, chartSetupData, chunkSize = 1000 }: AdvancedQueryProps) => {
  const currentSeason = useSeason();
  const chainId = useChainId();

  // Only enable when we have everything we need
  // const enabled = !!currentSeason && !!endpoint && !!field;

  // Calculate how many queries we need
  const queryCount = enabled ? Math.ceil(currentSeason / chunkSize) : 0;

  // Create an array of query configurations based current season and selected items
  const queryConfigs = useMemo(() => {
    const configs = [];

    // if (!enabled) return configs;

    selectedCharts.forEach((selectedChart, index) => {
      const chart = chartSetupData[selectedChart];
      for (let i = 0; i < queryCount; i++) {
        // For the first chunk (i=0), we want season_gt to be 0 to include season 1
        // For subsequent chunks, we want season_gt to be i * chunkSize
        const seasonGt = i * chunkSize;

        configs.push({
          queryKey: [chart.id, chart.context, chainId, seasonGt, currentSeason],
          queryFn: async () => {
            const variables = {
              season_gt: seasonGt,
              first: chunkSize,
            };

            const data = await request(endpoint, ADVANCED_FIELD_QUERY, variables);
            return data.seasons || [];
          },
          // Enable automatic retries for failed queries
          retry: 3,
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          enabled,
        });
      }
    });

    return configs;
  }, [endpoint, field, chunkSize, currentSeason, enabled]);

  // Execute all queries in parallel
  const results = useQueries(queryConfigs);

  // Calculate overall loading and error states
  const isLoading = results.some((result) => result.isLoading);
  const isFetching = results.some((result) => result.isFetching);
  const isError = results.some((result) => result.isError && !result.isFetching);
  const error = results.find((result) => result.error)?.error;

  // Count failed queries that have exhausted their retry attempts
  const failedQueries = results.filter((result) => result.isError && !result.isFetching).length;

  // Function to manually refetch any failed queries
  const refetchFailedQueries = () => {
    results.forEach((result) => {
      if (result.isError && !result.isFetching) {
        result.refetch();
      }
    });
  };

  // Combine results from all queries
  const combinedData = useMemo(() => {
    if (!results.length) return [];

    // Only process successful queries
    const successfulResults = results
      .filter((result) => result.status === "success" && result.data)
      .map((result) => result.data)
      .flat();

    // Create a Map to ensure uniqueness by season number
    const uniqueSeasons = new Map();
    successfulResults.forEach((season) => {
      if (season && season.season) {
        uniqueSeasons.set(season.season, season);
      }
    });

    // Convert to array and sort by season
    return Array.from(uniqueSeasons.values()).sort((a, b) => a.season - b.season);
  }, [results]);

  // Calculate overall status
  const status = isLoading ? "loading" : isError ? "error" : "success";
  const isSuccess = status === "success";

  // Calculate completion percentage
  const completedQueries = results.filter((result) => result.isSuccess).length;
  const completionPercentage = queryCount > 0 ? Math.round((completedQueries / queryCount) * 100) : 0;

  return {
    data: combinedData,
    isLoading,
    isFetching,
    isError,
    isSuccess,
    error,
    status,
    completionPercentage,
    totalSeasons: combinedData.length,
    totalQueries: queryCount,
    completedQueries,
    failedQueries,
    refetchFailedQueries,
  };
};
