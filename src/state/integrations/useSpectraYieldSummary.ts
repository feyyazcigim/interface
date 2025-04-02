import { TV } from "@/classes/TokenValue";
import { spectraCurvePoolABI } from "@/constants/abi/integrations/spectraCurvePoolABI";
import { siloedPintoABI } from "@/constants/abi/siloedPintoABI";
import { API_SERVICES } from "@/constants/endpoints";
import { SPECTRA_CURVE_POOLS } from "@/constants/integrations";
import { MAIN_TOKEN, S_MAIN_TOKEN } from "@/constants/tokens";
import { getNowRounded } from "@/state/protocol/sun";
import { resolveChainId, useChainConstant } from "@/utils/chain";
import { baseNetwork as base } from "@/utils/wagmi/chains";
import { useChainId, useReadContract, useReadContracts } from "wagmi";
import { ProtocolIntegrationQueryReturnType, SpectraCurvePool } from "./types";
import { useQuery } from "@tanstack/react-query";
import { defaultQuerySettings } from "@/constants/query";
import { useSiloWrappedTokenExchangeRateQuery } from "../useSiloWrappedTokenData";
import { useCallback, useMemo } from "react";
import { useSeason } from "../useSunData";
import { toFixedNumber } from "@/utils/format";

export type SpectraYieldSummaryResponse = { apy: number; maxLeverage: number };

const impliedAPYFetchOptions = { method: "GET" } as const;

const urlParams = new URLSearchParams({ source: "pinto" });

export const useSpectraYieldSummary = (): ProtocolIntegrationQueryReturnType<SpectraYieldSummaryResponse> => {
  const siloWrappedToken = useChainConstant(S_MAIN_TOKEN);
  const mainToken = useChainConstant(MAIN_TOKEN);
  const chainId = useChainId();
  const pool = SPECTRA_CURVE_POOLS[resolveChainId(chainId)];

  const season = useSeason();

  const endpoint = getSpectraPoolImpliedAPYEndpoint(chainId, pool);

  const exchangeRateQuery = useSiloWrappedTokenExchangeRateQuery();

  const apyQueryQueryKey = useMemo(() => ["spectra-yield-summary", chainId, season], [chainId, season]);

  const apyQuery = useQuery({
    queryKey: apyQueryQueryKey,
    queryFn: async () => {
      if (!endpoint?.url) return;
      return fetch(endpoint.url, endpoint.options).then((r) => r.json());
    },
    enabled: !!endpoint?.url && !!season,
    select: selectAPYQuery,
    ...defaultQuerySettings,
  });

  const priceOracleQuery = useReadContract({
    address: pool.pool,
    abi: spectraCurvePoolABI,
    functionName: "price_oracle",
    scopeKey: season.toString(),
    query: {
      enabled: !!pool && !!season,
      select: selectPriceOracle,
      ...defaultQuerySettings,
    },
  });

  const refetch = useCallback(
    async () => Promise.all([apyQuery.refetch(), priceOracleQuery.refetch(), exchangeRateQuery.refetch()]),
    [apyQuery, priceOracleQuery, exchangeRateQuery],
  );

  const queryKeys = useMemo(
    () => [apyQueryQueryKey, priceOracleQuery.queryKey, exchangeRateQuery.queryKey],
    [apyQueryQueryKey, priceOracleQuery.queryKey, exchangeRateQuery.queryKey],
  );

  const maxLeverage = (() => {
    if (!exchangeRateQuery.data || !priceOracleQuery.data) return;

    const priceOracle = priceOracleQuery.data;
    const exchangeRate = exchangeRateQuery.data;

    const mul = priceOracle.mul(exchangeRate);

    const leverage = TV.ONE.div(TV.ONE.sub(mul));

    return toFixedNumber(leverage.toNumber(), 2);
  })();

  const data =
    maxLeverage && apyQuery.data
      ? {
        maxLeverage: maxLeverage,
        apy: apyQuery.data,
      }
      : undefined;

  return {
    data,
    isLoading: apyQuery.isLoading || priceOracleQuery.isLoading || exchangeRateQuery.isLoading,
    isError: apyQuery.isError || priceOracleQuery.isError || exchangeRateQuery.isError,
    integrationKey: "SPECTRA",
    queryKeys,
    refetch,
  } as const;
};

// ---------- FUNCTIONS ----------

const selectPriceOracle = (response: bigint) => TV.fromBigInt(response, 18);

const getSpectraPoolImpliedAPYEndpoint = (chainId: number, pool: SpectraCurvePool) => {
  if (!API_SERVICES.spectra) return;
  const resolvedChainId = resolveChainId(chainId);

  const poolAddress = pool.pool.toLowerCase();

  if (resolvedChainId === base.id) {
    const chainName = base.name.toLowerCase();
    return {
      url: `${API_SERVICES.spectra}/api/v1/${chainName}/implied-apy/${poolAddress}?${urlParams.toString()}`,
      options: impliedAPYFetchOptions,
    };
  }

  return;
};

const selectAPYQuery = (response: { time: number; value: number }[]) => {
  const sorted = [...response].sort((a, b) => b.time - a.time);
  const latest = sorted[sorted.length - 1];

  if (!latest) return;

  return latest.value;
};
