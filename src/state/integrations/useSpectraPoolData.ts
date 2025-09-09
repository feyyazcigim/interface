import { API_SERVICES } from "@/constants/endpoints";
import { SPECTRA_CURVE_POOLS } from "@/constants/integrations";
import { defaultQuerySettings } from "@/constants/query";
import { resolveChainId } from "@/utils/chain";
import { baseNetwork as base } from "@/utils/wagmi/chains";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useChainId } from "wagmi";
import { ProtocolIntegrationQueryReturnType, SpectraCurvePool, SpectraPoolData } from "./types";

export type SpectraPoolsResponse = SpectraPoolData[];

export const useSpectraPoolData = (): ProtocolIntegrationQueryReturnType<SpectraPoolsResponse> => {
  const chainId = useChainId();

  const endpoint = getSpectraPoolsEndpoint(resolveChainId(chainId));

  const selectByNameStable = useCallback((data: SpectraPoolsResponse) => selectByName(data, chainId), [chainId]);

  const apyQuery = useQuery({
    queryKey: ["spectra-pools-summary", chainId],
    queryFn: async () => {
      if (!endpoint) return;
      return fetch(endpoint, { method: "GET" }).then((r) => r.json());
    },
    enabled: !!endpoint,
    select: selectByNameStable,
    ...defaultQuerySettings,
  });

  return {
    ...apyQuery,
    integration: "SPECTRA",
  };
};

// ---------- FUNCTIONS ----------

const urlParams = new URLSearchParams({ source: "pinto" });

const getSpectraPoolsEndpoint = (chainId: number) => {
  if (!API_SERVICES.spectra) return;

  if (chainId === base.id) {
    return `${API_SERVICES.spectra}/api/v1/${base.name.toLowerCase()}/pools?${urlParams.toString()}`;
  }

  return;
};

function selectByName(response: SpectraPoolsResponse, chainId: number): SpectraPoolData[] {
  const spectraPool = SPECTRA_CURVE_POOLS[resolveChainId(chainId)];

  return response.filter((poolData) =>
    poolData.pools.some((pool) => pool.address.toLowerCase() === spectraPool.pool.toLowerCase()),
  );
}
